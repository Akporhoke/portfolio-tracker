// Builds the nightly health summary right now, so you can see it before
// waiting for the evening.
//
// Put this file in:  backend/scripts/health-summary-now.js
// Run from the backend folder:
//   node scripts/health-summary-now.js          shows it on screen
//   node scripts/health-summary-now.js --send   also sends it to Telegram
//
// Sending needs HEALTH_SUMMARY_USER_ID in backend/.env and Telegram
// connected for that user (gear tab in the app).

require('dotenv').config();

const mongoose = require('mongoose');

const healthSummary =
    require('../services/healthSummary');

const shouldSend =
    process.argv.includes('--send');

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const text =
            await healthSummary.buildSummary();

        console.log('');
        console.log(text);
        console.log('');

        if (!shouldSend) {
            console.log('(Not sent. Add --send to send it to Telegram.)');
            return;
        }

        const userId =
            String(process.env.HEALTH_SUMMARY_USER_ID || '').trim();

        if (!userId) {
            console.log('Not sent: HEALTH_SUMMARY_USER_ID is not set in .env');
            return;
        }

        const sent =
            await healthSummary.sendSummary(userId);

        console.log(
            sent
                ? 'Sent to Telegram.'
                : 'Not sent. Is Telegram connected for that user?'
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();
