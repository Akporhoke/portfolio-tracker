const cron = require('node-cron');

const Portfolio =
    require('../models/portfolio');

const PriceHistory =
    require('../models/PriceHistory');

const {
    getPriceHistory
} = require('../utils/getPrice');

const {
    runPriceHistoryRetention
} = require('./dataRetention');

const portfolioRoutes =
    require('../routes/portfolio');


// ============================================================
// CONFIG
// ============================================================

const TIME_ZONE =
    'Africa/Lagos';

/*
 * Run once each weekday night.
 *
 * By this time:
 *
 * NGX should be closed.
 * US markets should also be closed.
 */
const HISTORY_SYNC_CRON =
    '30 23 * * 1-5';

/*
 * Five lightweight confidence checks per day.
 *
 * These checks use MongoDB PriceHistory.
 * They do not force API history refreshes.
 */
const CONFIDENCE_CHECK_CRON =
    '0 1,6,11,16,21 * * *';

/*
 * Run retention cleanup once per month.
 *
 * DRY_RUN in dataRetention.js is currently TRUE,
 * so this only reports what would be deleted.
 */
const RETENTION_CRON =
    '45 23 1 * *';

/*
 * When a stock already has historical data,
 * only request a small recent window.
 */
const INCREMENTAL_HISTORY_DAYS =
    10;

/*
 * When a stock has no history yet, build a
 * substantial initial history set.
 */
const INITIAL_HISTORY_DAYS =
    60;

/*
 * Maximum number of actual history-provider
 * requests in one sync run.
 */
const MAX_HISTORY_FETCHES_PER_RUN =
    5;


// ============================================================
// HELPERS
// ============================================================

function normalizeTicker(ticker) {
    return String(ticker || '')
        .trim()
        .toUpperCase();
}


function normalizeMarket(market) {
    return String(market || 'NGX')
        .trim()
        .toUpperCase() === 'US'
        ? 'US'
        : 'NGX';
}


function getMarketTimeZone(market) {
    return normalizeMarket(market) === 'US'
        ? 'America/New_York'
        : 'Africa/Lagos';
}


