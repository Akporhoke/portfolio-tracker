const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const {
    startConfidenceScheduler
} = require('./services/confidenceScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Backend is working!'
    });
});

// Import routes
const portfolioRoutes =
    require('./routes/portfolio');

const stockRoutes =
    require('./routes/stocks');

// Use routes
app.use(
    '/api/portfolio',
    portfolioRoutes
);

app.use(
    '/api/stocks',
    stockRoutes
);

// Server Port
const PORT =
    process.env.PORT || 5000;

// Serve frontend
app.use(
    express.static('../frontend')
);

// Start Server
async function startServer() {
    try {
        console.log(
            'Connecting to MongoDB...'
        );

        await mongoose.connect(
            process.env.MONGODB_URI
        );

       console.log(
    '✓ MongoDB connected'
);

startConfidenceScheduler();

app.listen(PORT, () => {
    console.log(
        `✓ Server running on port ${PORT}`
    );
});

    } catch (err) {
        console.error(
            '❌ MongoDB connection failed:',
            err.message
        );

        process.exit(1);
    }
}

startServer();