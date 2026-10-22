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
    
const calendarService =
    require('./marketCalendarService');

const syncState =
    require('./historySyncState');

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
 * After a provider check for a given expected date, do not
 * check that stock again for this long, whether or not the
 * provider returned the new bar. Stops late-publishing
 * providers from being polled every 30 minutes.
 * (In memory for now; Phase 1 makes this persistent.)
 */
const HISTORY_RECHECK_AFTER_MS =
    6 * 60 * 60 * 1000;

 


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

async function getExpectedCompletedDate(market) {
    try {
        const date =
            await calendarService
                .getLastCompletedTradingDate(market);

        if (date) {
            return date;
        }
    } catch (error) {
        console.error(
            `[ExpectedDate] ${market}:`,
            error.message
        );
    }

    return getLatestExpectedCompletedTradingDate(
        market
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


function toTime(value) {
    return value
        ? new Date(value).getTime()
        : 0;
}


async function registerHistoryFailure({
    ticker,
    market,
    failCount,
    hasDirectory,
    errorMessage
}) {
    const newFailCount =
        Number(failCount || 0) + 1;

    const nextRetryAt =
        calculateNextRetryAt(
            newFailCount
        );

    await syncState.recordFailure({
        ticker,
        market,
        failCount: newFailCount,
        nextRetryAt,
        error: errorMessage
    });

    if (hasDirectory) {
        await Stock.updateOne(
            { ticker, market },
            {
                $set: {
                    historySyncStatus: 'failed',
                    lastAttemptAt: new Date(),
                    lastCheckedDate: marketToday(market),
                    failCount: newFailCount,
                    nextRetryAt,
                    lastStatusCheck: new Date()
                }
            }
        );
    }

    return nextRetryAt;
}


async function runHistorySync() {

    if (historySyncRunning) {
        console.log(
            '⏭️ History sync already running. Skipping duplicate run.'
        );

        return;
    }

    historySyncRunning = true;

    await updateHistorySchedulerStatus({
        status: 'running',
        startedAt: new Date(),
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
    console.log('================================');
    console.log('GAZE DAILY HISTORY SYNC');
    console.log('================================');

    try {
        const portfolios =
            await Portfolio.find({});

        // ----------------------------------------------------
        // One unique ticker/market list (holdings + watchlists)
        // ----------------------------------------------------

        const uniqueStocks =
            new Map();

        for (const portfolio of portfolios) {
            for (
                const list of
                [portfolio.stocks, portfolio.watchlist]
            ) {
                if (!Array.isArray(list)) {
                    continue;
                }

                for (const item of list) {
                    if (!item) {
                        continue;
                    }

                    const ticker =
                        normalizeTicker(item.ticker);

                    const market =
                        normalizeMarket(item.market);

                    if (!ticker) {
                        continue;
                    }

                    const key =
                        `${ticker}|${market}`;

                    if (!uniqueStocks.has(key)) {
                        uniqueStocks.set(
                            key,
                            { ticker, market }
                        );
                    }
                }
            }
        }

        let initialFetches = 0;
        let incrementalFetches = 0;
        let failed = 0;
        let totalFetches = 0;
        let safetyCapReached = false;
        let alreadyCurrent = 0;
        let skipped = 0;

        const stockKeys =
            Array.from(uniqueStocks.values());

        const directoryStocks =
            stockKeys.length > 0
                ? await Stock.find({ $or: stockKeys })
                    .select({
                        ticker: 1,
                        market: 1,
                        historyStatus: 1,
                        failCount: 1,
                        nextRetryAt: 1
                    })
                    .lean()
                : [];

        const directoryMap =
            new Map();

        for (const stock of directoryStocks) {
            directoryMap.set(
                `${stock.ticker}|${stock.market}`,
                stock
            );
        }

        const stateMap =
            await syncState.loadStates(stockKeys);

        const expectedByMarket = {
            NGX: await getExpectedCompletedDate('NGX'),
            US: await getExpectedCompletedDate('US')
        };

        // ----------------------------------------------------
        // Decide which stocks need a provider request
        // ----------------------------------------------------

        const candidates = [];

        for (const stock of uniqueStocks.values()) {
            const key =
                `${stock.ticker}|${stock.market}`;

            const stockRecord =
                directoryMap.get(key);

            const state =
                stateMap.get(key);

            // MongoDB history is checked first, before any state
            const status =
                await getHistoryStatus(
                    stock.ticker,
                    stock.market
                );

            const count =
                status.count;

            const latestDate =
                status.latestDate;

            const expectedLatestDate =
                expectedByMarket[stock.market];

            const isCurrent =
                count > 0 &&
                latestDate &&
                latestDate >= expectedLatestDate;

            // Current: nothing to fetch
            if (isCurrent) {
                console.log(
                    `✓ ${stock.ticker} (${stock.market}) is current through ${latestDate}`
                );

                alreadyCurrent++;

                if (stockRecord) {
                    await Stock.updateOne(
                        {
                            ticker: stock.ticker,
                            market: stock.market
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

            // Provider has no history for this stock
            const noHistory =
                (
                    stockRecord &&
                    stockRecord.historyStatus === 'unavailable'
                ) ||
                (
                    state &&
                    state.status === 'no_data'
                );

            if (noHistory && count === 0) {
                console.log(
                    `⏭️ ${stock.ticker} (${stock.market}) skipped: historical data unavailable`
                );

                skipped++;

                continue;
            }

            // Retry / back-off time (saved state wins)
            const retryAt =
                Math.max(
                    toTime(state && state.nextRetryAt),
                    toTime(stockRecord && stockRecord.nextRetryAt)
                );

            if (retryAt > Date.now()) {
                console.log(
                    `⏳ ${stock.ticker} (${stock.market}) retry deferred until ${new Date(retryAt).toISOString()}`
                );

                skipped++;

                continue;
            }

            // Already checked for this expected date recently
            if (
                state &&
                state.lastCheckedFor === expectedLatestDate &&
                state.lastCheckedAt &&
                Date.now() - toTime(state.lastCheckedAt) <
                    HISTORY_RECHECK_AFTER_MS
            ) {
                console.log(
                    `⏳ ${stock.ticker} (${stock.market}) checked recently for ${expectedLatestDate}; not rechecking yet`
                );

                skipped++;

                continue;
            }

            candidates.push({
                ticker: stock.ticker,
                market: stock.market,
                count,
                latestDate,
                expectedLatestDate,
                failCount: Math.max(
                    Number((state && state.failCount) || 0),
                    Number((stockRecord && stockRecord.failCount) || 0)
                ),
                behindCount: Number(
                    (state && state.behindCount) || 0
                )
            });
        }

        // ----------------------------------------------------
        // Priority: no history first, then oldest history
        // ----------------------------------------------------

        candidates.sort(
            (a, b) => {
                const aHas = a.count > 0;
                const bHas = b.count > 0;

                if (aHas !== bHas) {
                    return aHas ? 1 : -1;
                }

                if (!a.latestDate && !b.latestDate) {
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

        // ----------------------------------------------------
        // Sync
        // ----------------------------------------------------

        for (const candidate of candidates) {
            if (
                MAX_HISTORY_FETCHES_PER_RUN !== null &&
                totalFetches >= MAX_HISTORY_FETCHES_PER_RUN
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
                latestDate,
                expectedLatestDate,
                failCount,
                behindCount
            } = candidate;

            const fetchType =
                count === 0
                    ? 'initial'
                    : 'incremental';

            const historyDays =
                count === 0
                    ? INITIAL_HISTORY_DAYS
                    : INCREMENTAL_HISTORY_DAYS;

            const hasDirectory =
                directoryMap.has(`${ticker}|${market}`);

            try {
                const today =
                    marketToday(market);

                // Report only, no provider request
                if (DRY_RUN) {
                    console.log(`🧪 DRY RUN → ${ticker} (${market})`);
                    console.log(`   Type: ${fetchType}`);
                    console.log(`   Days: ${historyDays}`);
                    console.log(`   Existing rows: ${count}`);
                    console.log(`   Latest stored date: ${latestDate || 'none'}`);

                    continue;
                }

                if (hasDirectory) {
                    await Stock.updateOne(
                        { ticker, market },
                        { $set: { historySyncStatus: 'updating' } }
                    );
                }

                const result =
                    await getHistoricalProviderStatus(
                        ticker,
                        historyDays,
                        market,
                        today
                    );

                // A real provider request was made
                if (result.requestMade !== false) {
                    totalFetches++;

                    if (fetchType === 'initial') {
                        initialFetches++;
                    } else {
                        incrementalFetches++;
                    }

                    await syncState.recordCheck({
                        ticker,
                        market,
                        expectedDate: expectedLatestDate
                    });
                }

                // Cooldown or budget used up: no request, no failure
                if (result.status === 'cooldown') {
                    console.log(
                        `⏸️ ${ticker} (${market}): provider cooldown or budget; will retry on a later cycle`
                    );

                    if (hasDirectory) {
                        await Stock.updateOne(
                            { ticker, market },
                            { $set: { historySyncStatus: 'stale' } }
                        );
                    }

                    skipped++;

                    continue;
                }

                // Real provider history
                if (result.status === 'available') {
                    const rows =
                        result.rows || [];

                    console.log(
                        `✓ ${ticker} (${market}): ${rows.length} real provider history rows returned`
                    );

                    if (rows.length > 0) {
                        await PriceHistory.bulkWrite(
                            rows.map(row => ({
                                updateOne: {
                                    filter: {
                                        ticker,
                                        market,
                                        date: row.date
                                    },

                                    update: {
                                        $set: {
                                            open: row.open,
                                            high: row.high,
                                            low: row.low,
                                            close: row.close,
                                            volume: row.volume,
                                            source:
                                                market === 'US'
                                                    ? 'twelvedata'
                                                    : 'investo'
                                        }
                                    },

                                    upsert: true
                                }
                            })),
                            { ordered: false }
                        );

                        console.log(
                            `✓ ${ticker} (${market}): ${rows.length} provider history rows saved`
                        );
                    }

                    const newestDate =
                        rows
                            .map(row => row.date)
                            .sort()
                            .at(-1) || null;

                    const outcome =
                        await syncState.recordSuccess({
                            ticker,
                            market,
                            newestDate,
                            expectedDate: expectedLatestDate,
                            previousBehindCount: behindCount
                        });

                    if (outcome.behind) {
                        console.log(
                            `   ↳ ${ticker}: provider data ends ${newestDate || 'never'}, expected ${expectedLatestDate}; next check in ${Math.round(outcome.delayMs / 3600000)}h`
                        );
                    }

                    if (hasDirectory) {
                        await Stock.updateOne(
                            { ticker, market },
                            {
                                $set: {
                                    historyStatus: 'available',
                                    historySyncStatus: 'current',
                                    historyLastUpdated: new Date(),
                                    historyLatestDate: newestDate,
                                    lastHistoryDate: newestDate,
                                    lastCheckedDate: today,
                                    lastAttemptAt: new Date(),
                                    lastStatusCheck: new Date(),
                                    failCount: 0,
                                    nextRetryAt: null
                                }
                            }
                        );
                    }

                    continue;
                }

                // Provider answered but has no history for this stock
                if (result.status === 'no_data') {
                    console.log(
                        `⏸️ ${ticker} (${market}): provider has no historical data`
                    );

                    await syncState.recordNoData({
                        ticker,
                        market
                    });

                    if (hasDirectory) {
                        await Stock.updateOne(
                            { ticker, market },
                            {
                                $set: {
                                    historyStatus: 'unavailable',
                                    historySyncStatus: 'stale',
                                    lastStatusCheck: new Date()
                                }
                            }
                        );
                    }

                    continue;
                }

                // Provider failure or quota error
                const nextRetryAt =
                    await registerHistoryFailure({
                        ticker,
                        market,
                        failCount,
                        hasDirectory,
                        errorMessage: result.status
                    });

                failed++;

                console.log(
                    `⚠️ ${ticker} (${market}): historical provider unavailable`
                );

                console.log(
                    `   ↳ Retry scheduled for ${nextRetryAt.toISOString()}`
                );

            } catch (error) {
                failed++;

                const nextRetryAt =
                    await registerHistoryFailure({
                        ticker,
                        market,
                        failCount,
                        hasDirectory,
                        errorMessage: error.message
                    });

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
        console.log(`Initial history fetches:     ${initialFetches}`);
        console.log(`Incremental history fetches: ${incrementalFetches}`);
        console.log(`Already current:             ${alreadyCurrent}`);
        console.log(`Skipped:                      ${skipped}`);
        console.log(`Failed:                       ${failed}`);
        console.log(`API fetches this run:        ${totalFetches}`);
        console.log(`Unique stocks found:         ${uniqueStocks.size}`);
        console.log('================================');
        console.log('');

        // Confidence only reads MongoDB, so this costs no API calls
        if (totalFetches > 0) {
            await runConfidenceCheck();
        }

        await updateHistorySchedulerStatus({
            status: 'success',
            completedAt: new Date(),
            lastSuccessfulAt: new Date(),
            stocksFound: uniqueStocks.size,
            initialFetches,
            incrementalFetches,
            alreadyCurrent,
            skipped,
            failed,
            apiFetches: totalFetches,
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
    console.log('================================');
    console.log('GAZE WEEKLY HISTORY RECHECK');
    console.log('================================');

    try {
        // Stocks marked "unavailable" in the directory, plus stocks the
        // saved sync state says have no history (covers stocks that have
        // no directory record)
        const directory =
            await Stock.find({
                active: true,
                historyStatus: 'unavailable'
            })
                .select({ ticker: 1, market: 1 })
                .lean();

        const noDataStates =
            await syncState.listNoData();

        const targets =
            new Map();

        for (const item of [...directory, ...noDataStates]) {
            const ticker =
                normalizeTicker(item.ticker);

            const market =
                normalizeMarket(item.market);

            if (ticker) {
                targets.set(
                    `${ticker}|${market}`,
                    { ticker, market }
                );
            }
        }

        console.log(
            `Historical-data stocks to recheck: ${targets.size}`
        );

        let recovered = 0;
        let stillUnavailable = 0;
        let failed = 0;
        let deferred = 0;

        for (const { ticker, market } of targets.values()) {
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

                if (result.status === 'available') {
                    await Stock.updateOne(
                        { ticker, market },
                        {
                            $set: {
                                historyStatus: 'available',
                                lastStatusCheck: new Date()
                            }
                        }
                    );

                    await syncState.recordSuccess({
                        ticker,
                        market
                    });

                    recovered++;

                    console.log(
                        `✅ ${ticker} (${market}) history recovered`
                    );

                } else if (result.status === 'no_data') {
                    await Stock.updateOne(
                        { ticker, market },
                        {
                            $set: {
                                historyStatus: 'unavailable',
                                lastStatusCheck: new Date()
                            }
                        }
                    );

                    await syncState.recordNoData({
                        ticker,
                        market
                    });

                    stillUnavailable++;

                    console.log(
                        `⏭️ ${ticker} (${market}) still has no historical data`
                    );

                } else if (result.status === 'cooldown') {
                    deferred++;

                    console.log(
                        `⏸️ ${ticker} (${market}): provider cooldown or budget; recheck deferred`
                    );

                } else {
                    failed++;

                    console.log(
                        `⚠️ ${ticker} (${market}): provider failed during history recheck`
                    );
                }

            } catch (error) {
                failed++;

                // Never change history status when the provider itself fails
                console.error(
                    `[HistoryRecheck] ${ticker} (${market}):`,
                    error.message
                );
            }
        }

        console.log('');
        console.log(`Recovered:           ${recovered}`);
        console.log(`Still unavailable:   ${stillUnavailable}`);
        console.log(`Deferred:            ${deferred}`);
        console.log(`Provider failures:   ${failed}`);
        console.log('================================');
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