function marketToday(market) {
    return new Intl.DateTimeFormat(
        'en-CA',
        {
            timeZone:
                getMarketTimeZone(market),

            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
    ).format(new Date());
}


// ============================================================
// HISTORY STATUS
// ============================================================

async function getHistoryStatus(
    ticker,
    market
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    try {
        const count =
            await PriceHistory.countDocuments({
                ticker: symbol,
                market: normalizedMarket
            });

        const latest =
            await PriceHistory.findOne({
                ticker: symbol,
                market: normalizedMarket
            })
                .sort({
                    date: -1
                })
                .select({
                    date: 1
                })
                .lean();

        return {
            count,

            latestDate:
                latest?.date || null
        };

    } catch (error) {
        console.error(
            `[HistoryStatus] ${symbol} (${normalizedMarket}):`,
            error.message
        );

        return {
            count: 0,
            latestDate: null
        };
    }
}


// ============================================================
// DAILY HISTORY SYNC
// ============================================================

async function runHistorySync() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE DAILY HISTORY SYNC'
    );
    console.log(
        '================================'
    );

    try {
        const portfolios =
            await Portfolio.find({});

        const uniqueStocks =
            new Map();

        /*
         * --------------------------------------------------------
         * Build one unique ticker/market list
         * --------------------------------------------------------
         */

        for (
            const portfolio of portfolios
        ) {
            if (
                !Array.isArray(
                    portfolio.watchlist
                )
            ) {
                continue;
            }

            for (
                const stock of
                portfolio.watchlist
            ) {
                if (!stock) {
                    continue;
                }

                const ticker =
                    normalizeTicker(
                        stock.ticker
                    );

                const market =
                    normalizeMarket(
                        stock.market
                    );

                if (!ticker) {
                    continue;
                }

                const key =
                    `${ticker}|${market}`;

                if (
                    !uniqueStocks.has(key)
                ) {
                    uniqueStocks.set(
                        key,
                        {
                            ticker,
                            market
                        }
                    );
                }
            }
        }

        /*
         * --------------------------------------------------------
         * Determine which stocks need history
         * --------------------------------------------------------
         */

        const candidates = [];

        let alreadyCurrent = 0;

        for (
            const stock of
            uniqueStocks.values()
        ) {
            const today =
                marketToday(
                    stock.market
                );

            const existingToday =
                await PriceHistory.exists({
                    ticker:
                        stock.ticker,

                    market:
                        stock.market,

                    date:
                        today
                });

            if (existingToday) {
                console.log(
                    `✓ ${stock.ticker} (${stock.market}) already has ${today} history`
                );

                alreadyCurrent++;

                continue;
            }

            const status =
                await getHistoryStatus(
                    stock.ticker,
                    stock.market
                );

            candidates.push({
                ticker:
                    stock.ticker,

                market:
                    stock.market,

                count:
                    status.count,

                latestDate:
                    status.latestDate
            });
        }

        /*
         * --------------------------------------------------------
         * PRIORITY
         * --------------------------------------------------------
         *
         * 1. Stocks with no history.
         *
         * 2. Stocks with the oldest stored history.
         *
         * This prevents the first few watchlist stocks
         * from permanently consuming the API safety cap.
         */

        candidates.sort(
            (a, b) => {
                const aHasHistory =
                    a.count > 0;

                const bHasHistory =
                    b.count > 0;

                if (
                    aHasHistory !==
                    bHasHistory
                ) {
                    return aHasHistory
                        ? 1
                        : -1;
                }

                if (
                    !a.latestDate &&
                    !b.latestDate
                ) {
                    return 0;
                }

                if (!a.latestDate) {
                    return -1;
                }

                if (!b.latestDate) {
                    return 1;
                }

                return a.latestDate.localeCompare(
                    b.latestDate
                );
            }
        );

        /*
         * --------------------------------------------------------
         * SYNC
         * --------------------------------------------------------
         */

        let initialFetches = 0;
        let incrementalFetches = 0;
        let skipped = 0;
        let failed = 0;
        let totalFetches = 0;

        for (
            const candidate of
            candidates
        ) {
            /*
             * Stop once the safety cap is reached.
             */

            if (
                totalFetches >=
                MAX_HISTORY_FETCHES_PER_RUN
            ) {
                console.log(
                    `⏸️ History sync safety cap reached (${MAX_HISTORY_FETCHES_PER_RUN} fetches).`
                );

                break;
            }

            const {
                ticker,
                market,
                count,
                latestDate
            } = candidate;

            let historyDays;
            let fetchType;

            /*
             * Initial population.
             */

            if (
                count === 0
            ) {
                historyDays =
                    INITIAL_HISTORY_DAYS;

                fetchType =
                    'initial';

            } else {
                /*
                 * Incremental update.
                 */

                historyDays =
                    INCREMENTAL_HISTORY_DAYS;

                fetchType =
                    'incremental';
            }

            /*
             * Count actual provider request.
             */

            totalFetches++;

            if (
                fetchType === 'initial'
            ) {
                initialFetches++;

                console.log(
                    `→ Initial history for ${ticker} (${market}): ${historyDays} days`
                );

            } else {
                incrementalFetches++;

                console.log(
                    `→ Incremental history for ${ticker} (${market}): last stored ${latestDate || 'unknown'}`
                );
            }

            try {
                const rows =
                    await getPriceHistory(
                        ticker,
                        historyDays,
                        market,
                        null,
                        true
                    );

                console.log(
                    `✓ ${ticker} (${market}): ${rows.length} history rows returned`
                );

            } catch (error) {
                failed++;

                console.error(
                    `[HistorySync] ${ticker} (${market}):`,
                    error.message
                );
            }
        }

        console.log('');
        console.log(
            `Initial history fetches:     ${initialFetches}`
        );

        console.log(
            `Incremental history fetches: ${incrementalFetches}`
        );

        console.log(
            `Already current:             ${alreadyCurrent}`
        );

        console.log(
            `Skipped:                      ${skipped}`
        );

        console.log(
            `Failed:                       ${failed}`
        );

        console.log(
            `API fetches this run:        ${totalFetches}`
        );

        console.log(
            `Unique stocks found:         ${uniqueStocks.size}`
        );

        console.log(
            '================================'
        );

        console.log('');

    } catch (error) {
        console.error(
            '[HistorySync] Fatal error:',
            error.message
        );
    }
}


// ============================================================
// CONFIDENCE CHECK
// ============================================================

