// Prints how much of each provider's free quota Gaze has used.
// Run from the backend folder:  node scripts/budget-status.js

require('dotenv').config();

const mongoose = require('mongoose');

const budget =
    require('../services/providerBudget');

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const usage = await budget.getUsage();

        for (const [provider, windows] of Object.entries(usage)) {
            for (const [kind, w] of Object.entries(windows)) {
                console.log(
                    `${provider.padEnd(11)} ${kind.padEnd(6)} ` +
                    `used ${String(w.used).padStart(5)} / cap ${w.cap} (limit ${w.limit})`
                );
            }
        }
    } catch (error) {
        console.error('Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
})();