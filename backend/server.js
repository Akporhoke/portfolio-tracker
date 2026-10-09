const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // must stay BEFORE requiring gaze-auth (it reads env vars on load)

const { startConfidenceScheduler } = require('./services/confidenceScheduler');
const { startMarketCalendarScheduler } = require('./services/marketCalendarScheduler');
const { mountAuth, requireRole } = require('./gaze-auth/src');
const portfolioGuard = require('./gaze-auth/src/portfolio-guard');

const marketCalendarRoutes = require('./routes/marketCalendar');
const schedulerRoutes = require('./routes/scheduler');
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stocks');

const app = express();

// Auth + security (helmet, CORS allowlist, rate limits, /api/auth routes)
mountAuth(app);

app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Routes
app.use('/api/portfolio', portfolioGuard, portfolioRoutes); // login required + own portfolio only
app.use('/api/stocks', stockRoutes);                        // public market data
app.use('/api/market-calendar', marketCalendarRoutes);
app.use('/api/scheduler', requireRole('admin'), schedulerRoutes); // admin only

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
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

startServer();