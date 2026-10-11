/* Logic for reset-password.html and verify-email.html (the pages opened from emails).
 * The one-time code lives in the #fragment of the link, so it is never sent to any server
 * by the browser, never appears in server logs, and never leaks in a Referer header.
 * We remove it from the address bar the moment the page loads. */
(function () {
  'use strict';

  var page = document.body.getAttribute('data-page'); // "reset" or "verify"
  var $ = function (id) { return document.getElementById(id); };

  /* ---- follow the app's saved theme (Light / Dark / System) ---- */
  try {
    var saved = localStorage.getItem('gazeTheme');
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved === 'dark' || ((!saved || saved === 'system') && systemDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) { /* storage blocked: keep the default look */ }

  /* ---- helpers ---- */
  function takeToken() {
    var match = /[#&]token=([A-Za-z0-9_-]{20,200})/.exec(location.hash || '');
    if (location.hash) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    }
    return match ? match[1] : '';
  }

  function only(id) { // show exactly one of the sections
    ['gpLoading', 'gpForm', 'gpDone', 'gpProblem'].forEach(function (s) {
      var node = $(s);
      if (node) node.hidden = s !== id;
    });
  }

  function problem(message) {
    $('gpProblemMsg').textContent = message;
    only('gpProblem');
  }

  async function post(path, body) {
    var res;
    try {
      res = await fetch('/api/auth' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (e) {
      return { ok: false, error: 'Could not reach the server. Check your connection and try again.', code: 'NETWORK' };
    }
    var data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }
    if (res.ok) return { ok: true, data: data };
    var message = data && data.details && data.details.length
      ? data.details.map(function (d) { return d.message; }).join('. ') + '.'
      : (data && data.error) || 'Something went wrong. Please try again.';
    return { ok: false, error: message, code: data && data.code, status: res.status };
  }

  var MISSING = 'This link is missing its code. Open the link from your email again.';

  /* ---- reset-password.html ---- */
  function startReset() {
    var token = takeToken();
    if (!token) { problem(MISSING + ' Or ask for a new one with "Forgot password?" on the login screen.'); return; }

    only('gpForm');
    var form = $('resetForm');
    var pw = $('gpPassword');
    var confirmPw = $('gpConfirm');
    var errorEl = $('gpError');
    var submit = $('gpSubmit');
    var busy = false;
    setTimeout(function () { pw.focus(); }, 50);

    $('gpShow').addEventListener('click', function () {
      var show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      confirmPw.type = pw.type;
      this.textContent = show ? 'Hide' : 'Show';
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (busy) return;
      errorEl.textContent = '';

      var value = pw.value;
      if (value.length < 10) { errorEl.textContent = 'Use at least 10 characters.'; return; }
      if (new TextEncoder().encode(value).length > 72) { errorEl.textContent = 'That password is too long (max 72 bytes).'; return; }
      if (value !== confirmPw.value) { errorEl.textContent = 'The two passwords do not match.'; return; }

      busy = true;
      submit.disabled = true;
      submit.textContent = 'Updating…';
      var r = await post('/reset-password', { token: token, password: value });
      busy = false;
      submit.disabled = false;
      submit.textContent = 'Update password';

      if (r.ok) {
        pw.value = '';
        confirmPw.value = '';
        only('gpDone');
      } else if (r.code === 'INVALID_TOKEN') {
        problem(r.error);                 // link used or expired: the form is no use any more
      } else {
        errorEl.textContent = r.error;    // e.g. weak password: the link is still valid, try again
      }
    });
  }

  /* ---- verify-email.html ---- */
  async function startVerify() {
    var token = takeToken();
    if (!token) { problem(MISSING); return; }
    only('gpLoading');
    var r = await post('/verify-email', { token: token });
    if (r.ok) only('gpDone');
    else problem(r.error);
  }

  if (page === 'reset') startReset();
  else if (page === 'verify') startVerify();
})();
