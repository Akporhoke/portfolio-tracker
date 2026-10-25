// Fires one fake price event at the alert engine, so you can see a real
// alert turn into a real notification (bell, push, Telegram) while the
// markets are closed.
//
// Put this file in:  backend/scripts/alert-fire.js
// Run from the backend folder:
//   node scripts/alert-fire.js TICKER MARKET PRICE
// Example:
//   node scripts/alert-fire.js SEPLAT NGX 16200
//
// It only touches alerts on that ticker + market. The alert and the
// notification are real, so delete the alert in the app afterwards.

require('dotenv').config();

const mongoose = require('mongoose');

const engine =
    require('../services/alertEngine');

const ticker =
    String(process.argv[2] || '').toUpperCase();

const market =
    String(process.argv[3] || '').toUpperCase();

const price =
    Number(process.argv[4]);

// The engine sends the push and the Telegram message in the background
// (it does not wait for them). In the real server that is fine, because the
// database stays open. In this script the connection would be closed too
// early and cut them off, so we wait a few seconds before closing.
const DELIVERY_WAIT_MS = 5000;

if (
    !ticker ||
    (market !== 'NGX' && market !== 'US') ||
    !(price > 0)
) {
    console.log(
        'Usage: node scripts/alert-fire.js TICKER MARKET PRICE'
    );
    console.log(
        'Example: node scripts/alert-fire.js SEPLAT NGX 16200'
    );
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        engine.invalidateActiveCache();

        const result =
            await engine.handlePriceEvent({
                ticker,
                market,
                price,
                fetchedAt: new Date(),
                source: 'manual-test'
            });

        console.log(
            `${ticker} (${market}) at ${price}: ` +
            `checked ${result.checked}, ` +
            `triggered ${result.triggered}, ` +
            `ignored ${result.ignored}`
        );

        if (result.checked === 0) {
            console.log(
                'No active alert for that stock. Create one in the app first.'
            );

        } else if (result.triggered === 0) {
            console.log(
                'Seen, but no crossing. Either the price is on the same ' +
                'side of the threshold as before, or this was the first ' +
                'observation (it only sets the starting price).'
            );

        } else {
            console.log(
                'Alert fired. Waiting a few seconds for the push and ' +
                'Telegram message to go out...'
            );

            await new Promise(resolve =>
                setTimeout(resolve, DELIVERY_WAIT_MS)
            );

            console.log('Done. Check your phone, Telegram and the bell.');
        }

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();