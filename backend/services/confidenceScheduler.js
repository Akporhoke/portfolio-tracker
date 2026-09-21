const cron = require('node-cron');

const Portfolio =
    require('../models/portfolio');

const PriceHistory =
    require('../models/PriceHistory');

const {
    getPriceHistory,
    getHistoricalProviderStatus
} = require('../utils/getPrice');

const {
    runPriceHistoryRetention
} = require('./dataRetention');

const portfolioRoutes =
    require('../routes/portfolio');

const Stock =
    require('../models/Stock');


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
    /*
 * Recheck stocks whose historical data is
 * currently unavailable once every week.
 */
const HISTORY_RECHECK_CRON =
    '0 2 * * 0';


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

        let initialFetches = 0;
        let incrementalFetches = 0;
        let failed = 0;
        let totalFetches = 0;


        const stockKeys =
    Array.from(
        uniqueStocks.values()
    ).map(stock => ({
        ticker: stock.ticker,
        market: stock.market
    }));

const directoryStocks =
    await Stock.find({
        $or: stockKeys
    })
        .select({
            ticker: 1,
            market: 1,
            active: 1,
            historyStatus: 1
        })
        .lean();

const directoryMap =
    new Map();

for (const stock of directoryStocks) {
    directoryMap.set(
        `${stock.ticker}|${stock.market}`,
        stock
    );
}

        const candidates = [];

        let alreadyCurrent = 0;

        let skipped = 0;

        for (
            const stock of
            uniqueStocks.values()
        ) {

           const stockRecord =
    directoryMap.get(
        `${stock.ticker}|${stock.market}`
    );

if (
    stockRecord?.historyStatus ===
    'unavailable'
) {
    console.log(
        `⏭️ ${stock.ticker} (${stock.market}) skipped: historical data unavailable`
    );

    skipped++;
    continue;
}
            const today =
                marketToday(
                    stock.market
                );


            const status =
                await getHistoryStatus(
                    stock.ticker,
                    stock.market
                );


            const count =
                status.count;


            const latestDate =
                status.latestDate;


            const existingToday =
                await PriceHistory.exists({
                    ticker:
                        stock.ticker,

                    market:
                        stock.market,

                    date:
                        today
                });


            /*
             * ----------------------------------------------------
             * 60+ history rows
             * ----------------------------------------------------
             *
             * A fully populated stock that already has
             * today's completed history does not need another
             * provider request.
             */

            if (
                count >=
                INITIAL_HISTORY_DAYS &&
                existingToday
            ) {

                console.log(
                    `✓ ${stock.ticker} (${stock.market}) already has ${today} history`
                );

                alreadyCurrent++;

                continue;
            }


            /*
             * ----------------------------------------------------
             * Candidate
             * ----------------------------------------------------
             *
             * Important:
             *
             * A stock with fewer than 60 rows remains a
             * candidate even when it already has today's row.
             *
             * This allows newly listed stocks such as AVACAP
             * to continue accumulating history.
             */

            candidates.push({
                ticker:
                    stock.ticker,

                market:
                    stock.market,

                count:
                    count,

                latestDate:
                    latestDate,

                existingToday:
                    Boolean(
                        existingToday
                    )
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
             * ----------------------------------------------------
             * INITIAL HISTORY
             * ----------------------------------------------------
             *
             * No stored history at all.
             */

            if (
                count === 0
            ) {

                historyDays =
                    INITIAL_HISTORY_DAYS;

                fetchType =
                    'initial';

            }


            /*
             * ----------------------------------------------------
             * PARTIAL / EXISTING HISTORY
             * ----------------------------------------------------
             *
             * Any stock that already has real history uses
             * the small incremental window.
             *
             * This includes newly listed stocks such as AVACAP.
             */

            else {

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


                                    // ------------------------------------------------------------
// Missing Stock directory record
// ------------------------------------------------------------

const directoryStock =
    await Stock.findOne({
        ticker,
        market
    }).lean();

if (!directoryStock) {
    console.log(
        `⏸️ ${ticker} (${market}): no Stock directory record; skipping history sync`
    );

    skipped += 1;

    continue;
}

                const result =
                    await getHistoricalProviderStatus(
                        ticker,
                        historyDays,
                        market,
                        null
                    );

                /*
                 * Real provider history is available.
                 */

               if (
    result.status ===
    'available'
) {
    const rows =
        result.rows || [];

    console.log(
        `✓ ${ticker} (${market}): ${rows.length} real provider history rows returned`
    );

    if (rows.length > 0) {
        const historyOperations =
            rows.map(row => ({
                updateOne: {
                    filter: {
                        ticker,
                        market,
                        date: row.date
                    },

                    update: {
                        $set: {
                            open:
                                row.open,

                            high:
                                row.high,

                            low:
                                row.low,

                            close:
                                row.close,

                            volume:
                                row.volume,

                            source:
                                market === 'US'
                                    ? 'finnhub'
                                    : 'investo'
                        }
                    },

                    upsert: true
                }
            }));

        await PriceHistory.bulkWrite(
            historyOperations,
            {
                ordered: false
            }
        );

        console.log(
            `✓ ${ticker} (${market}): ${rows.length} provider history rows saved`
        );
    }

    await Stock.updateOne(
        {
            ticker,
            market
        },
        {
            $set: {
                historyStatus:
                    'available',

                lastStatusCheck:
                    new Date()
            }
        }
    );
}

                /*
                 * Provider responded successfully,
                 * but has no historical data.
                 *
                 * This is the condition that freezes
                 * future daily historical requests.
                 */

                else if (
                    result.status ===
                    'no_data'
                ) {

                    console.log(
                        `⏸️ ${ticker} (${market}): provider has no historical data`
                    );

                    await Stock.updateOne(
                        {
                            ticker,
                            market
                        },
                        {
                            $set: {
                                historyStatus:
                                    'unavailable',

                                lastStatusCheck:
                                    new Date()
                            }
                        }
                    );

                }

                /*
                 * Provider failure / quota / cooldown.
                 *
                 * Do NOT change historyStatus.
                 */

                else {

                    failed++;

                    console.log(
                        `⚠️ ${ticker} (${market}): historical provider unavailable`
                    );
                }

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
// WEEKLY HISTORY RECHECK
// ============================================================

async function runHistoryRecheck() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE WEEKLY HISTORY RECHECK'
    );
    console.log(
        '================================'
    );

    try {
        /*
         * Only recheck securities that:
         *
         * 1. are still active securities
         * 2. have historical data marked unavailable
         *
         * Live prices are NOT affected by this status.
         */

        const stocks =
            await Stock.find({
                active: true,
                historyStatus:
                    'unavailable'
            })
                .select({
                    ticker: 1,
                    market: 1
                })
                .lean();

        console.log(
            `Historical-data stocks to recheck: ${stocks.length}`
        );

        let recovered = 0;
        let stillUnavailable = 0;
        let failed = 0;

        for (const stock of stocks) {

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

            console.log(
                `→ Rechecking ${ticker} (${market}) history`
            );

            try {

                const result =
    await getHistoricalProviderStatus(
        ticker,
        INCREMENTAL_HISTORY_DAYS,
        market,
        null
    );

                /*
                 * Provider successfully responded.
                 *
                 * Any real rows mean historical data
                 * is available again.
                 */

                if (
    result.status ===
    'available'
) {

    await Stock.updateOne(
        {
            ticker,
            market
        },
        {
            $set: {
                historyStatus:
                    'available',

                lastStatusCheck:
                    new Date()
            }
        }
    );

    recovered++;

    console.log(
        `✅ ${ticker} (${market}) history recovered`
    );

} else if (
    result.status ===
    'no_data'
) {

    await Stock.updateOne(
        {
            ticker,
            market
        },
        {
            $set: {
                historyStatus:
                    'unavailable',

                lastStatusCheck:
                    new Date()
            }
        }
    );

    stillUnavailable++;

    console.log(
        `⏭️ ${ticker} (${market}) still has no historical data`
    );

} else {

    failed++;

    console.log(
        `⚠️ ${ticker} (${market}): provider failed during history recheck`
    );
}

            } catch (error) {

                failed++;

                /*
                 * IMPORTANT:
                 *
                 * Do not change historyStatus when
                 * the provider itself fails.
                 */

                console.error(
                    `[HistoryRecheck] ${ticker} (${market}):`,
                    error.message
                );
            }
        }

        console.log('');
        console.log(
            `Recovered:           ${recovered}`
        );

        console.log(
            `Still unavailable:   ${stillUnavailable}`
        );

        console.log(
            `Provider failures:   ${failed}`
        );

        console.log(
            '================================'
        );

        console.log('');

    } catch (error) {

        console.error(
            '[HistoryRecheck] Fatal error:',
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
let historyRecheckTask = null;
let confidenceTask = null;
let retentionTask = null;


function startConfidenceScheduler() {
    if (
    historyTask ||
    historyRecheckTask ||
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
 * Weekly recheck for frozen historical data.
 */

historyRecheckTask =
    cron.schedule(
        HISTORY_RECHECK_CRON,
        runHistoryRecheck,
        {
            timezone:
                TIME_ZONE,

            noOverlap:
                true
        }
    );

    console.log(
    `  ↳ Frozen history recheck: Sunday 02:00 (${TIME_ZONE})`
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

    if (historyRecheckTask) {
    historyRecheckTask.stop();

    historyRecheckTask = null;
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
    runHistoryRecheck,
    runConfidenceCheck,
    runRetention
};