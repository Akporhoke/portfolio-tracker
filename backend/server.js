const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // must stay BEFORE requiring gaze-auth (it reads env vars on load)

const { startConfidenceScheduler } = require('./services/confidenceScheduler');
const { startMarketCalendarScheduler } = require('./services/marketCalendarScheduler');
const { startDividendScheduler } = require('./services/dividendScheduler');
const { startPriceScheduler } = require('./services/priceScheduler');
const { mountAuth, requireRole } = require('./gaze-auth/src');
const { startAlertEngine } = require('./services/alertEngine');
const { startTelegram } = require('./services/telegramService');
const { startPush } = require('./services/pushService');
const { startHealthSummary } = require('./services/healthSummary');
const { guardMarket } = require('./services/marketCheck');
const portfolioGuard = require('./gaze-auth/src/portfolio-guard');
const portfolioValidate = require('./gaze-auth/src/portfolio-validate');

const dividendRoutes = require('./routes/dividends');
const marketCalendarRoutes = require('./routes/marketCalendar');
const schedulerRoutes = require('./routes/scheduler');
const portfolioRoutes = require('./routes/portfolio');
const alertRoutes = require('./routes/alerts');
const telegramRoutes = require('./routes/telegram');
const pushRoutes = require('./routes/push');
const adminStatusRoutes = require('./routes/adminStatus');
const stockRoutes = require('./routes/stocks');

const app = express();

// Health check for uptime monitors (UptimeRobot / Render). Mounted BEFORE auth
// so it skips rate limits and CORS, and it doesn't touch the database.
app.get('/health', (req, res) => {
    res.status(200).send('ok');
});

// Auth + security (helmet, CORS allowlist, rate limits, /api/auth routes)
mountAuth(app);

app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Rejects a stock saved under the wrong market (for example UBA as US).
// Only the two "add stock" requests are checked, the ones the app sends:
//   POST /api/portfolio/:userId/stocks          (add to portfolio)
//   POST /api/portfolio/:userId/add-watchlist   (add to watchlist)
// Everything else passes straight through. The error text is shown to the
// user by the app's existing "Failed to add" message.
function marketGuardOnAdd(req, res, next) {
    const isAdd =
        req.method === 'POST' &&
        /^\/[^/]+\/(stocks|add-watchlist)\/?$/.test(req.path);

    return isAdd
        ? guardMarket(req, res, next)
        : next();
}

// Routes  (everything that uses `app` comes AFTER `const app = express()` above)
// alertRoutes, telegramRoutes, pushRoutes and adminStatusRoutes sit BEFORE
// portfolioRoutes: they answer /:userId/alerts, /notifications, /telegram,
// /push and /admin/status, and pass every other path on to portfolioRoutes.
app.use(
    '/api/portfolio',
    portfolioGuard,
    portfolioValidate,
    marketGuardOnAdd,
    alertRoutes,
    telegramRoutes,
    pushRoutes,
    adminStatusRoutes,
    portfolioRoutes
);
app.use('/api/stocks', stockRoutes);                                          // public market data
app.use('/api/market-calendar', marketCalendarRoutes);
app.use('/api/scheduler', requireRole('admin'), schedulerRoutes);             // admin only
app.use('/api/dividends', dividendRoutes);
app.use('/api/fx', require('./routes/fx'));

// Server Port
const PORT = process.env.PORT || 5000;

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Start Server
async function startServer() {
    try {
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,
            family: 4,
            serverSelectionTimeoutMS: 30000,
        });

        console.log('✓ MongoDB connected');

        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
        });

        startConfidenceScheduler();
        startMarketCalendarScheduler();
        startAlertEngine();      // listen first, so no price event is missed
        startPriceScheduler();   // then start producing price events
        startDividendScheduler();

        // Push, Telegram and the nightly summary never stop the server:
        // if one fails to start, only that part is off
        startPush();
        startHealthSummary();

        startTelegram().catch(error => {
            console.error('[Telegram] failed to start:', error.message);
        });
    } catch (err) {
        console.error('❌ Server failed to start:', err.message);
        process.exit(1);
    }
}

startServer();
