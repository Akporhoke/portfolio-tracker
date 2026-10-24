// Runs ONE price refresh cycle by hand and prints what it did.
// Run from the backend folder:  node scripts/run-price-cycle.js
//
// It uses your real database and API keys, so it spends real quota
// (only for prices that are actually due).

require('dotenv').config();

const mongoose = require('mongoose');

const {
    runPriceRefreshCycle
} = require('../services/priceScheduler');

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const summary =
            await runPriceRefreshCycle('manual');

        console.log('');
        console.log('Summary:', summary);

    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
})();