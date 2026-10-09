/* Gaze auth UI: login/sign-up modal, Settings account card, Password & Security modal.
 * Requires /auth-client.js (window.GazeAuth) to be loaded first.
 * All dynamic text is inserted with textContent (never innerHTML) to prevent XSS. */
(function () {
  'use strict';

  // Paste your Google OAuth *Web client ID* here (it is public, not a secret).
  // Leave it empty to hide the "Continue with Google" button.
  var GOOGLE_CLIENT_ID = '';

  // localStorage / sessionStorage keys that hold a user's PRIVATE data in the browser.
  // They are wiped on log out so the next person on this device can't see them.
  // To find the names: open DevTools > Application > Local Storage, or run Object.keys(localStorage)
  var CLEAR_ON_LOGOUT = [];

  var $ = function (id) { return document.getElementById(id); };
  var mode = 'login';
  var busy = false;
  var googleStarted = false;
  var armTimer = null;
  var promptedLogin = false;

  /* ---------- small helpers ---------- */

  function toast(message, type) {
    if (typeof window.showToast === 'function') window.showToast(message, type || 'success');
  }
  function openModal(id) { var m = $(id); if (m) m.classList.add('active'); }
  function closeModal(id) { var m = $(id); if (m) m.classList.remove('active'); }
  function isOpen(id) { var m = $(id); return !!(m && m.classList.contains('active')); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function icon(classes) {
    var i = document.createElement('i');
    i.className = classes;
    return i;
  }
  function showError(id, message) {
    var p = $(id);
    if (p) p.textContent = message || '';
  }
  function friendlyError(result) {
    if (result && result.code === 'VALIDATION' && result.details && result.details.length) {
      return result.details.map(function (d) { return d.message; }).join('. ') + '.';
    }
    return (result && result.error) || 'Something went wrong. Try again.';
  }
  function setBusy(button, isBusy, idleText, busyText) {
    busy = isBusy;
    button.disabled = isBusy;
    button.textContent = isBusy ? busyText : idleText;
  }

  function clearUserCache() {
    CLEAR_ON_LOGOUT.forEach(function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
      try { sessionStorage.removeItem(key); } catch (e) { /* ignore */ }
    });
  }

  // The app loads portfolio data once at startup, so after logging in or out
  // we reload the page. That also wipes any private data still held in memory.
  function reloadSoon() {
    setTimeout(function () { api.reload(); }, api.reloadDelay);
  }

  /* ---------- Settings account card ---------- */

  function renderCard(user) {
    var root = $('authAccountCard');
    if (!root) return;
    root.textContent = '';
    var group = el('div', 'settings-group');

    if (!user) {
      var loginBtn = el('button', 'settings-row settings-link');
      loginBtn.type = 'button';
      loginBtn.appendChild(icon('fa-solid fa-right-to-bracket settings-row-icon'));
      loginBtn.appendChild(el('span', 'settings-row-label', 'Log in or sign up'));
      loginBtn.appendChild(icon('fa-solid fa-chevron-right settings-chevron'));
      loginBtn.addEventListener('click', function () { openAuth('login'); });
      group.appendChild(loginBtn);
    } else {
      var emailRow = el('div', 'settings-row');
      emailRow.appendChild(icon('fa-regular fa-envelope settings-row-icon'));
      emailRow.appendChild(el('span', 'settings-row-label', 'Email'));
      emailRow.appendChild(el('span', 'auth-email', user.email));
      group.appendChild(emailRow);

      var outBtn = el('button', 'settings-row settings-link');
      outBtn.type = 'button';
      outBtn.appendChild(icon('fa-solid fa-right-from-bracket settings-row-icon'));
      outBtn.appendChild(el('span', 'settings-row-label', 'Log out'));
      outBtn.addEventListener('click', async function () {
        outBtn.disabled = true;
        await window.GazeAuth.logout();
        clearUserCache();
        toast('Logged out');
        reloadSoon();
      });
      group.appendChild(outBtn);
    }
    root.appendChild(group);
  }

  /* ---------- login / sign-up modal ---------- */

  function setMode(next) {
    mode = next;
    var signup = next === 'signup';
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === next);
    });
    $('authTitle').textContent = signup ? 'Create account' : 'Log in';
    $('authSubmit').textContent = signup ? 'Create account' : 'Log in';
    $('authNameGroup').classList.toggle('auth-hidden', !signup);
    $('authPwHint').classList.toggle('auth-hidden', !signup);
    $('authPassword').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    showError('authError', '');
  }

  function startGoogle() {
    if (googleStarted || !GOOGLE_CLIENT_ID || !window.GazeAuth) return;
    googleStarted = true;
    var wrap = $('authGoogleWrap');
    wrap.classList.remove('auth-hidden'); // show first so Google can measure the width
    window.GazeAuth.googleButton(GOOGLE_CLIENT_ID, $('authGoogleBtn'), function (result) {
      if (result.ok) {
        closeModal('authModal');
        toast('Logged in');
        reloadSoon();
      } else {
        showError('authError', friendlyError(result));
      }
    }).catch(function () {
      googleStarted = false;
      wrap.classList.add('auth-hidden'); // Google blocked/offline: email login still works
    });
  }

  function openAuth(next) {
    setMode(next || 'login');
    $('authPassword').value = '';
    $('authPassword').type = 'password';
    $('authShowPw').textContent = 'Show';
    openModal('authModal');
    startGoogle();
    setTimeout(function () { $('authEmail').focus(); }, 50);
  }

  async function submitAuth(e) {
    e.preventDefault();
    if (busy) return;
    showError('authError', '');

    var email = $('authEmail').value.trim();
    var password = $('authPassword').value;
    if (!email || !password) {
      showError('authError', 'Enter your email and password.');
      return;
    }

    var btn = $('authSubmit');
    var signup = mode === 'signup';
    var idle = signup ? 'Create account' : 'Log in';
    setBusy(btn, true, idle, signup ? 'Creating account…' : 'Logging in…');

    var result = signup
      ? await window.GazeAuth.signup($('authName').value.trim(), email, password)
      : await window.GazeAuth.login(email, password);

    setBusy(btn, false, idle, '');
    if (result.ok) {
      $('authPassword').value = '';
      closeModal('authModal');
      toast(signup ? 'Account created' : 'Logged in');
      reloadSoon();
    } else {
      showError('authError', friendlyError(result));
    }
  }

  /* ---------- password & security modal ---------- */

  function describeDevice(ua) {
    ua = String(ua || '');
    var browser = /Edg\//.test(ua) ? 'Edge'
      : /OPR\/|Opera/.test(ua) ? 'Opera'
      : /Firefox\//.test(ua) ? 'Firefox'
      : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
      : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    var os = /Windows/.test(ua) ? 'Windows'
      : /Android/.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
      : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
      : /Linux/.test(ua) ? 'Linux' : 'unknown device';
    return browser + ' on ' + os;
  }

  function timeAgo(value) {
    var t = new Date(value).getTime();
    if (!t) return 'recently';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 86400 * 14) return Math.floor(s / 86400) + ' d ago';
    return new Date(t).toLocaleDateString();
  }

  async function loadDevices() {
    var list = $('deviceList');
    list.textContent = 'Loading…';
    var r = await window.GazeAuth.sessions();
    list.textContent = '';
    if (!r.ok) {
      list.appendChild(el('p', 'auth-device-meta', 'Could not load devices.'));
      return;
    }
    r.sessions.forEach(function (s) {
      var row = el('div', 'auth-device');
      var info = el('div');
      var nameLine = el('div', 'auth-device-name', describeDevice(s.device));
      if (s.current) nameLine.appendChild(el('span', 'auth-badge', 'This device'));
      info.appendChild(nameLine);
      info.appendChild(el('div', 'auth-device-meta', 'Active ' + timeAgo(s.lastUsedAt)));
      row.appendChild(info);

      if (!s.current) {
        var b = el('button', 'auth-link-btn', 'Log out');
        b.type = 'button';
        b.addEventListener('click', async function () {
          b.disabled = true;
          var res = await window.GazeAuth.revokeSession(s.id);
          if (res.ok) loadDevices(); else b.disabled = false;
        });
        row.appendChild(b);
      }
      list.appendChild(row);
    });
  }

  function openSecurity() {
    if (!window.GazeAuth || !window.GazeAuth.isLoggedIn()) { openAuth('login'); return; }
    $('pwCurrent').value = '';
    $('pwNew').value = '';
    showError('pwError', '');
    resetArm();
    openModal('securityModal');
    loadDevices();
  }

  async function submitPassword(e) {
    e.preventDefault();
    if (busy) return;
    showError('pwError', '');
    var current = $('pwCurrent').value;
    var next = $('pwNew').value;
    if (!current || !next) { showError('pwError', 'Fill in both fields.'); return; }
    if (next.length < 10) { showError('pwError', 'New password must be at least 10 characters.'); return; }

    var btn = $('pwSubmit');
    setBusy(btn, true, 'Update password', 'Updating…');
    var r = await window.GazeAuth.changePassword(current, next);
    setBusy(btn, false, 'Update password', '');
    if (r.ok) {
      $('pwCurrent').value = '';
      $('pwNew').value = '';
      toast('Password updated');
      loadDevices();
    } else {
      showError('pwError', friendlyError(r));
    }
  }

  function resetArm() {
    clearTimeout(armTimer);
    var b = $('logoutAllBtn');
    if (!b) return;
    delete b.dataset.armed;
    b.textContent = 'Log out of all devices';
  }

  async function onLogoutAll() {
    var b = $('logoutAllBtn');
    if (!b.dataset.armed) {            // first tap arms, second tap confirms
      b.dataset.armed = '1';
      b.textContent = 'Tap again to confirm';
      armTimer = setTimeout(resetArm, 4000);
      return;
    }
    resetArm();
    b.disabled = true;
    var ok = await window.GazeAuth.logoutAll();
    b.disabled = false;
    if (ok) {
      clearUserCache();
      closeModal('securityModal');
      toast('Logged out of all devices');
      reloadSoon();
    }
  }

  /* ---------- wiring ---------- */

  function init() {
    if (!window.GazeAuth) {
      console.error('GazeAuth not found: load /auth-client.js before auth-ui.js');
      return;
    }

    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); });
    });
    $('authForm').addEventListener('submit', submitAuth);
    $('pwForm').addEventListener('submit', submitPassword);
    $('logoutAllBtn').addEventListener('click', onLogoutAll);
    $('authShowPw').addEventListener('click', function () {
      var field = $('authPassword');
      var show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      this.textContent = show ? 'Hide' : 'Show';
    });

    ['authModal', 'securityModal'].forEach(function (id) {
      var modal = $(id);
      modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(id); });
    });
    $('authClose').addEventListener('click', function () { closeModal('authModal'); });
    $('securityClose').addEventListener('click', function () { closeModal('securityModal'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal('authModal'); closeModal('securityModal'); }
    });

    var secRow = $('securityRowBtn');
    if (secRow) secRow.addEventListener('click', openSecurity);

    window.GazeAuth.onChange(function (user) {
      renderCard(user);
      if (!user) closeModal('securityModal');
    });

    // A portfolio request was blocked because nobody is logged in: ask them to log in (once per page load)
    window.addEventListener('gaze:login-required', function () {
      if (promptedLogin || isOpen('authModal')) return;
      promptedLogin = true;
      toast('Log in to see your portfolio', 'warning');
      openAuth('login');
    });

    // auth-client.js restores the session by itself; just show whatever state it is in
    var show = function () { renderCard(window.GazeAuth.getUser()); };
    show();
    window.GazeAuth.ready.then(show);
  }

  var api = {
    openLogin: function () { openAuth('login'); },
    openSignup: function () { openAuth('signup'); },
    openSecurity: openSecurity,
    reloadDelay: 600,
    reload: function () { location.reload(); }
  };
  window.GazeAuthUI = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();