/*
 * Reads and writes persistent history-sync state.
 *
 * Writes never throw: bookkeeping must never break a sync run.
 */

const HistorySyncState =
    require('../models/HistorySyncState');

const HOUR = 60 * 60 * 1000;


function keyOf(ticker, market) {
    return `${ticker}|${market}`;
}


async function write(ticker, market, update) {
    try {
        await HistorySyncState.updateOne(
            { ticker, market },
            update,
            { upsert: true }
        );
    } catch (error) {
        console.error(
            `[HistorySyncState] write failed for ${ticker} (${market}):`,
            error.message
        );
    }
}


// items: [{ ticker, market }]  ->  Map("TICKER|MARKET" -> state)
async function loadStates(items) {
    const map = new Map();

    if (!Array.isArray(items) || items.length === 0) {
        return map;
    }

    try {
        const rows =
            await HistorySyncState.find({
                $or: items.map(item => ({
                    ticker: item.ticker,
                    market: item.market
                }))
            }).lean();

        for (const row of rows) {
            map.set(
                keyOf(row.ticker, row.market),
                row
            );
        }
    } catch (error) {
        console.error(
            '[HistorySyncState] load failed:',
            error.message
        );
    }

    return map;
}


// The provider was asked about this expected date just now
async function recordCheck({
    ticker,
    market,
    expectedDate
}) {
    await write(
        ticker,
        market,
        {
            $set: {
                lastCheckedFor: expectedDate || null,
                lastCheckedAt: new Date()
            }
        }
    );
}


// The provider returned usable rows.
// If its newest row is older than expected, back off further each time
// (6h, 12h, 24h, then 48h) so a delisted or very late stock stops
// costing a request on every cycle.
async function recordSuccess({
    ticker,
    market,
    newestDate = null,
    expectedDate = null,
    previousBehindCount = 0
}) {
    const behind =
        Boolean(
            expectedDate &&
            (!newestDate || newestDate < expectedDate)
        );

    const behindCount =
        behind
            ? Number(previousBehindCount || 0) + 1
            : 0;

    const delayMs =
        behind
            ? Math.min(
                6 * HOUR * Math.pow(2, behindCount - 1),
                48 * HOUR
            )
            : 0;

    await write(
        ticker,
        market,
        {
            $set: {
                status: 'ok',
                lastSuccessAt: new Date(),
                failCount: 0,
                lastError: '',
                behindCount,
                nextRetryAt:
                    behind
                        ? new Date(Date.now() + delayMs)
                        : null
            }
        }
    );

    return { behind, behindCount, delayMs };
}


// The provider answered but has no history for this stock
async function recordNoData({ ticker, market }) {
    await write(
        ticker,
        market,
        {
            $set: {
                status: 'no_data',
                failCount: 0,
                lastError: '',
                nextRetryAt: null
            }
        }
    );
}


// The provider failed
async function recordFailure({
    ticker,
    market,
    failCount,
    nextRetryAt,
    error = ''
}) {
    await write(
        ticker,
        market,
        {
            $set: {
                status: 'failed',
                failCount,
                nextRetryAt,
                lastError: String(error).slice(0, 200)
            }
        }
    );
}


// Stocks the provider has no history for (rechecked weekly)
async function listNoData() {
    try {
        return await HistorySyncState.find({
            status: 'no_data'
        })
            .select({ ticker: 1, market: 1 })
            .lean();
    } catch (error) {
        console.error(
            '[HistorySyncState] listNoData failed:',
            error.message
        );

        return [];
    }
}


module.exports = {
    loadStates,
    recordCheck,
    recordSuccess,
    recordNoData,
    recordFailure,
    listNoData
};