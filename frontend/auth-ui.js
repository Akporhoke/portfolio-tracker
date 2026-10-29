/* Gaze auth UI: login/sign-up modal, Settings account card, Password & Security modal.
 * Requires /auth-client.js (window.GazeAuth) to be loaded first.
 * All dynamic text is inserted with textContent (never innerHTML) to prevent XSS. */
(function () {
  'use strict';

  // Paste your Google OAuth *Web client ID* here (it is public, not a secret).
  // Leave it empty to hide the "Continue with Google" button.
  var GOOGLE_CLIENT_ID = '265369795290-1hesg3lpgnhp8pkqv5gajd8aetji3sv6.apps.googleusercontent.com';

  // Browser-storage keys that hold a user's PRIVATE data (found in app.js).
  // They are wiped on log out so the next person on this device can't see them.
  // 'portfolioTrackerCurrency' (USD/NGN choice) is only a preference, so it stays.
  var CLEAR_ON_LOGOUT = [
    'portfolioTrackerState',            // cached portfolio, watchlist, sold, settings, display name
    'portfolioTrackerLocalActivity',    // local activity log
    'portfolioTrackerActivityClearedAt'
  ];

  var $ = function (id) { return document.getElementById(id); };
  var mode = 'login';
  var busy = false;
  var googleStarted = false;
  var armTimer = null;
  var promptedLogin = false;

  /* ---------- small helpers ---------- */

  function toast(message, type, action, duration) {
    if (typeof window.showToast === 'function') window.showToast(message, type || 'success', action || null, duration);
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

  // app.js owns the header; ask it to redraw (it falls back to the account name)
  function refreshHeader() {
    if (typeof window.updateHeader === 'function') {
      try { window.updateHeader(); } catch (e) { console.error(e); }
    }
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
      if (user.emailVerified) {
        emailRow.appendChild(el('span', 'auth-badge', 'Verified'));
      } else {
        var verifyBtn = el('button', 'auth-link-btn', 'Verify email');
        verifyBtn.type = 'button';
        verifyBtn.addEventListener('click', function () { sendVerification(verifyBtn); });
        emailRow.appendChild(verifyBtn);
      }
      group.appendChild(emailRow);

      var outBtn = el('button', 'settings-row settings-link');
      outBtn.type = 'button';
      outBtn.appendChild(icon('fa-solid fa-right-from-bracket settings-row-icon'));
      outBtn.appendChild(el('span', 'settings-row-label', 'Log out'));
outBtn.addEventListener('click', async function() {
  outBtn.disabled = true;
  try {
    await window.GazeAuth.logout();
  } finally {
    clearUserCache();
  }
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
    var forgot = next === 'forgot';
    document.querySelectorAll('.auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === next);
    });
    var tabs = document.querySelector('.auth-tabs');
    if (tabs) tabs.classList.toggle('auth-hidden', forgot);
    $('authForm').classList.toggle('auth-hidden', forgot);
    var fForm = $('forgotForm');
    if (fForm) fForm.classList.toggle('auth-hidden', !forgot);
    var fRow = $('authForgotRow');
    if (fRow) fRow.classList.toggle('auth-hidden', next !== 'login');
    var gWrap = $('authGoogleWrap');
    if (gWrap) { if (forgot) gWrap.classList.add('auth-hidden'); else if (googleStarted) gWrap.classList.remove('auth-hidden'); }
    if (forgot) { showError('forgotError', ''); if ($('forgotOk')) $('forgotOk').textContent = ''; }
    $('authTitle').textContent = forgot ? 'Reset password' : signup ? 'Create account' : 'Log in';
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

  /* ---------- forgot password ---------- */

  function ensureAuthExtraStyles() {
    if ($('authExtraStyles')) return;
    var style = document.createElement('style');
    style.id = 'authExtraStyles';
    style.textContent =
      '.auth-forgot-row{display:flex;justify-content:flex-end;margin:-6px 0 8px}' +
      '.auth-link{background:none;border:0;color:inherit;opacity:.75;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer;padding:6px 0}' +
      '.auth-link:hover{opacity:1}' +
      '.auth-ok{color:#16a34a;font-size:14px;line-height:1.45;margin:8px 0 12px}' +
      '.auth-ok:empty{display:none}' +
      '.auth-forgot-intro{font-size:14px;line-height:1.45;opacity:.75;margin:0 0 14px}' +
      '.auth-back-row{text-align:center;margin-top:6px}';
    document.head.appendChild(style);
  }

  function buildForgotView() {
    ensureAuthExtraStyles();

    // "Forgot password?" link under the password box (login view only)
    var row = el('div', 'auth-forgot-row');
    row.id = 'authForgotRow';
    var link = el('button', 'auth-link', 'Forgot password?');
    link.type = 'button';
    link.id = 'authForgotLink';
    row.appendChild(link);
    $('authError').parentNode.insertBefore(row, $('authError'));

    // the reset-request form itself
    var form = document.createElement('form');
    form.id = 'forgotForm';
    form.noValidate = true;
    form.className = 'auth-hidden';
    form.appendChild(el('p', 'auth-forgot-intro', 'Enter the email you signed up with and we will send you a link to choose a new password.'));

    var group = el('div', 'form-group');
    var label = el('label', '', 'Email');
    label.setAttribute('for', 'forgotEmail');
    var input = document.createElement('input');
    input.type = 'email';
    input.id = 'forgotEmail';
    input.autocomplete = 'email';
    input.setAttribute('inputmode', 'email');
    input.placeholder = 'you@example.com';
    group.appendChild(label);
    group.appendChild(input);
    form.appendChild(group);

    var err = el('p', 'auth-error');
    err.id = 'forgotError';
    err.setAttribute('role', 'alert');
    form.appendChild(err);

    var ok = el('p', 'auth-ok');
    ok.id = 'forgotOk';
    ok.setAttribute('role', 'status');
    form.appendChild(ok);

    var send = el('button', 'btn-primary btn-full', 'Send reset link');
    send.type = 'submit';
    send.id = 'forgotSend';
    form.appendChild(send);

    var backRow = el('div', 'auth-back-row');
    var back = el('button', 'auth-link', 'Back to log in');
    back.type = 'button';
    back.id = 'forgotBack';
    backRow.appendChild(back);
    form.appendChild(backRow);

    $('authForm').insertAdjacentElement('afterend', form);

    link.addEventListener('click', function () {
      setMode('forgot');
      input.value = $('authEmail').value.trim();
      setTimeout(function () { input.focus(); }, 50);
    });
    back.addEventListener('click', function () { setMode('login'); });
    form.addEventListener('submit', submitForgot);
  }

  async function submitForgot(e) {
    e.preventDefault();
    if (busy) return;
    showError('forgotError', '');
    $('forgotOk').textContent = '';

    var email = $('forgotEmail').value.trim();
    if (!email || email.indexOf('@') < 1) {
      showError('forgotError', 'Enter the email you signed up with.');
      return;
    }
    var btn = $('forgotSend');
    setBusy(btn, true, 'Send reset link', 'Sending…');
    var r = await window.GazeAuth.forgotPassword(email);
    setBusy(btn, false, 'Send reset link', '');
    if (r.ok) {
      $('forgotOk').textContent = r.message || 'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.';
    } else {
      showError('forgotError', friendlyError(r));
    }
  }

  /* ---------- email verification ---------- */

  var remindedVerify = false;

  async function sendVerification(btn) {
    if (btn) btn.disabled = true;
    var r = await window.GazeAuth.resendVerification();
    if (btn) btn.disabled = false;
    if (r.ok && r.alreadyVerified) {
      await window.GazeAuth.refreshUser();
      toast('Your email is already confirmed');
    } else if (r.ok) {
      toast('Confirmation email sent. Check your inbox and spam folder.');
    } else {
      toast(friendlyError(r), 'warning');
    }
  }

  // Once per page load, nudge people whose email is not confirmed yet
  function maybeRemindVerify() {
    var u = window.GazeAuth.getUser();
    if (!u || u.emailVerified || remindedVerify || nickPrompted) return;
    remindedVerify = true;
    toast('Please confirm your email to keep your account safe', 'warning',
      { label: 'Send link', onClick: function () { sendVerification(null); } }, 9000);
  }

  /* ---------- nickname (shown in the greeting) ---------- */

  var NICK_RX = /^[\p{L}\p{N} .'_-]{1,30}$/u;
  var nickPrompted = false;

  function cleanNick(v) { return String(v || '').trim().replace(/\s+/g, ' '); }

  function greetingWord() {
    var h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  }

  function ensureNicknameStyles() {
    if ($('nicknameStyles')) return;
    var style = document.createElement('style');
    style.id = 'nicknameStyles';
    style.textContent =
      '.gz-nick{text-align:center;padding:26px 24px 22px}' +
      '.gz-nick-owl{display:block;width:118px;height:118px;object-fit:contain;margin:-6px auto 2px;animation:gzNickFloat 3.2s ease-in-out infinite}' +
      '@keyframes gzNickFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
      '.gz-nick-title{font-size:22px;margin:6px 0 6px}' +
      '.gz-nick-sub{font-size:14px;line-height:1.45;opacity:.7;margin:0 0 18px}' +
      '.gz-nick-input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;font:inherit;font-size:17px;text-align:center;color:inherit;background:rgba(128,128,128,.1);border:1.5px solid rgba(128,128,128,.35);outline:none;transition:border-color .15s,box-shadow .15s}' +
      '.gz-nick-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.22)}' +
      '.gz-nick-preview{margin:16px 0 6px;padding:12px;border-radius:14px;background:rgba(99,102,241,.1);transition:opacity .15s}' +
      '.gz-nick-preview.gz-dim{opacity:.55}' +
      '.gz-nick-label{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-bottom:6px}' +
      '.gz-nick-hello{display:block;font-size:13px;opacity:.75}' +
      '.gz-nick-name{display:block;font-size:22px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.gz-nick-skip{background:none;border:0;color:inherit;opacity:.6;font:inherit;font-size:14px;margin-top:10px;padding:8px 12px;cursor:pointer}' +
      '.gz-nick-skip:hover{opacity:.9}';
    document.head.appendChild(style);
  }

  function updateNickPreview() {
    var typed = cleanNick($('nicknameInput').value);
    $('nicknameHello').textContent = greetingWord() + ',';
    $('nicknameName').textContent = typed || 'Your nickname';
    $('nicknamePreview').classList.toggle('gz-dim', !typed);
  }

  function buildNicknameModal() {
    if ($('nicknameModal')) return;
    ensureNicknameStyles();

    var modal = el('div', 'modal');
    modal.id = 'nicknameModal';
    var card = el('div', 'modal-content modal-small gz-nick');

    var owl = document.createElement('img');
    owl.src = 'owl_x5f_waving.svg';
    owl.alt = '';
    owl.className = 'gz-nick-owl';
    owl.addEventListener('error', function () { owl.style.display = 'none'; });
    card.appendChild(owl);

    card.appendChild(el('h2', 'gz-nick-title', 'What should we call you?'));
    card.appendChild(el('p', 'gz-nick-sub', 'Pick a nickname. It shows up in your greeting every time you open Gaze.'));

    var form = document.createElement('form');
    form.id = 'nicknameForm';
    form.noValidate = true;

    var input = document.createElement('input');
    input.type = 'text';
    input.id = 'nicknameInput';
    input.className = 'gz-nick-input';
    input.maxLength = 30;
    input.autocomplete = 'off';
    input.placeholder = 'Your nickname';
    input.setAttribute('aria-label', 'Nickname');
    input.setAttribute('enterkeyhint', 'done');
    form.appendChild(input);

    var preview = el('div', 'gz-nick-preview');
    preview.id = 'nicknamePreview';
    preview.appendChild(el('span', 'gz-nick-label', 'Your greeting'));
    var hello = el('span', 'gz-nick-hello', '');
    hello.id = 'nicknameHello';
    var name = el('strong', 'gz-nick-name', '');
    name.id = 'nicknameName';
    preview.appendChild(hello);
    preview.appendChild(name);
    form.appendChild(preview);

    var error = el('p', 'auth-error');
    error.id = 'nicknameError';
    error.setAttribute('role', 'alert');
    form.appendChild(error);

    var save = el('button', 'btn-primary btn-full', 'Save nickname');
    save.type = 'submit';
    save.id = 'nicknameSave';
    form.appendChild(save);

    var skip = el('button', 'gz-nick-skip', 'Maybe later');
    skip.type = 'button';
    skip.id = 'nicknameSkip';
    form.appendChild(skip);

    card.appendChild(form);
    modal.appendChild(card);
    document.body.appendChild(modal);

    input.addEventListener('input', function () { showError('nicknameError', ''); updateNickPreview(); });
    form.addEventListener('submit', saveNickname);
    skip.addEventListener('click', skipNickname);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal('nicknameModal'); });
  }

  function openNickname(user) {
    buildNicknameModal();
    var guess = cleanNick(String((user && user.name) || '').split(' ')[0]);
    $('nicknameInput').value = NICK_RX.test(guess) ? guess : '';
    showError('nicknameError', '');
    updateNickPreview();
    openModal('nicknameModal');
    setTimeout(function () { var i = $('nicknameInput'); i.focus(); i.select(); }, 80);
  }

  // Ask once, when a logged-in account has no nickname yet (not right after login: that reloads the page first)
  function maybePromptNickname() {
    var u = window.GazeAuth.getUser();
    if (!u || nickPrompted || u.nickname || u.nicknamePrompted) return;
    nickPrompted = true;
    openNickname(u);
  }

  async function saveNickname(e) {
    e.preventDefault();
    if (busy) return;
    var v = cleanNick($('nicknameInput').value);
    if (!v) { showError('nicknameError', 'Type a nickname, or tap "Maybe later".'); return; }
    if (!NICK_RX.test(v)) { showError('nicknameError', "Use letters, numbers, spaces and . - _ only (max 30)."); return; }

    var btn = $('nicknameSave');
    setBusy(btn, true, 'Save nickname', 'Saving…');
    var r = await window.GazeAuth.updateProfile({ nickname: v, nicknamePrompted: true });
    setBusy(btn, false, 'Save nickname', '');
    if (r.ok) {
      closeModal('nicknameModal');
      refreshHeader();
      toast('Nice to meet you, ' + v);
    } else {
      showError('nicknameError', friendlyError(r));
    }
  }

  async function skipNickname() {
    closeModal('nicknameModal');
    await window.GazeAuth.updateProfile({ nicknamePrompted: true }); // remembered on the account: we won't ask again
  }

  // Settings > "Display name" is the same nickname, saved on the account
  function syncNameInput(user) {
    var input = $('settingName');
    if (input) input.value = user ? (user.nickname || '') : '';
  }

  async function onSettingsSave() {
    var input = $('settingName');
    if (!input) return;
    var v = cleanNick(input.value);
    var u = window.GazeAuth.getUser();
    if (!u) { if (v) toast('Log in to set your nickname', 'warning'); return; }
    if (!v || v === (u.nickname || '')) return;
    if (!NICK_RX.test(v)) { toast('Nickname: letters, numbers, spaces and . - _ only (max 30)', 'error'); return; }
    var r = await window.GazeAuth.updateProfile({ nickname: v, nicknamePrompted: true });
    if (r.ok) refreshHeader(); else toast(friendlyError(r), 'error');
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
    buildForgotView();

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
      if (e.key === 'Escape') { closeModal('authModal'); closeModal('securityModal'); closeModal('nicknameModal'); }
    });

    var saveSettingBtn = $('saveSetting');
    if (saveSettingBtn) saveSettingBtn.addEventListener('click', onSettingsSave);

    var secRow = $('securityRowBtn');
    if (secRow) secRow.addEventListener('click', openSecurity);

var hadUser = false;

window.GazeAuth.onChange(function (user) {
    if (hadUser && !user) clearUserCache();
    hadUser = !!user;

    renderCard(user);
    refreshHeader();
    syncNameInput(user);
    if (!user) { closeModal('securityModal'); closeModal('nicknameModal'); }
});

    // A portfolio request was blocked because nobody is logged in: ask them to log in (once per page load)
    window.addEventListener('gaze:login-required', function () {
      if (promptedLogin || isOpen('authModal')) return;
      promptedLogin = true;
      toast('Log in to see your portfolio', 'warning');
      openAuth('login');
    });

    // auth-client.js restores the session by itself; just show whatever state it is in
    var show = function () {
      var u = window.GazeAuth.getUser();
      renderCard(u);
      refreshHeader();
      syncNameInput(u);
    };
    show();
window.GazeAuth.ready.then(function () {
    if (!window.GazeAuth.getUser()) clearUserCache();
    show(); maybePromptNickname(); maybeRemindVerify();
});
    // came back from confirming the email in another tab: pick up the new status
    window.addEventListener('focus', function () {
      var u = window.GazeAuth.getUser();
      if (u && !u.emailVerified) window.GazeAuth.refreshUser();
    });
  }

  var api = {
    openLogin: function () { openAuth('login'); },
    openSignup: function () { openAuth('signup'); },
    openSecurity: openSecurity,
    openNickname: function () { var u = window.GazeAuth.getUser(); if (u) openNickname(u); },
    reloadDelay: 600,
    reload: function () { location.reload(); }
  };
  window.GazeAuthUI = api;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
  