async function runConfidenceCheck() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE CONFIDENCE CHECK'
    );
    console.log(
        '================================'
    );

    try {
        const portfolios =
            await Portfolio.find({});

        let recalculated = 0;
        let unchanged = 0;
        let skipped = 0;

        for (
            const portfolio of portfolios
        ) {
            if (
                !Array.isArray(
                    portfolio.watchlist
                )
            ) {
                continue;
            }

            let portfolioChanged = false;

            for (
                const stock of
                portfolio.watchlist
            ) {
                if (!stock) {
                    continue;
                }

                /*
                 * Confidence is frozen after day 7.
                 */

                if (
                    stock.confidenceLevel &&
                    stock.confidenceLevel.isFinal === true
                ) {
                    skipped++;
                    continue;
                }

                const ticker =
                    normalizeTicker(
                        stock.ticker
                    );

                const market =
                    normalizeMarket(
                        stock.market
                    );

                if (!ticker) {
                    skipped++;
                    continue;
                }

                /*
                 * Find the latest completed
                 * historical trading day.
                 */

                const today =
                    marketToday(
                        market
                    );

                const latest =
                    await PriceHistory.findOne({
                        ticker,
                        market,
                        date: {
                            $lt: today
                        }
                    })
                        .sort({
                            date: -1
                        })
                        .lean();

                if (!latest) {
                    console.log(
                        `↳ ${ticker} (${market}): no completed history yet`
                    );

                    unchanged++;
                    continue;
                }

                const latestCompletedDate =
                    latest.date;

                const lastProcessedDate =
                    stock.lastProcessedDate;

                /*
                 * No new completed day.
                 */

                if (
                    lastProcessedDate &&
                    latestCompletedDate <=
                    lastProcessedDate
                ) {
                    unchanged++;
                    continue;
                }

                console.log(
                    `→ New completed day for ${ticker} (${market})`
                );

                console.log(
                    `  ↳ Last processed: ${
                        lastProcessedDate ||
                        'never'
                    }`
                );

                console.log(
                    `  ↳ Latest completed: ${latestCompletedDate}`
                );

                /*
                 * Calculate this ONE watchlist item.
                 */

                if (
                    typeof
                    portfolioRoutes
                        .updateWatchlistConfidence !==
                    'function'
                ) {
                    throw new Error(
                        'updateWatchlistConfidence is not exported from routes/portfolio.js'
                    );
                }

                await portfolioRoutes
                    .updateWatchlistConfidence(
                        portfolio,
                        stock
                    );

                portfolioChanged = true;
                recalculated++;
            }

            if (portfolioChanged) {
                await portfolio.save();
            }
        }

        console.log('');
        console.log(
            `Confidence recalculated: ${recalculated}`
        );

        console.log(
            `Confidence unchanged:    ${unchanged}`
        );

        console.log(
            `Confidence skipped:      ${skipped}`
        );

        console.log(
            '================================'
        );

        console.log('');

    } catch (error) {
        console.error(
            '[ConfidenceCheck] Fatal error:',
            error.message
        );
    }
}


// ============================================================
// RETENTION
// ============================================================

async function runRetention() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE RETENTION CHECK'
    );
    console.log(
        '================================'
    );

    try {
        await runPriceHistoryRetention();

    } catch (error) {
        console.error(
            '[Retention] Fatal error:',
            error.message
        );
    }

    console.log(
        '================================'
    );

    console.log('');
}


// ============================================================
// SCHEDULER
// ============================================================

let historyTask = null;
let confidenceTask = null;
let retentionTask = null;


function startConfidenceScheduler() {
    if (
        historyTask ||
        confidenceTask ||
        retentionTask
    ) {
        console.log(
            '⚠️ Gaze scheduler already running.'
        );

        return;
    }

    /*
     * Daily history sync.
     */

    historyTask =
        cron.schedule(
            HISTORY_SYNC_CRON,
            runHistorySync,
            {
                timezone:
                    TIME_ZONE,

                noOverlap:
                    true
            }
        );

    /*
     * Five confidence checks per day.
     */

    confidenceTask =
        cron.schedule(
            CONFIDENCE_CHECK_CRON,
            runConfidenceCheck,
            {
                timezone:
                    TIME_ZONE,

                noOverlap:
                    true
            }
        );

    /*
     * Monthly retention dry run.
     */

    retentionTask =
        cron.schedule(
            RETENTION_CRON,
            runRetention,
            {
                timezone:
                    TIME_ZONE,

                noOverlap:
                    true
            }
        );

    console.log('');
    console.log(
        '✓ Gaze scheduler started'
    );

    console.log(
        `  ↳ History sync: 23:30 weekdays (${TIME_ZONE})`
    );

    console.log(
        '  ↳ Confidence checks: 01:00, 06:00, 11:00, 16:00, 21:00'
    );

    console.log(
        `  ↳ Retention check: 23:45 on the 1st of each month (${TIME_ZONE})`
    );

    console.log('');
}


// ============================================================
// STOP SCHEDULER
// ============================================================

function stopConfidenceScheduler() {
    if (historyTask) {
        historyTask.stop();

        historyTask = null;
    }

    if (confidenceTask) {
        confidenceTask.stop();

        confidenceTask = null;
    }

    if (retentionTask) {
        retentionTask.stop();

        retentionTask = null;
    }

    console.log(
        '✓ Gaze scheduler stopped'
    );
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    startConfidenceScheduler,
    stopConfidenceScheduler,
    runHistorySync,
    runConfidenceCheck,
    runRetention
};