// frontend/news.js
// Renders the Gaze news list from GET /api/news.
//
// Markup it expects (see news-section.html): #news-list, #news-status,
// #news-refresh, #news-more and optionally #news-mine.
// Optional hooks:
//   window.GAZE_API_BASE      backend origin, e.g. "https://your-app.onrender.com"
//   window.getNewsTickers()   returns the user's tickers, powers "My stocks only"

(function () {
  'use strict';

  var listEl = document.getElementById('news-list');
  if (!listEl) return; // this page has no news section

  var statusEl = document.getElementById('news-status');
  var refreshBtn = document.getElementById('news-refresh');
  var moreBtn = document.getElementById('news-more');
  var mineBox = document.getElementById('news-mine');

  var API = String(window.GAZE_API_BASE || window.API_BASE || '').replace(/\/+$/, '');
  var TIMEOUT_MS = 10000;

  var cursor = null;      // opaque paging cursor from the server
  var requestId = 0;      // lets us ignore responses that arrive out of order
  var seen = Object.create(null); // story ids already on screen

  // Defence in depth: the server already filters links, but the browser checks
  // again so a compromised backend still cannot inject a javascript: link.
  function safeHref(value) {
    try {
      var u = new URL(value);
      return u.protocol === 'https:' ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  function timeAgo(ts) {
    var mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.round(hrs / 24) + 'd ago';
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function currentTickers() {
    if (!mineBox || !mineBox.checked || typeof window.getNewsTickers !== 'function') return [];
    try {
      return window.getNewsTickers()
        .map(function (t) { return String(t).toUpperCase(); })
        .filter(function (t) { return /^[A-Z0-9]{1,15}$/.test(t); })
        .slice(0, 20);
    } catch (e) {
      return [];
    }
  }

  function emptyNode(text) {
    var p = document.createElement('p');
    p.className = 'news-empty';
    p.textContent = text;
    return p;
  }

  // Built with createElement and textContent only. Text set this way is never
  // parsed as HTML, so a hostile headline cannot run code in your page.
  function buildItem(n) {
    var href = safeHref(n && n.url);
    if (!href || typeof n.title !== 'string') return null;

    var a = document.createElement('a');
    a.className = 'news-item';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer nofollow'; // new tab cannot control this one
    a.referrerPolicy = 'no-referrer';       // publisher does not learn where you came from

    var title = document.createElement('span');
    title.className = 'news-title';
    title.textContent = n.title;

    var meta = document.createElement('span');
    meta.className = 'news-meta';
    meta.textContent = String(n.source || '') + ' \u00b7 ' + timeAgo(Number(n.publishedAt) || Date.now());

    a.appendChild(title);
    a.appendChild(meta);
    return a;
  }

  function fetchPage(tickers, before) {
    var params = new URLSearchParams({ limit: '30' });
    if (tickers.length) params.set('tickers', tickers.join(','));
    if (before) params.set('before', before);

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);

    // credentials: 'omit' because this is public data; no cookies are sent.
    return fetch(API + '/api/news?' + params.toString(), {
      signal: ctrl.signal,
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    })
      .then(function (res) {
        if (res.status === 429) throw new Error('rate_limited');
        if (!res.ok) throw new Error('http_' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.items)) throw new Error('bad_response');
        return data;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function load(append) {
    var id = ++requestId;
    var tickers = currentTickers();

    if (!append) {
      cursor = null;
      seen = Object.create(null);
    }

    if (!append && mineBox && mineBox.checked && tickers.length === 0) {
      listEl.replaceChildren(emptyNode('Add stocks to your watchlist to see matching news.'));
      if (moreBtn) moreBtn.hidden = true;
      setStatus('');
      return Promise.resolve();
    }

    listEl.setAttribute('aria-busy', 'true');
    setStatus('Loading\u2026');

    return fetchPage(tickers, append ? cursor : null)
      .then(function (data) {
        if (id !== requestId) return; // a newer request replaced this one

        if (!append) listEl.replaceChildren();
        data.items.forEach(function (n) {
          if (!n || typeof n.id !== 'string' || seen[n.id]) return;
          var node = buildItem(n);
          if (!node) return;
          seen[n.id] = true;
          listEl.appendChild(node);
        });

        if (!listEl.firstChild) listEl.appendChild(emptyNode('No matching news right now.'));

        cursor = typeof data.nextCursor === 'string' ? data.nextCursor : null;
        if (moreBtn) moreBtn.hidden = !cursor;

        if (data.stale) {
          setStatus('Showing saved headlines. Updates are delayed.');
        } else if (data.updatedAt) {
          setStatus('Updated ' + timeAgo(Number(data.updatedAt)));
        } else {
          setStatus('');
        }
      })
      .catch(function (err) {
        if (id !== requestId) return;
        setStatus(
          err && err.message === 'rate_limited'
            ? 'Too many requests. Try again in a minute.'
            : 'Could not load news. Check your connection and try again.'
        );
      })
      .finally(function () {
        if (id === requestId) listEl.removeAttribute('aria-busy');
      });
  }

  if (refreshBtn) refreshBtn.addEventListener('click', function () { load(false); });
  if (moreBtn) moreBtn.addEventListener('click', function () { if (cursor) load(true); });
  if (mineBox) mineBox.addEventListener('change', function () { load(false); });

  // Lazy loading: nothing is requested until the user opens the News tab, so
  // visitors who never open it cost the server no news requests at all.
  // We watch the tab's "active" class instead of editing switchTab(), so this
  // works however the tab gets opened. Reopening within a minute reuses the list.
  var FRESH_MS = 60 * 1000;
  var lastLoadAt = 0;

  function loadIfDue() {
    if (Date.now() - lastLoadAt < FRESH_MS && listEl.firstChild) return;
    lastLoadAt = Date.now();
    load(false);
  }

  window.loadNews = function () {
    lastLoadAt = Date.now();
    return load(false);
  };

  var tabEl = listEl.closest('.tab-content');
  if (tabEl && typeof MutationObserver === 'function') {
    var wasActive = tabEl.classList.contains('active');
    if (wasActive) loadIfDue();
    new MutationObserver(function () {
      var isActive = tabEl.classList.contains('active');
      if (isActive && !wasActive) loadIfDue();
      wasActive = isActive;
    }).observe(tabEl, { attributes: true, attributeFilter: ['class'] });
  } else {
    loadIfDue(); // no tab wrapper found: just load once
  }
})();
