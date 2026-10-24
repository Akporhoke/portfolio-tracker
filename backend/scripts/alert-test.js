// Proves the alert engine works, using a fake stock and a fake user.
// Nothing real is touched, and everything it creates is deleted at the end.
//
// Run from the backend folder:  node scripts/alert-test.js

require('dotenv').config();

const mongoose = require('mongoose');

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const engine =
    require('../services/alertEngine');

const TEST_USER = 'alert-test-user';
const TICKER = 'ZZTEST';
const MARKET = 'NGX';

const t0 = Date.now();

// A price observation at a given number of seconds after the start
const observe = (price, seconds) => ({
    ticker: TICKER,
    market: MARKET,
    price,
    fetchedAt: new Date(t0 + seconds * 1000),
    source: 'test'
});


async function step(label, event) {
    engine.invalidateActiveCache();

    const result =
        await engine.handlePriceEvent(event);

    const notifications =
        await Notification.countDocuments({
            userId: TEST_USER
        });

    console.log(
        `${label.padEnd(44)} ` +
        `checked ${result.checked}, ` +
        `triggered ${result.triggered}, ` +
        `ignored ${result.ignored}  | ` +
        `notifications so far: ${notifications}`
    );
}


(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        await Alert.deleteMany({ userId: TEST_USER });
        await Notification.deleteMany({ userId: TEST_USER });

        // "Tell me when ZZTEST rises above 100". It last saw 90.
        await Alert.create({
            userId: TEST_USER,
            ticker: TICKER,
            market: MARKET,
            direction: 'above',
            threshold: 100,
            lastObservedPrice: 90,
            lastObservedFetchedAt: new Date(t0 - 60 * 1000)
        });

        console.log('Alert: ZZTEST above 100 (last price seen: 90)');
        console.log('');

        await step(
            '1. price 95 (still below):',
            observe(95, 1)
        );

        await step(
            '2. price 101 (crosses above 100):',
            observe(101, 2)
        );

        await step(
            '3. same observation delivered again:',
            observe(101, 2)
        );

        await step(
            '4. price 102 (already fired, stays above):',
            observe(102, 3)
        );

        const alert =
            await Alert.findOne({ userId: TEST_USER }).lean();

        console.log('');
        console.log(
            `Alert status: ${alert.status}, ` +
            `fired ${alert.triggerCount} time(s) at ${alert.triggeredPrice}`
        );

        const note =
            await Notification.findOne({ userId: TEST_USER }).lean();

        if (note) {
            console.log(`Notification: "${note.title}" - ${note.message}`);
        }

        console.log('');
        console.log(
            'Expected: only step 2 triggers; exactly 1 notification; ' +
            'status "triggered".'
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await Alert.deleteMany({ userId: TEST_USER });
        await Notification.deleteMany({ userId: TEST_USER });

        await mongoose.disconnect();
    }
})();