/*
 * Price scheduler.
 *
 * Keeps stored prices fresh WITHOUT anyone having the app open.
 *
 * How it decides (every minute, and once shortly after start-up):
 *
 *   1. Collect every stock held or watched by any user, plus every stock
 *      that has an active price alert.
 *   2. Read the stored quote for each one (one query).
 *   3. Ask the market calendar whether NGX / US is open, and judge each
 *      quote with the same rules the app uses (assessQuote):
 *        - market open:   refresh when the price is older than the
 *                         refresh age (NGX 5 min, US 2 min)
 *        - market closed: refresh once if the stored price was fetched
 *                         BEFORE the last close, so the real closing
 *                         price is captured
 *   4. Refresh what is due: holdings first, then stocks with alerts, then
 *      the watchlist, oldest first, a few at a time, through the quota
 *      budgeter with the scheduler's share only (the rest stays free for
 *      people).
 *
 * Because it works out "what is due right now" from the stored quotes,
 * not from a clock schedule, downtime is made up automatically: after
 * Render sleeps or restarts, the first cycle (about 20 seconds after
 * start) refreshes everything that went out of date, most important
 * first, and later cycles finish whatever the budget did not allow.
 *
 * When a provider is paused by its circuit breaker, its stocks are SKIPPED
 * (not failed): a failure would push each stock into a longer and longer
 * retry delay, even though the stock did nothing wrong.
 *
 * Set PRICE_SCHEDULER_ENABLED=false to switch it off (for example on a
 * laptop that shares the production database and API keys).
 */

const Portfolio =
    require('../models/portfolio');

const Alert =
    require('../models/Alert');

const SchedulerStatus =
    require('../models/SchedulerStatus');

const {
    getPrice
} = require('../utils/getPrice');

const quoteStore =
    require('./quoteStore');

const calendarService =
    require('./marketCalendarService');

const providerBudget =
    require('./providerBudget');

const circuitBreaker =
    require('./circuitBreaker');


const ENABLED =
    String(
        process.env.PRICE_SCHEDULER_ENABLED || 'true'
    ).toLowerCase() !== 'false';

const TICK_MS =
    (Number(process.env.PRICE_SCHEDULER_TICK_SECONDS) || 60) * 1000;

const STARTUP_DELAY_MS =
    20 * 1000;

const WORKERS = 4;

const MAX_PER_CYCLE =
    Number(process.env.PRICE_SCHEDULER_MAX_PER_CYCLE) || 80;

const JOB_NAME = 'price_refresh';

const NEVER_FETCHED_AGE = 1e9;

let running = false;
let timer = null;
let startupTimer = null;


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

async function saveStatus(update) {
    try {
        await SchedulerStatus.findOneAndUpdate(
            { job: JOB_NAME },
            { $set: update },
            { upsert: true }
        );
    } catch (error) {
        console.error(
            '[PriceScheduler] could not save status:',
            error.message
        );
    }
}


function cleanTicker(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.]/g, '');
}


function cleanMarket(value) {
    return String(value || 'NGX')
        .trim()
        .toUpperCase() === 'US'
        ? 'US'
        : 'NGX';
}


// Every stock held, watched, or with an active alert.
// Held stocks win, then stocks with alerts.
async function collectTrackedSymbols() {
    const portfolios =
        await Portfolio.find({})
            .select({
                'stocks.ticker': 1,
                'stocks.market': 1,
                'watchlist.ticker': 1,
                'watchlist.market': 1
            })
            .lean();

    const map = new Map();

    const add = (list, held) => {
        for (const item of list || []) {
            if (!item) {
                continue;
            }

            const ticker = cleanTicker(item.ticker);

            if (!ticker) {
                continue;
            }

            const market = cleanMarket(item.market);

            const key = `${market}|${ticker}`;

            const existing = map.get(key);

            if (existing) {
                existing.held = existing.held || held;
            } else {
                map.set(
                    key,
                    { ticker, market, held, alerted: false }
                );
            }
        }
    };

    for (const portfolio of portfolios) {
        add(portfolio.stocks, true);
        add(portfolio.watchlist, false);
    }

    // Stocks somebody has an active alert on must be refreshed even if
    // nobody holds or watches them
    const alerts =
        await Alert.find({ status: 'active' })
            .select({ ticker: 1, market: 1 })
            .lean();

    for (const alert of alerts) {
        const ticker = cleanTicker(alert.ticker);

        if (!ticker) {
            continue;
        }

        const market = cleanMarket(alert.market);

        const key = `${market}|${ticker}`;

        const existing = map.get(key);

        if (existing) {
            existing.alerted = true;
        } else {
            map.set(
                key,
                { ticker, market, held: false, alerted: true }
            );
        }
    }

    return Array.from(map.values());
}


function priorityRank(item) {
    if (item.held) {
        return 0;
    }

    return item.alerted ? 1 : 2;
}


