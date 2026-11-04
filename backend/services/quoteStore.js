/*
 * Reads and writes stored quotes (PriceQuote).
 *
 * Writes never throw: saving a quote must never break a price lookup.
 */

const PriceQuote =
    require('../models/PriceQuote');


function currencyFor(market) {
    return market === 'US'
        ? 'USD'
        : 'NGN';
}


async function saveQuote({
    ticker,
    market,
    price,
    source,
    sourceTimestamp = null,
    fetchedAt = null
}) {
    try {
        const now = new Date();

        await PriceQuote.updateOne(
            { ticker, market },
            {
                $set: {
                    price,
                    currency: currencyFor(market),
                    source: source || '',
                    sourceTimestamp,
                    fetchedAt: fetchedAt ? new Date(fetchedAt) : now,
                    lastAttemptAt: now,
                    failCount: 0,
                    lastError: ''
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error(
            `[QuoteStore] save failed for ${ticker} (${market}):`,
            error.message
        );
    }
}


async function noteFailure({
    ticker,
    market,
    error = 'no price returned'
}) {
    try {
        await PriceQuote.updateOne(
            { ticker, market },
            {
                $set: {
                    lastAttemptAt: new Date(),
                    lastError: String(error).slice(0, 200)
                },

                $inc: {
                    failCount: 1
                }
            },
            { upsert: true }
        );
    } catch (err) {
        console.error(
            `[QuoteStore] failure note failed for ${ticker} (${market}):`,
            err.message
        );
    }
}


async function getStoredQuote(ticker, market) {
    try {
        return await PriceQuote.findOne({
            ticker,
            market
        }).lean();
    } catch (error) {
        console.error(
            `[QuoteStore] read failed for ${ticker} (${market}):`,
            error.message
        );

        return null;
    }
}


// items: [{ ticker, market }]  ->  Map("TICKER|MARKET" -> quote)
async function getStoredQuotes(items) {
    const map = new Map();

    if (!Array.isArray(items) || items.length === 0) {
        return map;
    }

    try {
        const rows =
            await PriceQuote.find({
                $or: items.map(item => ({
                    ticker: item.ticker,
                    market: item.market
                }))
            }).lean();

        for (const row of rows) {
            map.set(
                `${row.ticker}|${row.market}`,
                row
            );
        }
    } catch (error) {
        console.error(
            '[QuoteStore] bulk read failed:',
            error.message
        );
    }

    return map;
}


// A stock that keeps failing is retried less and less often: after 1
// failure wait 2 minutes, then 4, 8, 16 ... never more than 60 minutes.
// The price scheduler AND the portfolio route use this one rule, so a
// failing stock is not retried on every page load.
function isInBackoff(quote, now = Date.now()) {
    if (
        !quote ||
        !(quote.failCount > 0) ||
        !quote.lastAttemptAt
    ) {
        return false;
    }

    const minutes =
        Math.min(
            2 * Math.pow(2, quote.failCount - 1),
            60
        );

    return (
        now - new Date(quote.lastAttemptAt).getTime() <
        minutes * 60 * 1000
    );
}


module.exports = {
    saveQuote,
    noteFailure,
    getStoredQuote,
    getStoredQuotes,
    isInBackoff
};
 