// Sends ONE test notification to a user, so you can see the bell in the app.
//
// Run from the backend folder:
//   node scripts/send-test-notification.js YOUR_USER_ID
//
// To find your user id: log in to the app, open the browser console
// (F12) and type:   state.userId
//
// The notification is harmless. Open the alerts panel in the app to read
// it; it is then marked as read like any other.

require('dotenv').config();

const mongoose = require('mongoose');

const Notification =
    require('../models/Notification');

const userId =
    String(process.argv[2] || '').trim();

if (!userId) {
    console.log(
        'Usage: node scripts/send-test-notification.js YOUR_USER_ID'
    );

    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        await Notification.create({
            userId,
            type: 'price_alert',
            title: 'TEST rose above ₦100',
            message: 'TEST is now ₦101. This is a test notification.',
            ticker: 'TEST',
            market: 'NGX',
            price: 101,
            threshold: 100,
            direction: 'above',
            observedAt: new Date(),
            dedupeKey: `test|${userId}|${Date.now()}`
        });

        console.log(
            `Test notification created for "${userId}". ` +
            'Open the app and look at the bell.'
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();