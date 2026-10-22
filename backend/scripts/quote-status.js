// Shows what Gaze has stored for prices.
// Run from the backend folder:  node scripts/quote-status.js

require('dotenv').config();

const mongoose = require('mongoose');

const PriceQuote =
    require('../models/PriceQuote');

const DAY = 24 * 60 * 60 * 1000;

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const total =
            await PriceQuote.countDocuments();

        console.log(`Stored quotes: ${total}`);

        const failing =
            await PriceQuote.find({
                failCount: { $gt: 0 }
            })
                .select({
                    ticker: 1,
                    market: 1,
                    failCount: 1,
                    lastError: 1,
                    fetchedAt: 1
                })
                .lean();

        console.log('');
        console.log(`Failing right now: ${failing.length}`);

        for (const q of failing) {
            console.log(
                `  ${q.ticker} (${q.market}) failed ${q.failCount}x, ` +
                `last good price: ${q.fetchedAt ? q.fetchedAt.toISOString() : 'never'}`
            );
        }

        const oldTrades =
            await PriceQuote.find({
                market: 'US',
                sourceTimestamp: {
                    $lt: new Date(Date.now() - 3 * DAY)
                }
            })
                .select({
                    ticker: 1,
                    sourceTimestamp: 1,
                    price: 1
                })
                .lean();

        console.log('');
        console.log(
            `US quotes whose last trade is older than 3 days: ${oldTrades.length}`
        );

        for (const q of oldTrades) {
            console.log(
                `  ${q.ticker}: ${q.price} (last trade ${q.sourceTimestamp.toISOString()})`
            );
        }
    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
})();