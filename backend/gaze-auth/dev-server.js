'use strict';

// Standalone server for testing the auth module on its own.
// In your real app you just call mountAuth(app) instead.
const path = require('path');
const express = require('express');
const { mountAuth, requireAuth, requirePlan } = require('./src');

const app = express();
mountAuth(app);

// Example protected routes
app.get('/api/private-test', requireAuth, (req, res) => res.json({ ok: true, userId: req.auth.userId }));
app.get('/api/pro-test', requirePlan('pro'), (req, res) => res.json({ ok: true, plan: req.user.activePlan() }));

app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Gaze auth dev server on http://localhost:${port}`));