// A stock that keeps failing is retried less and less often
// (2, 4, 8 ... up to 60 minutes)
function inBackoff(quote, now) {
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


// ------------------------------------------------------------
// ONE CYCLE
// ------------------------------------------------------------

async function runPriceRefreshCycle(reason = 'tick') {
    if (running) {
        return null;
    }

    running = true;

    try {
        const items =
            await collectTrackedSymbols();

        if (items.length === 0) {
            return {
                tracked: 0,
                due: 0,
                refreshed: 0,
                failed: 0,
                skipped: 0,
                alreadyCurrent: 0,
                backedOff: 0
            };
        }

        const quotes =
            await quoteStore.getStoredQuotes(items);

        const states = {
            NGX: await calendarService.getMarketState('NGX'),
            US: await calendarService.getMarketState('US')
        };

        const now = Date.now();

        const due = [];
        let alreadyCurrent = 0;
        let backedOff = 0;

        for (const item of items) {
            const quote =
                quotes.get(`${item.ticker}|${item.market}`);

            const assessed =
                calendarService.assessQuote(
                    item.market,
                    quote,
                    states[item.market]
                );

            if (!assessed.shouldRefresh) {
                alreadyCurrent++;
                continue;
            }

            if (inBackoff(quote, now)) {
                backedOff++;
                continue;
            }

            due.push({
                ...item,
                ageMinutes:
                    assessed.ageMinutes === null
                        ? NEVER_FETCHED_AGE
                        : assessed.ageMinutes
            });
        }

        const summary = {
            tracked: items.length,
            due: due.length,
            refreshed: 0,
            failed: 0,
            skipped: 0,
            alreadyCurrent,
            backedOff
        };

        // Nothing to do: stay quiet (this is the normal case)
        if (due.length === 0) {
            return summary;
        }

        // Holdings first, then stocks with alerts, then the watchlist;
        // inside each group the oldest price first
        due.sort((a, b) => {
            const rankA = priorityRank(a);
            const rankB = priorityRank(b);

            if (rankA !== rankB) {
                return rankA - rankB;
            }

            return b.ageMinutes - a.ageMinutes;
        });

        const queue =
            due.slice(0, MAX_PER_CYCLE);

        summary.skipped =
            due.length - queue.length;

        await saveStatus({
            status: 'running',
            startedAt: new Date(),
            completedAt: null,
            error: null
        });

        let finnhubBlocked = false;
        let ngxBlocked = false;

        // Everything inside runs as scheduler work: it may use only the
        // scheduler's share of each provider's quota
        await providerBudget.runRoutine(async () => {
            const worker = async () => {
                while (queue.length > 0) {
                    const item = queue.shift();

                    // NGX prices: when BOTH NGX sources are paused by their
                    // circuit breakers, leave the rest for a later cycle.
                    // Skipped is not failed: a failure would put each stock
                    // into a longer retry delay for no fault of its own.
                    if (item.market === 'NGX') {
                        if (ngxBlocked) {
                            summary.skipped++;
                            continue;
                        }

                        if (
                            circuitBreaker.isBlocking('ngnmarket:companies') &&
                            circuitBreaker.isBlocking('investo:price')
                        ) {
                            ngxBlocked = true;
                            summary.skipped++;
                            continue;
                        }
                    }

                    // US prices come from Finnhub, limited per minute.
                    // When it is used up (or its circuit is open), leave
                    // the rest for the next cycle.
                    if (item.market === 'US') {
                        if (finnhubBlocked) {
                            summary.skipped++;
                            continue;
                        }

                        const gate =
                            await providerBudget.check('finnhub');

                        if (!gate.ok) {
                            finnhubBlocked = true;
                            summary.skipped++;
                            continue;
                        }
                    }

                    try {
                        const price =
                            await getPrice(
                                item.ticker,
                                item.market
                            );

                        if (price === null) {
                            summary.failed++;
                        } else {
                            summary.refreshed++;
                        }

                    } catch (error) {
                        summary.failed++;

                        console.error(
                            `[PriceScheduler] ${item.ticker} (${item.market}):`,
                            error.message
                        );
                    }
                }
            };

            await Promise.all(
                Array.from({ length: WORKERS }, worker)
            );
        });

        console.log(
            `[PriceScheduler] ${reason}: tracked ${summary.tracked}, ` +
            `due ${summary.due}, refreshed ${summary.refreshed}, ` +
            `failed ${summary.failed}, skipped ${summary.skipped}`
        );

        await saveStatus({
            status: 'success',
            completedAt: new Date(),
            lastSuccessfulAt: new Date(),
            stocksFound: summary.tracked,
            alreadyCurrent: summary.alreadyCurrent,
            apiFetches: summary.refreshed,
            skipped: summary.skipped,
            failed: summary.failed,
            error: null
        });

        return summary;

    } catch (error) {
        console.error(
            '[PriceScheduler] cycle failed:',
            error.message
        );

        await saveStatus({
            status: 'failed',
            completedAt: new Date(),
            error: error.message
        });

        return null;

    } finally {
        running = false;
    }
}


// ------------------------------------------------------------
// START / STOP
// ------------------------------------------------------------

function startPriceScheduler() {
    if (!ENABLED) {
        console.log(
            '⏸️ Price scheduler is off (PRICE_SCHEDULER_ENABLED=false)'
        );

        return;
    }

    if (timer) {
        console.log(
            '⚠️ Price scheduler already running.'
        );

        return;
    }

    // Catch-up after a restart / wake-up
    startupTimer =
        setTimeout(
            () => {
                runPriceRefreshCycle('startup')
                    .catch(error => {
                        console.error(
                            '[PriceScheduler] startup cycle failed:',
                            error.message
                        );
                    });
            },
            STARTUP_DELAY_MS
        );

    // Then keep checking what is due
    timer =
        setInterval(
            () => {
                runPriceRefreshCycle('tick')
                    .catch(error => {
                        console.error(
                            '[PriceScheduler] cycle failed:',
                            error.message
                        );
                    });
            },
            TICK_MS
        );

    console.log(
        `✓ Price scheduler started (checks every ${TICK_MS / 1000}s, ` +
        'catches up after downtime)'
    );
}


function stopPriceScheduler() {
    if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
    }

    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}


module.exports = {
    startPriceScheduler,
    stopPriceScheduler,
    runPriceRefreshCycle,
    collectTrackedSymbols
};
