# Gaze Auth Pack (Phase 1)

Accounts, sessions, Google sign-in and security middleware for Gaze.
Stack: Node + Express + MongoDB (Mongoose) + vanilla JS. CommonJS, Node 20.6+.

## What you get
- Sign up / log in / log out / log out everywhere
- Access token (15 min, kept in memory) + refresh token (httpOnly cookie, rotated, reuse-detected)
- Session list (see/revoke devices), change password (signs out other devices)
- "Continue with Google"
- helmet (CSP in report-only mode), CORS allowlist, layered rate limits, per-account lockout
- Separate MongoDB connection + pool for users
- `requireAuth`, `requireRole('admin')`, `requirePlan('pro')` middleware (plan gating ready for Paystack)

## Setup

### 1. MongoDB Atlas
1. Create a second database for users (just use a different DB name in the URI, e.g. `gaze_users`).
2. Database Access -> add a NEW DB user that can read/write ONLY `gaze_users`.
3. Your existing stock-data DB user should have access ONLY to the market database.
4. In your existing server, set `maxPoolSize: 10` on your current `mongoose.connect(...)` options.

### 2. Install
```bash
npm install express mongoose cookie-parser cors helmet express-rate-limit jsonwebtoken bcryptjs zod google-auth-library
```

### 3. Env vars (copy `.env.example` to `.env` locally; add the same vars in Render -> Environment)
Generate the JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```
Set `NODE_ENV=production` on Render.

### 4. Wire into your server (early, before your other routes)
```js
const { mountAuth, requireAuth, requirePlan } = require('./gaze-auth/src');
mountAuth(app);

app.get('/api/watchlist', requireAuth, handler);        // logged-in only
app.get('/api/pro-feature', requirePlan('pro'), handler); // paid only
```
`req.auth.userId` is available in handlers after `requireAuth`.

### 5. Frontend
Copy `public/auth-client.js` next to your `index.html`, then:
```html
<script src="/auth-client.js"></script>
<script>
  GazeAuth.restore();                       // on page load
  GazeAuth.onChange(function (user) { /* update UI: user is null when logged out */ });
</script>
```
Use `GazeAuth.api('/api/whatever')` for private calls (auto-refreshes the token).

Quick console tests on your site:
```js
await GazeAuth.signup('Test', 'test@example.com', 'a-long-password-123')
await GazeAuth.api('/api/auth/me')
await GazeAuth.logout()
```

### 6. Google sign-in
1. Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth client ID -> Web application.
2. Authorized JavaScript origins: `https://portfolio-tracker-plwj.onrender.com` and `http://localhost:3000`.
3. OAuth consent screen -> publish to Production (Testing mode limits you to listed test users).
4. Put the client ID in `GOOGLE_CLIENT_ID`, then:
```js
GazeAuth.googleButton('YOUR_CLIENT_ID', document.getElementById('google-btn'), function (result) {
  if (!result.ok) alert(result.error);
});
```

### 7. Service worker (your app works offline)
Make sure it NEVER caches `/api/auth/*` or any private user endpoint (network-only for those).

### 8. CSP
It starts in report-only mode. Open your site, check the browser console for "Content Security Policy" reports,
fix/allow what's legitimate (inline scripts, CDNs, fonts), then set `CSP_MODE=enforce`.

## Attach data to users (Phase 2)
Add `userId: { type: Schema.Types.ObjectId, required: true, index: true }` to your watchlist/portfolio models,
and ALWAYS query with `{ userId: req.auth.userId, ... }`. Never trust a userId sent by the client.

## Not in this pack yet
Email verification + password reset, admin TOTP, server price cache, Paystack, account deletion.

## Test status
Verified without a database: syntax, boot, validation, CSRF checks, JWT rejection, CORS, headers, rate-limit headers.
Database flows (signup/login/refresh rotation/Google) need a real MongoDB - test them against Atlas before deploying.
