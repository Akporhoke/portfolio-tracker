// Second alert test: a REPEATING alert, which stays active after it fires.
// This is the case that really exercises the duplicate protection.
// Uses a fake stock and a fake user; everything is deleted at the end.
//
// Run from the backend folder:  node scripts/alert-test-repeat.js

require('dotenv').config();

const mongoose = require('mongoose');

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const engine =
    require('../services/alertEngine');

const TEST_USER = 'alert-test-user-repeat';
const TICKER = 'ZZTEST2';
const MARKET = 'US';

const t0 = Date.now();

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
        `${label.padEnd(46)} ` +
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

        // Repeating alert: above 200, 60 minute cooldown, last price 190
        await Alert.create({
            userId: TEST_USER,
            ticker: TICKER,
            market: MARKET,
            direction: 'above',
            threshold: 200,
            repeat: true,
            cooldownMinutes: 60,
            lastObservedPrice: 190,
            lastObservedFetchedAt: new Date(t0 - 60 * 1000)
        });

        console.log(
            'Alert: ZZTEST2 above 200, repeating, 60 min cooldown ' +
            '(last price seen: 190)'
        );
        console.log('');

        await step(
            'A. price 205 (crosses above 200):',
            observe(205, 1)
        );

        await step(
            'B. the SAME observation delivered again:',
            observe(205, 1)
        );

        await step(
            'C. price 195 (drops back below):',
            observe(195, 2)
        );

        await step(
            'D. price 210 (crosses again, in cooldown):',
            observe(210, 3)
        );

        const alert =
            await Alert.findOne({ userId: TEST_USER }).lean();

        console.log('');
        console.log(
            `Alert status: ${alert.status}, ` +
            `fired ${alert.triggerCount} time(s)`
        );

        console.log('');
        console.log(
            'Expected: only A triggers; B is ignored (1); ' +
            'D does not fire because of the cooldown; ' +
            'exactly 1 notification; status "active".'
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await Alert.deleteMany({ userId: TEST_USER });
        await Notification.deleteMany({ userId: TEST_USER });

        await mongoose.disconnect();
    }
})();