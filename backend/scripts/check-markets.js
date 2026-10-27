// Lists stocks that are saved under the wrong market (for example UBA as
// US) in every portfolio. REPORT ONLY: it changes nothing. Fix the entries
// in the app by removing the wrong one and adding it again under the right
// market.
//
// Put this file in:  backend/scripts/check-markets.js
// Run from the backend folder:  node scripts/check-markets.js

require('dotenv').config();

const mongoose = require('mongoose');

const Portfolio =
    require('../models/portfolio');

const marketCheck =
    require('../services/marketCheck');


// Which lists of a portfolio hold stocks with a ticker and a market
const LISTS = ['stocks', 'watchlist', 'sold'];


(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const portfolios =
            await Portfolio.find({}).lean();

        let problems = 0;

        for (const portfolio of portfolios) {
            const seen = new Map();

            for (const listName of LISTS) {
                for (const item of portfolio[listName] || []) {
                    if (!item || !item.ticker) {
                        continue;
                    }

                    const ticker =
                        String(item.ticker).trim().toUpperCase();

                    const market =
                        String(item.market || 'NGX').trim().toUpperCase();

                    const result =
                        await marketCheck.checkTickerMarket(ticker, market);

                    if (!result.ok) {
                        problems++;

                        console.log(
                            `user ${portfolio.userId}  [${listName}]  ` +
                            `${ticker} saved as ${market}` +
                            (result.suggestion
                                ? ` -> should be ${result.suggestion}`
                                : ' -> not a valid symbol for that market')
                        );
                    }

                    // The same ticker on BOTH markets in one list is usually
                    // the wrong copy left behind
                    const key = `${listName}|${ticker}`;

                    if (seen.has(key) && seen.get(key) !== market) {
                        problems++;

                        console.log(
                            `user ${portfolio.userId}  [${listName}]  ` +
                            `${ticker} appears under both ` +
                            `${seen.get(key)} and ${market}`
                        );
                    }

                    seen.set(key, market);
                }
            }
        }

        console.log('');
        console.log(
            problems === 0
                ? 'No wrong-market entries found.'
                : `${problems} problem(s) found. Fix them in the app.`
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();
