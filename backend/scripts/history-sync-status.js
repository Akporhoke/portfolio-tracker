// Shows which stocks the history sync is deferring, backing off, or has
// no history for.
// Run from the backend folder:  node scripts/history-sync-status.js

require('dotenv').config();

const mongoose = require('mongoose');

const HistorySyncState =
    require('../models/HistorySyncState');

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const total =
            await HistorySyncState.countDocuments();

        console.log(`Tracked sync states: ${total}`);

        const rows =
            await HistorySyncState.find({
                $or: [
                    { status: { $in: ['no_data', 'failed'] } },
                    { behindCount: { $gt: 0 } },
                    { nextRetryAt: { $gt: new Date() } }
                ]
            })
                .sort({ nextRetryAt: -1 })
                .lean();

        console.log(`Needing attention: ${rows.length}`);
        console.log('');

        for (const r of rows) {
            const retry =
                r.nextRetryAt && r.nextRetryAt > new Date()
                    ? `waiting until ${r.nextRetryAt.toISOString()}`
                    : 'not waiting';

            console.log(
                `${r.ticker} (${r.market}): ${r.status}, ` +
                `failed ${r.failCount}x, behind ${r.behindCount}x, ${retry}`
            );
        }
    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
})();