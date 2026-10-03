const cron = require('node-cron');

const Portfolio =
    require('../models/portfolio');

const PriceHistory =
    require('../models/PriceHistory');

const {
    getHistoricalProviderStatus
} = require('../utils/getPrice');

const {
    runPriceHistoryRetention
} = require('./dataRetention');


const Stock =
    require('../models/Stock');

const SchedulerStatus =
    require('../models/SchedulerStatus');

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

const HISTORY_FRESHNESS_CHECK_INTERVAL_MS =
    30 * 60 * 1000;

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
 * Identify what Gaze WOULD fetch without making
 * a provider request when TRUE.
 */
const DRY_RUN = false;

/*
 * Scheduler-level fetch cap.
 *
 * null = no scheduler-level cap.
 *
 * Provider-specific protection still applies:
 *
 * - US history uses the Twelve Data request queue.
 * - NGX history uses the Investo cooldown system.
 */
const MAX_HISTORY_FETCHES_PER_RUN = null;

/*
 * Retry/backoff settings.
 *
 * These prevent a failed provider from being
 * hammered on every scheduler run.
 */
const HISTORY_RETRY_BASE_MINUTES = 30;
const HISTORY_RETRY_MAX_MINUTES = 24 * 60;

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


function getLatestExpectedCompletedTradingDate(market) {
    const timeZone =
        getMarketTimeZone(market);

    const now = new Date();

    const parts =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }
        ).formatToParts(now);

    const values = {};

    for (const part of parts) {
        values[part.type] = part.value;
    }

    const hour =
        Number(values.hour);

    const minute =
        Number(values.minute);

    const weekday =
        new Intl.DateTimeFormat(
            'en-US',
            {
                timeZone,
                weekday: 'short'
            }
        ).format(now);

    if (weekday === 'Sun') {
        return shiftMarketDate(
            values.year + '-' +
            values.month + '-' +
            values.day,
            market,
            -2
        );
    }

    if (weekday === 'Sat') {
        return shiftMarketDate(
            values.year + '-' +
            values.month + '-' +
            values.day,
            market,
            -1
        );
    }

    const isUS =
        normalizeMarket(market) === 'US';

    const marketCloseMinutes =
        isUS
            ? (16 * 60)
            : (14 * 60 + 30);

    const currentMinutes =
        hour * 60 + minute;

    if (
        currentMinutes <
        marketCloseMinutes
    ) {
        return shiftMarketDate(
            values.year + '-' +
            values.month + '-' +
            values.day,
            market,
            -1
        );
    }

    return (
        values.year + '-' +
        values.month + '-' +
        values.day
    );
}


function shiftMarketDate(
    dateString,
    market,
    days
) {
    const [year, month, day] =
        dateString
            .split('-')
            .map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    date.setUTCDate(
        date.getUTCDate() + days
    );

    /*
     * Skip weekends.
     *
     * This is deliberately simple for this first
     * freshness-engine step. Holiday awareness can
     * be added separately.
     */
    while (
        date.getUTCDay() === 0 ||
        date.getUTCDay() === 6
    ) {
        date.setUTCDate(
            date.getUTCDate() +
            (days < 0 ? -1 : 1)
        );
    }

    return date
        .toISOString()
        .slice(0, 10);
}


