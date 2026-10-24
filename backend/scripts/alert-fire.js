// Fires one fake price event at the alert engine, so you can see a real
// alert turn into a real notification in the app while markets are closed.
//
// Run from the backend folder:
//   node scripts/alert-fire.js TICKER MARKET PRICE
// Example:
//   node scripts/alert-fire.js ZENITHBANK NGX 60
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

if (
    !ticker ||
    (market !== 'NGX' && market !== 'US') ||
    !(price > 0)
) {
    console.log(
        'Usage: node scripts/alert-fire.js TICKER MARKET PRICE'
    );
    console.log(
        'Example: node scripts/alert-fire.js ZENITHBANK NGX 60'
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
        }

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();