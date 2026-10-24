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
const portfolioGuard = require('./gaze-auth/src/portfolio-guard');
const portfolioValidate = require('./gaze-auth/src/portfolio-validate');

const dividendRoutes = require('./routes/dividends');
const marketCalendarRoutes = require('./routes/marketCalendar');
const schedulerRoutes = require('./routes/scheduler');
const portfolioRoutes = require('./routes/portfolio');
const alertRoutes = require('./routes/alerts');
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

// Routes  (everything that uses `app` comes AFTER `const app = express()` above)
// alertRoutes sits BEFORE portfolioRoutes: it answers /:userId/alerts and
// /:userId/notifications, and passes every other path on to portfolioRoutes.
app.use('/api/portfolio', portfolioGuard, portfolioValidate, alertRoutes, portfolioRoutes);
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
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

startServer();