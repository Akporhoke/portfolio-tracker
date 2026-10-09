/* Gaze auth client (vanilla JS). Include with: <script src="/auth-client.js"></script>
 * Exposes window.GazeAuth.
 * - Access token lives ONLY in memory (never localStorage).
 * - Refresh token is an httpOnly cookie the browser handles for us.
 */
(function () {
  'use strict';

  var BASE = '/api/auth';
  var accessToken = null;
  var currentUser = null;
  var refreshing = null;
  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) { try { fn(currentUser); } catch (e) { console.error(e); } });
  }

  function setSession(data) {
    accessToken = data ? data.accessToken : null;
    currentUser = data ? data.user : null;
    emit();
  }

  async function raw(path, opts) {
    opts = opts || {};
    var headers = { 'X-Gaze-Client': 'web' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.auth && accessToken) headers['Authorization'] = 'Bearer ' + accessToken;

    var res = await fetch(path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin'
    });
    var data = null;
    if (res.status !== 204) {
      try { data = await res.json(); } catch (_) { /* empty body */ }
    }
    return { res: res, data: data };
  }

  // One refresh at a time, even if many requests fail together
  function refresh() {
    if (!refreshing) {
      refreshing = raw(BASE + '/refresh', { method: 'POST' })
        .then(function (r) {
          if (r.res.ok) { setSession(r.data); return true; }
          setSession(null); // server said the session is gone
          return false;
        })
        .catch(function () { return false; }) // offline: keep current state, don't log out
        .then(function (ok) { refreshing = null; return ok; });
    }
    return refreshing;
  }

  // Use for your private API calls: GazeAuth.api('/api/watchlist')
  // Auto-refreshes the access token once if it expired.
  async function api(path, opts) {
    opts = Object.assign({}, opts, { auth: true });
    var r = await raw(path, opts);
    if (r.res.status === 401 && r.data && (r.data.code === 'TOKEN_EXPIRED' || r.data.code === 'NO_TOKEN')) {
      if (await refresh()) r = await raw(path, opts);
    }
    return r;
  }

  function fail(r) {
    return {
      ok: false,
      status: r.res.status,
      error: (r.data && r.data.error) || 'Something went wrong. Try again.',
      code: r.data && r.data.code,
      details: r.data && r.data.details
    };
  }

  async function authCall(path, body) {
    var r;
    try { r = await raw(BASE + path, { method: 'POST', body: body }); }
    catch (_) { return { ok: false, error: 'Network error. Check your connection.', code: 'NETWORK' }; }
    if (r.res.ok) { setSession(r.data); return { ok: true, user: r.data.user }; }
    return fail(r);
  }

  var GazeAuth = {
    // Call once on page load: restores the session from the refresh cookie
    restore: function () { return refresh(); },
    signup: function (name, email, password) { return authCall('/signup', { name: name, email: email, password: password }); },
    login: function (email, password) { return authCall('/login', { email: email, password: password }); },
    logout: async function () {
      try { await raw(BASE + '/logout', { method: 'POST' }); } catch (_) {}
      setSession(null);
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    },
    logoutAll: async function () {
      var r = await api(BASE + '/logout-all', { method: 'POST' });
      setSession(null);
      return r.res.ok;
    },
    changePassword: async function (currentPassword, newPassword) {
      var r = await api(BASE + '/change-password', { method: 'POST', body: { currentPassword: currentPassword, newPassword: newPassword } });
      return r.res.ok ? { ok: true } : fail(r);
    },
    sessions: async function () {
      var r = await api(BASE + '/sessions');
      return r.res.ok ? { ok: true, sessions: r.data.sessions } : fail(r);
    },
    revokeSession: async function (id) {
      var r = await api(BASE + '/sessions/' + encodeURIComponent(id), { method: 'DELETE' });
      return r.res.ok ? { ok: true } : fail(r);
    },

    // Google: GazeAuth.googleButton('YOUR_CLIENT_ID', document.getElementById('g-btn'), function (result) {...})
    googleButton: function (clientId, el, onResult) {
      return new Promise(function (resolve, reject) {
        function init() {
          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: false,
            callback: async function (resp) {
              var result = await authCall('/google', { credential: resp.credential });
              if (onResult) onResult(result);
            }
          });
          window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill' });
          resolve();
        }
        if (window.google && window.google.accounts && window.google.accounts.id) return init();
        var s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true; s.defer = true;
        s.onload = init;
        s.onerror = function () { reject(new Error('Could not load Google sign-in')); };
        document.head.appendChild(s);
      });
    },

    api: api,
    getUser: function () { return currentUser; },
    isLoggedIn: function () { return !!currentUser; },
    onChange: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }
  };

  window.GazeAuth = GazeAuth;
})();
