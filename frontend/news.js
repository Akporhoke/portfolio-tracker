// frontend/news.js
// Gaze Market News — RSS headlines and publisher images.

(function () {
    'use strict';

    var listEl = document.getElementById('news-list');
    if (!listEl) return;

    var featuredEl = document.getElementById('news-featured');
    var statusEl = document.getElementById('news-status');
    var refreshBtn = document.getElementById('news-refresh');
    var moreBtn = document.getElementById('news-more');
    var mineBox = document.getElementById('news-mine');

    var API = String(
        window.GAZE_API_BASE || window.API_BASE || ''
    ).replace(/\/+$/, '');

    var TIMEOUT_MS = 10000;
    var FRESH_MS = 60 * 1000;

    var cursor = null;
    var requestId = 0;
    var seen = Object.create(null);
    var lastLoadAt = 0;

    function safeHref(value) {
        try {
            var url = new URL(value);

            if (
                url.protocol !== 'https:' ||
                !url.hostname ||
                url.username ||
                url.password
            ) {
                return null;
            }

            return url.href;
        } catch (error) {
            return null;
        }
    }

    function timeAgo(timestamp) {
        var mins = Math.max(
            1,
            Math.round((Date.now() - timestamp) / 60000)
        );

        if (mins < 60) return mins + 'm ago';

        var hrs = Math.round(mins / 60);

        if (hrs < 24) return hrs + 'h ago';

        return Math.round(hrs / 24) + 'd ago';
    }

    function setStatus(text) {
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    function currentTickers() {
        if (
            !mineBox ||
            !mineBox.checked ||
            typeof window.getNewsTickers !== 'function'
        ) {
            return [];
        }

        try {
            return window.getNewsTickers()
                .map(function (ticker) {
                    return String(ticker).toUpperCase();
                })
                .filter(function (ticker) {
                    return /^[A-Z0-9]{1,15}$/.test(ticker);
                })
                .slice(0, 20);
        } catch (error) {
            return [];
        }
    }

    function emptyNode(message) {
        var element = document.createElement('p');

        element.className = 'news-empty';
        element.textContent = message;

        return element;
    }

    // --------------------------------------------------
    // IMAGE RENDERING
    // Returns null when there is no usable image, so no
    // placeholder text is ever shown.
    // --------------------------------------------------

    function buildImage(imageUrl, title) {
        var safeImage = safeHref(imageUrl);

        if (!safeImage) return null;

        var wrapper = document.createElement('div');
        wrapper.className = 'news-image-wrap';

        var img = document.createElement('img');

        img.className = 'news-image';
        img.alt = title || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';

        // If the image fails, remove the whole box so the card
        // collapses cleanly to text only.
        img.addEventListener('error', function () {
            wrapper.remove();
        });

        img.src = safeImage;
        wrapper.appendChild(img);

        return wrapper;
    }

    // --------------------------------------------------
    // ARTICLE RENDERING
    // --------------------------------------------------

    function buildItem(article, featured) {
        var href = safeHref(article && article.url);

        if (!href || typeof article.title !== 'string') {
            return null;
        }

        var card = document.createElement('a');

        card.className = featured
            ? 'news-item news-item-featured'
            : 'news-item';

        card.href = href;
        card.target = '_blank';
        card.rel = 'noopener noreferrer nofollow';
        card.referrerPolicy = 'no-referrer';

        var image = buildImage(article.image, article.title);

        if (image) {
            if (featured) {
                image.querySelector('img').loading = 'eager';
            }

            card.appendChild(image);
        }

        var content = document.createElement('div');
        content.className = 'news-item-content';

        if (article.category) {
            var category = document.createElement('span');

            category.className = 'news-category';
            category.textContent = String(article.category);

            content.appendChild(category);
        }

        var title = document.createElement('span');

        title.className = 'news-title';
        title.textContent = article.title;

        content.appendChild(title);

        // Description only on the featured card, like Google Discover.
        if (featured && article.description) {
            var description = document.createElement('span');

            description.className = 'news-description';
            description.textContent = article.description;

            content.appendChild(description);
        }

        var meta = document.createElement('span');

        meta.className = 'news-meta';

        meta.textContent =
            String(article.source || 'News') +
            ' · ' +
            timeAgo(Number(article.publishedAt) || Date.now());

        content.appendChild(meta);
        card.appendChild(content);

        return card;
    }

    // --------------------------------------------------
    // API
    // --------------------------------------------------

    function fetchPage(tickers, before) {
        var params = new URLSearchParams({
            limit: '30'
        });

        if (tickers.length) {
            params.set('tickers', tickers.join(','));
        }

        if (before) {
            params.set('before', before);
        }

        var controller = new AbortController();

        var timer = setTimeout(function () {
            controller.abort();
        }, TIMEOUT_MS);

        return fetch(
            API + '/api/news?' + params.toString(),
            {
                signal: controller.signal,
                credentials: 'omit',
                headers: {
                    Accept: 'application/json'
                }
            }
        )
            .then(function (response) {
                if (response.status === 429) {
                    throw new Error('rate_limited');
                }

                if (!response.ok) {
                    throw new Error('http_' + response.status);
                }

                return response.json();
            })
            .then(function (data) {
                if (!data || !Array.isArray(data.items)) {
                    throw new Error('bad_response');
                }

                return data;
            })
            .finally(function () {
                clearTimeout(timer);
            });
    }

    // --------------------------------------------------
    // NEWS LOADING
    // --------------------------------------------------

    function load(append) {
        var id = ++requestId;
        var tickers = currentTickers();

        if (!append) {
            cursor = null;
            seen = Object.create(null);

            if (featuredEl) {
                featuredEl.replaceChildren();
                featuredEl.hidden = true;
            }
        }

        if (
            !append &&
            mineBox &&
            mineBox.checked &&
            tickers.length === 0
        ) {
            listEl.replaceChildren(
                emptyNode('Add stocks to your watchlist to see matching news.')
            );

            if (moreBtn) moreBtn.hidden = true;

            setStatus('');
            return Promise.resolve();
        }

        listEl.setAttribute('aria-busy', 'true');

        setStatus('Loading headlines...');

        return fetchPage(
            tickers,
            append ? cursor : null
        )
            .then(function (data) {
                if (id !== requestId) return;

                if (!append) {
                    listEl.replaceChildren();
                }

                var articles = data.items.filter(function (article) {
                    return (
                        article &&
                        typeof article.id === 'string' &&
                        !seen[article.id]
                    );
                });

                articles.forEach(function (article) {
                    seen[article.id] = true;
                });

                if (
                    !append &&
                    featuredEl &&
                    articles.length
                ) {
                    var featured = buildItem(
                        articles[0],
                        true
                    );

                    if (featured) {
                        featuredEl.appendChild(featured);
                        featuredEl.hidden = false;
                    }

                    articles = articles.slice(1);
                }

                articles.forEach(function (article) {
                    var card = buildItem(article, false);

                    if (card) {
                        listEl.appendChild(card);
                    }
                });

                if (
                    !listEl.firstChild &&
                    (!featuredEl || featuredEl.hidden)
                ) {
                    listEl.appendChild(
                        emptyNode('No matching news right now.')
                    );
                }

                cursor =
                    typeof data.nextCursor === 'string'
                        ? data.nextCursor
                        : null;

                if (moreBtn) {
                    moreBtn.hidden = !cursor;
                }

                if (data.stale) {
                    setStatus(
                        'Showing saved headlines. Updates are delayed.'
                    );
                } else if (data.updatedAt) {
                    setStatus(
                        'Updated ' +
                        timeAgo(Number(data.updatedAt))
                    );
                } else {
                    setStatus('');
                }
            })
            .catch(function (error) {
                if (id !== requestId) return;

                if (error && error.message === 'rate_limited') {
                    setStatus(
                        'Too many requests. Try again in a minute.'
                    );
                } else {
                    setStatus(
                        'Could not load news. Check your connection and try again.'
                    );
                }
            })
            .finally(function () {
                if (id === requestId) {
                    listEl.removeAttribute('aria-busy');
                }
            });
    }

    // --------------------------------------------------
    // CONTROLS
    // --------------------------------------------------

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function () {
            lastLoadAt = Date.now();
            load(false);
        });
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', function () {
            if (cursor) load(true);
        });
    }

    if (mineBox) {
        mineBox.addEventListener('change', function () {
            load(false);
        });
    }

    // --------------------------------------------------
    // LAZY TAB LOADING
    // --------------------------------------------------

    function loadIfDue() {
        if (
            Date.now() - lastLoadAt < FRESH_MS &&
            (listEl.firstChild ||
                (featuredEl && !featuredEl.hidden))
        ) {
            return;
        }

        lastLoadAt = Date.now();
        load(false);
    }

    window.loadNews = function () {
        lastLoadAt = Date.now();
        return load(false);
    };

    var tabEl = listEl.closest('.tab-content');

    if (
        tabEl &&
        typeof MutationObserver === 'function'
    ) {
        var wasActive = tabEl.classList.contains('active');

        if (wasActive) {
            loadIfDue();
        }

        new MutationObserver(function () {
            var isActive = tabEl.classList.contains('active');

            if (isActive && !wasActive) {
                loadIfDue();
            }

            wasActive = isActive;
        }).observe(tabEl, {
            attributes: true,
            attributeFilter: ['class']
        });
    } else {
        loadIfDue();
    }

})();