function calculateNextRetryAt(failCount) {

    const safeFailCount =
        Math.max(
            1,
            Number(failCount) || 1
        );

    const delayMinutes =
        Math.min(
            HISTORY_RETRY_BASE_MINUTES *
                Math.pow(2, safeFailCount - 1),

            HISTORY_RETRY_MAX_MINUTES
        );

    return new Date(
        Date.now() +
        delayMinutes * 60 * 1000
    );
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

async function updateHistorySchedulerStatus(update) {
    try {
        await SchedulerStatus.findOneAndUpdate(
            {
                job: 'history_sync'
            },
            {
                $set: update
            },
            {
                upsert: true
            }
        );
    } catch (error) {
        console.error(
            '[SchedulerStatus] Failed to save status:',
            error.message
        );
    }
}


async function runHistorySync() {

    if (historySyncRunning) {
        console.log(
            '⏭️ History sync already running. Skipping duplicate run.'
        );

        return;
    }

    historySyncRunning = true;

    const syncStartedAt = new Date();

    await updateHistorySchedulerStatus({
        status: 'running',
        startedAt: syncStartedAt,
        completedAt: null,
        error: null,
        stocksFound: 0,
        initialFetches: 0,
        incrementalFetches: 0,
        alreadyCurrent: 0,
        skipped: 0,
        failed: 0,
        apiFetches: 0,
        safetyCapReached: false
    });

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

        for (const portfolio of portfolios) {

            /*
             * --------------------------------------------------------
             * Portfolio holdings
             * --------------------------------------------------------
             */

            if (Array.isArray(portfolio.stocks)) {
                for (const stock of portfolio.stocks) {
                    if (!stock) {
                        continue;
                    }

                    const ticker =
                        normalizeTicker(stock.ticker);

                    const market =
                        normalizeMarket(stock.market);

                    if (!ticker) {
                        continue;
                    }

                    const key =
                        `${ticker}|${market}`;

                    if (!uniqueStocks.has(key)) {
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
             * Watchlist
             * --------------------------------------------------------
             */

            if (Array.isArray(portfolio.watchlist)) {
                for (const stock of portfolio.watchlist) {
                    if (!stock) {
                        continue;
                    }

                    const ticker =
                        normalizeTicker(stock.ticker);

                    const market =
                        normalizeMarket(stock.market);

                    if (!ticker) {
                        continue;
                    }

                    const key =
                        `${ticker}|${market}`;

                    if (!uniqueStocks.has(key)) {
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
        let safetyCapReached = false;

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
                    historyStatus: 1,
                    historySyncStatus: 1,
                    historyLatestDate: 1,
                    lastHistoryDate: 1,
                    lastCheckedDate: 1,
                    lastAttemptAt: 1,
                    failCount: 1,
                    nextRetryAt: 1
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

            const key =
                `${stock.ticker}|${stock.market}`;

            const stockRecord =
                directoryMap.get(key);

            /*
             * ----------------------------------------------------
             * NO STOCK DIRECTORY RECORD
             * ----------------------------------------------------
             */

            if (!stockRecord) {

                console.log(
                    `ℹ️ ${stock.ticker} (${stock.market}): no Stock directory record; using portfolio/watchlist as history source`
                );

            }

            /*
             * ----------------------------------------------------
             * GET STORED HISTORY STATUS
             * ----------------------------------------------------
             *
             * IMPORTANT:
             *
             * MongoDB PriceHistory is checked BEFORE
             * historyStatus / retry state.
             *
             * This means existing fresh MongoDB history
             * is always respected and does not trigger
             * a provider request.
             */

            const status =
                await getHistoryStatus(
                    stock.ticker,
                    stock.market
                );

            const count =
                status.count;

            const latestDate =
                status.latestDate;

            /*
             * ----------------------------------------------------
             * DETERMINE WHETHER HISTORY IS CURRENT
             * ----------------------------------------------------
             */

            const expectedLatestDate =
                getLatestExpectedCompletedTradingDate(
                    stock.market
                );

            const isCurrent =
                count > 0 &&
                latestDate &&
                latestDate >= expectedLatestDate;

            /*
             * ----------------------------------------------------
             * CURRENT
             * ----------------------------------------------------
             */

            if (isCurrent) {

                console.log(
                    `✓ ${stock.ticker} (${stock.market}) is current through ${latestDate}`
                );

                alreadyCurrent++;

                if (stockRecord) {
                    await Stock.updateOne(
                        {
                            ticker:
                                stock.ticker,

                            market:
                                stock.market
                        },
                        {
                            $set: {
                                lastCheckedDate:
                                    expectedLatestDate
                            }
                        }
                    );
                }

                continue;
            }

            /*
             * ----------------------------------------------------
             * HISTORICAL DATA PERMANENTLY UNAVAILABLE
             * ----------------------------------------------------
             *
             * Only apply this after MongoDB has been checked.
             *
             * If MongoDB already contains history, that history
             * remains the source of truth for freshness.
             */

            if (
                stockRecord &&
                stockRecord.historyStatus ===
                    'unavailable' &&
                count === 0
            ) {

                console.log(
                    `⏭️ ${stock.ticker} (${stock.market}) skipped: historical data unavailable`
                );

                skipped++;

                continue;
            }

            /*
             * ----------------------------------------------------
             * RETRY BACKOFF
             * ----------------------------------------------------
             *
             * If this stock recently failed, do not immediately
             * hit the provider again.
             */

            if (
                stockRecord &&
                stockRecord.nextRetryAt &&
                new Date(stockRecord.nextRetryAt) >
                    new Date()
            ) {

                console.log(
                    `⏳ ${stock.ticker} (${stock.market}) retry deferred until ${new Date(stockRecord.nextRetryAt).toISOString()}`
                );

                skipped++;

                continue;
            }

            /*
             * ----------------------------------------------------
             * STALE / INITIAL CANDIDATE
             * ----------------------------------------------------
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

                expectedLatestDate:
                    expectedLatestDate,

                failCount:
                    Number(
                        stockRecord?.failCount || 0
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
         * With no scheduler-level cap, all eligible
         * candidates can now be processed. Provider-specific
         * queues/cooldowns still control actual requests.
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
             * ----------------------------------------------------
             * SCHEDULER FETCH CAP
             * ----------------------------------------------------
             *
             * null = no scheduler-level cap.
             *
             * Provider-specific protection still applies.
             */

            if (
                MAX_HISTORY_FETCHES_PER_RUN !== null &&
                totalFetches >=
                    MAX_HISTORY_FETCHES_PER_RUN
            ) {

                console.log(
                    `⏸️ Temporary history sync cap reached (${MAX_HISTORY_FETCHES_PER_RUN} fetches).`
                );

                safetyCapReached = true;

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
             * Keep this outside the try block so the catch
             * handler can safely use the directory record
             * if an unexpected error occurs.
             */

            const directoryStock =
                await Stock.findOne({
                    ticker,
                    market
                }).lean();

            try {

                // ------------------------------------------------------------
                // Missing Stock directory record
                // ------------------------------------------------------------

                if (!directoryStock) {
                    console.log(
                        `ℹ️ ${ticker} (${market}): no Stock directory record; continuing with history sync`
                    );
                }

                if (directoryStock) {
                    await Stock.updateOne(
                        {
                            ticker,
                            market
                        },
                        {
                            $set: {
                                historySyncStatus:
                                    'updating'
                            }
                        }
                    );
                }

                const today =
                    marketToday(market);

                /*
                 * ----------------------------------------------------
                 * DRY RUN
                 * ----------------------------------------------------
                 *
                 * Identify what Gaze WOULD fetch without making
                 * a provider request.
                 */

                if (DRY_RUN) {

                    console.log(
                        `🧪 DRY RUN → ${ticker} (${market})`
                    );

                    console.log(
                        `   Type: ${fetchType}`
                    );

                    console.log(
                        `   Days: ${historyDays}`
                    );

                    console.log(
                        `   Existing rows: ${count}`
                    );

                    console.log(
                        `   Latest stored date: ${latestDate || 'none'}`
                    );

                    if (directoryStock) {
                        await Stock.updateOne(
                            {
                                ticker,
                                market
                            },
                            {
                                $set: {
                                    lastCheckedDate:
                                        today
                                }
                            }
                        );
                    }

                    continue;
                }

                const result =
                    await getHistoricalProviderStatus(
                        ticker,
                        historyDays,
                        market,
                        today
                    );

                if (result.requestMade !== false) {

                    totalFetches++;

                    if (fetchType === 'initial') {
                        initialFetches++;
                    } else {
                        incrementalFetches++;
                    }
                }

                /*
                 * ----------------------------------------------------
                 * PROVIDER COOLDOWN
                 * ----------------------------------------------------
                 *
                 * No provider request was made.
                 *
                 * Do not count this as a failure and do not create
                 * a retry backoff. The provider's own cooldown
                 * system controls when another request can be made.
                 */

                if (
                    result.status ===
                    'cooldown'
                ) {

                    console.log(
                        `⏸️ ${ticker} (${market}): provider cooldown active; will retry on a later freshness cycle`
                    );

                    skipped++;

                    continue;
                }

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
                                                    ? 'twelvedata'
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

                    if (directoryStock) {

                        await Stock.updateOne(
                            {
                                ticker,
                                market
                            },
                            {
                                $set: {
                                    historyStatus:
                                        'available',

                                    historySyncStatus:
                                        'current',

                                    historyLastUpdated:
                                        new Date(),

                                    historyLatestDate:
                                        rows.length > 0
                                            ? rows
                                                .map(row => row.date)
                                                .sort()
                                                .at(-1)
                                            : null,

                                    lastHistoryDate:
                                        rows.length > 0
                                            ? rows
                                                .map(row => row.date)
                                                .sort()
                                                .at(-1)
                                            : null,

                                    lastCheckedDate:
                                        today,

                                    lastAttemptAt:
                                        new Date(),

                                    lastStatusCheck:
                                        new Date(),

                                    failCount:
                                        0,

                                    nextRetryAt:
                                        null
                                }
                            }
                        );
                    }
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

                    if (directoryStock) {

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
                }

                /*
                 * Provider failure / quota.
                 *
                 * Do NOT change historyStatus.
                 * The existing historical data may still be valid.
                 * Only mark the synchronization attempt as failed.
                 */

                else {

                    const newFailCount =
                        Number(
                            directoryStock?.failCount || 0
                        ) + 1;

                    const nextRetryAt =
                        calculateNextRetryAt(
                            newFailCount
                        );

                    if (directoryStock) {

                        await Stock.updateOne(
                            {
                                ticker,
                                market
                            },
                            {
                                $set: {
                                    historySyncStatus:
                                        'failed',

                                    lastAttemptAt:
                                        new Date(),

                                    lastCheckedDate:
                                        today,

                                    failCount:
                                        newFailCount,

                                    nextRetryAt:
                                        nextRetryAt,

                                    lastStatusCheck:
                                        new Date()
                                }
                            }
                        );
                    }

                    failed++;

                    console.log(
                        `⚠️ ${ticker} (${market}): historical provider unavailable`
                    );

                    console.log(
                        `   ↳ Retry scheduled for ${nextRetryAt.toISOString()}`
                    );
                }

            } catch (error) {

                failed++;

                const newFailCount =
                    Number(
                        directoryStock?.failCount || 0
                    ) + 1;

                const nextRetryAt =
                    calculateNextRetryAt(
                        newFailCount
                    );

                if (directoryStock) {

                    await Stock.updateOne(
                        {
                            ticker,
                            market
                        },
                        {
                            $set: {
                                historySyncStatus:
                                    'failed',

                                lastAttemptAt:
                                    new Date(),

                                lastCheckedDate:
                                    marketToday(market),

                                failCount:
                                    newFailCount,

                                nextRetryAt:
                                    nextRetryAt,

                                lastStatusCheck:
                                    new Date()
                            }
                        }
                    );
                }

                console.error(
                    `[HistorySync] ${ticker} (${market}):`,
                    error.message
                );

                console.error(
                    `   ↳ Retry scheduled for ${nextRetryAt.toISOString()}`
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

        await updateHistorySchedulerStatus({
            status: 'success',

            completedAt: new Date(),

            lastSuccessfulAt: new Date(),

            stocksFound:
                uniqueStocks.size,

            initialFetches,

            incrementalFetches,

            alreadyCurrent,

            skipped,

            failed,

            apiFetches:
                totalFetches,

            safetyCapReached
        });

    } catch (error) {

        console.error(
            '[HistorySync] Fatal error:',
            error.message
        );

        await updateHistorySchedulerStatus({
            status: 'failed',
            completedAt: new Date(),
            error: error.message
        });

    } finally {

        historySyncRunning = false;

    }
}

// ============================================================
// STARTUP HISTORY CATCH-UP
// ============================================================

async function runStartupHistoryCatchUp() {
    console.log('');
    console.log(
        '================================'
    );
    console.log(
        'GAZE STARTUP HISTORY CATCH-UP'
    );
    console.log(
        '================================'
    );

    console.log(
        '↳ Server startup detected.'
    );

    console.log(
        '↳ Checking for missed historical updates...'
    );

    try {
        await runHistorySync();

        console.log(
            '✓ Startup history catch-up completed.'
        );

    } catch (error) {
        console.error(
            '[StartupHistoryCatchUp] Fatal error:',
            error.message
        );
    }

    console.log(
        '================================'
    );

    console.log('');
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
//
// Snapshot saving happens in ONE place only:
// buildWatchlistConfidence() in routes/portfolio.js.
// That is why the old saveConfidenceSnapshot() helper is removed.
// ============================================================

async function runConfidenceCheck() {
    console.log('');
    console.log('================================');
    console.log('GAZE CONFIDENCE CHECK');
    console.log('================================');

    try {
        // portfolioRoutes is required at the top of this file.
        // routes/portfolio.js exports updateWatchlistConfidence on the router.
        const { updateWatchlistConfidence } = portfolioRoutes;

        if (typeof updateWatchlistConfidence !== 'function') {
            throw new Error(
                'updateWatchlistConfidence is not exported from routes/portfolio.js'
            );
        }

        // Only portfolios that have at least one watchlist item
        const portfolios = await Portfolio.find({
            'watchlist.0': { $exists: true }
        });

        let recalculated = 0;
        let unchanged = 0;
        let skipped = 0;

        for (const portfolio of portfolios) {
            let portfolioChanged = false;

            for (const stock of portfolio.watchlist) {
                if (!stock) {
                    continue;
                }

                // Finished (7/7) cycles are frozen: nothing to do
                if (
                    stock.confidenceLevel &&
                    stock.confidenceLevel.isFinal === true
                ) {
                    skipped++;
                    continue;
                }

                // Remember the state before, to see if anything moved
                const before =
                    `${stock.confidenceLevel?.score}|` +
                    `${stock.confidenceLevel?.postAddDays}`;

                // Recalculates, upserts snapshots, updates stock state
                await updateWatchlistConfidence(portfolio, stock);

                const after =
                    `${stock.confidenceLevel?.score}|` +
                    `${stock.confidenceLevel?.postAddDays}`;

                if (before === after) {
                    unchanged++;
                } else {
                    recalculated++;
                    portfolioChanged = true;
                }
            }

            // Save only portfolios that actually changed
            if (portfolioChanged) {
                try {
                    await portfolio.save();
                } catch (error) {
                    // e.g. the user edited this portfolio at the same moment
                    console.error(
                        `[ConfidenceCheck] Save failed for ${portfolio.userId}:`,
                        error.message
                    );
                }
            }
        }

        console.log('');
        console.log(`Confidence recalculated: ${recalculated}`);
        console.log(`Confidence unchanged:    ${unchanged}`);
        console.log(`Confidence skipped:      ${skipped}`);
        console.log('================================');
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
let historyFreshnessTimer = null;
let historySyncRunning = false;


function startConfidenceScheduler() {

    if (
        historyTask ||
        historyRecheckTask ||
        confidenceTask ||
        retentionTask ||
        historyFreshnessTimer
    ) {
        console.log(
            '⚠️ Gaze scheduler already running.'
        );

        return;
    }

    /*
     * --------------------------------------------------------
     * STARTUP HISTORY CATCH-UP
     * --------------------------------------------------------
     *
     * node-cron does not replay jobs that were missed while
     * the server was offline.
     *
     * Run the existing history sync once when the server
     * starts so missed trading-day history can be recovered.
     *
     * MongoDB freshness is checked before any provider request.
     * There is no scheduler-level fetch cap when the value is null.
     */

    setImmediate(() => {
        runStartupHistoryCatchUp()
            .catch(error => {
                console.error(
                    '[StartupHistoryCatchUp] Unexpected error:',
                    error.message
                );
            });
    });

    historyFreshnessTimer =
        setInterval(() => {

            runHistorySync()
                .catch(error => {
                    console.error(
                        '[HistoryFreshness] Unexpected error:',
                        error.message
                    );
                });

        }, HISTORY_FRESHNESS_CHECK_INTERVAL_MS);

    /*
     * --------------------------------------------------------
     * DAILY HISTORY SYNC
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * WEEKLY HISTORY RECHECK
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * CONFIDENCE CHECKS
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * MONTHLY RETENTION
     * --------------------------------------------------------
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
        '  ↳ Startup history catch-up: enabled'
    );

    console.log(
        '  ↳ History freshness check: every 30 minutes'
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

    if (historyFreshnessTimer) {
        clearInterval(
            historyFreshnessTimer
        );

        historyFreshnessTimer = null;
    }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    startConfidenceScheduler,
    stopConfidenceScheduler,
    runStartupHistoryCatchUp,
    runHistorySync,
    runHistoryRecheck,
    runConfidenceCheck,
    runRetention
};