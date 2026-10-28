/*
 * Nightly health summary: one short Telegram message each evening that
 * tells you how Gaze is doing, so you do not have to read logs.
 *
 * Put this file in:  backend/services/healthSummary.js
 *
 * It reports:
 *   - how many tracked stocks got a price in the last 24 hours
 *   - which stocks keep failing (and how many times)
 *   - the last price-refresh run
 *   - providers that are paused (circuit breaker) or over their limit
 *   - how many alerts are active and how many fired in the last 24 hours
 *
 * Settings (backend/.env and Render environment variables):
 *   HEALTH_SUMMARY_USER_ID   your Gaze user id. REQUIRED, or this stays off.
 *                            You must have connected Telegram in the app.
 *   HEALTH_SUMMARY_HOUR      hour to send, Lagos time, 0-23 (default 22)
 *
 * It only runs on a server where the price scheduler is on, so your laptop
 * (PRICE_SCHEDULER_ENABLED=false) never sends a second copy.
 *
 * It sends at most once per Lagos day. The last send is saved in the
 * database, so a restart or a Render wake-up cannot send it twice.
 */

const SchedulerStatus =
    require('../models/SchedulerStatus');

const ProviderState =
    require('../models/ProviderState');

const Alert =
    require('../models/Alert');

const Notification =
    require('../models/Notification');

const circuitBreaker =
    require('./circuitBreaker');

const quoteStore =
    require('./quoteStore');

const telegram =
    require('./telegramService');

const {
    collectTrackedSymbols
} = require('./priceScheduler');


const JOB_NAME = 'health_summary';

const TIME_ZONE = 'Africa/Lagos';

const DAY_MS = 24 * 60 * 60 * 1000;

// Checks once a minute whether it is time to send
const TICK_MS = 60 * 1000;

// It may send from the chosen hour until this many hours later, so a
// server that woke up a little late still sends that evening
const WINDOW_HOURS = 2;

// If sending fails (Telegram not connected, network), wait this long
// before trying again
const RETRY_MS = 15 * 60 * 1000;

// Show at most this many failing stocks
const MAX_FAILING_LISTED = 8;

let timer = null;
let busy = false;
let lastAttemptAt = 0;


// ------------------------------------------------------------
// SETTINGS
// ------------------------------------------------------------

function getUserId() {
    return String(process.env.HEALTH_SUMMARY_USER_ID || '').trim();
}


function getSendHour() {
    const hour = Number(process.env.HEALTH_SUMMARY_HOUR);

    return Number.isInteger(hour) && hour >= 0 && hour <= 23
        ? hour
        : 22;
}


function schedulerEnabled() {
    return String(
        process.env.PRICE_SCHEDULER_ENABLED || 'true'
    ).toLowerCase() !== 'false';
}


// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

// The date (YYYY-MM-DD) and hour in Lagos for any moment
function lagosParts(date) {
    const parts =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone: TIME_ZONE,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                hourCycle: 'h23'
            }
        ).formatToParts(date);

    const get = type =>
        parts.find(part => part.type === type).value;

    return {
        date: `${get('year')}-${get('month')}-${get('day')}`,
        hour: Number(get('hour'))
    };
}


function ago(value) {
    const time = new Date(value).getTime();

    if (!Number.isFinite(time)) {
        return 'never';
    }

    const minutes =
        Math.max(0, Math.round((Date.now() - time) / 60000));

    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    if (minutes < 1440) {
        return `${Math.round(minutes / 60)} h ago`;
    }

    return `${Math.round(minutes / 1440)} d ago`;
}


// Runs one lookup. If it fails, the summary says so for that part and
// still sends the rest.
async function safe(work, fallback) {
    try {
        return await work();
    } catch (error) {
        console.error('[HealthSummary] lookup failed:', error.message);

        return fallback;
    }
}


// ------------------------------------------------------------
// BUILDING THE MESSAGE
// ------------------------------------------------------------

async function buildSummary() {
    const now = Date.now();

    const since = new Date(now - DAY_MS);

    const lines = [];

    const dateLabel =
        new Intl.DateTimeFormat(
            'en-GB',
            { timeZone: TIME_ZONE, day: 'numeric', month: 'short' }
        ).format(new Date());

    lines.push(`Gaze nightly summary, ${dateLabel}`);

    // ---- prices ----------------------------------------------------
    const prices =
        await safe(async () => {
            const items = await collectTrackedSymbols();

            const quotes =
                items.length > 0
                    ? await quoteStore.getStoredQuotes(items)
                    : new Map();

            let fresh = 0;
            let never = 0;
            const failing = [];

            for (const item of items) {
                const quote =
                    quotes.get(`${item.ticker}|${item.market}`);

                if (!quote || !(Number(quote.price) > 0)) {
                    never++;
                } else if (
                    quote.fetchedAt &&
                    now - new Date(quote.fetchedAt).getTime() < DAY_MS
                ) {
                    fresh++;
                }

                if (quote && quote.failCount > 0) {
                    failing.push({
                        label: `${item.ticker} (${item.market})`,
                        failCount: quote.failCount
                    });
                }
            }

            failing.sort((a, b) => b.failCount - a.failCount);

            return { tracked: items.length, fresh, never, failing };
        }, null);

    lines.push('');
    lines.push('PRICES');

    if (!prices) {
        lines.push('Could not read prices.');

    } else {
        lines.push(`Tracked: ${prices.tracked} stocks`);
        lines.push(`Priced in the last 24 h: ${prices.fresh}`);

        if (prices.never > 0) {
            lines.push(`Never priced: ${prices.never}`);
        }

        if (prices.failing.length === 0) {
            lines.push('Failing: none');

        } else {
            lines.push(`Failing: ${prices.failing.length}`);

            for (const item of prices.failing.slice(0, MAX_FAILING_LISTED)) {
                lines.push(`  ${item.label}, failed ${item.failCount}x in a row`);
            }

            if (prices.failing.length > MAX_FAILING_LISTED) {
                lines.push(
                    `  ...and ${prices.failing.length - MAX_FAILING_LISTED} more`
                );
            }
        }
    }

    const job =
        await safe(
            () => SchedulerStatus.findOne({ job: 'price_refresh' }).lean(),
            null
        );

    if (job) {
        lines.push(
            `Last refresh run: ${job.status || 'unknown'}, ` +
            `${ago(job.completedAt || job.startedAt)} ` +
            `(${job.apiFetches ?? 0} fetched, ${job.failed ?? 0} failed, ` +
            `${job.skipped ?? 0} skipped)`
        );
    }

    // ---- providers -------------------------------------------------
    const paused =
        circuitBreaker
            .getSnapshot()
            .filter(item => item.state !== 'closed');

    const cooling =
        await safe(
            () =>
                ProviderState.find({ cooldownUntil: { $gt: new Date() } })
                    .select({ provider: 1, cooldownUntil: 1 })
                    .lean(),
            []
        );

    lines.push('');
    lines.push('PROVIDERS');

    if (paused.length === 0 && cooling.length === 0) {
        lines.push('All providers healthy');
    }

    for (const item of paused) {
        lines.push(
            `${item.key}: ${item.state.replace('_', ' ')}` +
            (item.state === 'open'
                ? `, retry in ${item.retryInSeconds}s`
                : '') +
            (item.lastError ? ` (${item.lastError})` : '')
        );
    }

    for (const item of cooling) {
        lines.push(
            `${item.provider}: limit reached, back ` +
            `${lagosParts(new Date(item.cooldownUntil)).date}`
        );
    }

    // ---- alerts ----------------------------------------------------
    const [active, fired] =
        await Promise.all([
            safe(() => Alert.countDocuments({ status: 'active' }), '?'),

            safe(
                () =>
                    Notification.countDocuments({
                        type: 'price_alert',
                        createdAt: { $gte: since }
                    }),
                '?'
            )
        ]);

    lines.push('');
    lines.push('ALERTS');
    lines.push(`Active: ${active}`);
    lines.push(`Fired in the last 24 h: ${fired}`);

    return lines.join('\n');
}


// ------------------------------------------------------------
// SENDING
// ------------------------------------------------------------

// Returns true if Telegram accepted it
async function sendSummary(userId) {
    const text = await buildSummary();

    return telegram.sendToUser(userId, text);
}


async function maybeSend() {
    if (busy) {
        return;
    }

    const userId = getUserId();

    if (!userId) {
        return;
    }

    const lagos = lagosParts(new Date());
    const start = getSendHour();

    // Outside the sending window
    if (lagos.hour < start || lagos.hour >= start + WINDOW_HOURS) {
        return;
    }

    // Tried recently and failed: wait before trying again
    if (Date.now() - lastAttemptAt < RETRY_MS) {
        return;
    }

    busy = true;

    try {
        // Already sent today (this server or another one)?
        const job =
            await SchedulerStatus.findOne({ job: JOB_NAME }).lean();

        if (
            job &&
            job.lastSuccessfulAt &&
            lagosParts(new Date(job.lastSuccessfulAt)).date === lagos.date
        ) {
            return;
        }

        lastAttemptAt = Date.now();

        const sent = await sendSummary(userId);

        if (sent) {
            await SchedulerStatus.findOneAndUpdate(
                { job: JOB_NAME },
                {
                    $set: {
                        status: 'success',
                        completedAt: new Date(),
                        lastSuccessfulAt: new Date(),
                        error: null
                    }
                },
                { upsert: true }
            );

            console.log('[HealthSummary] sent to Telegram');

        } else {
            console.warn(
                '[HealthSummary] not sent. Is Telegram connected for ' +
                'HEALTH_SUMMARY_USER_ID? Will retry in 15 minutes.'
            );
        }

    } catch (error) {
        console.error('[HealthSummary] failed:', error.message);

    } finally {
        busy = false;
    }
}


// ------------------------------------------------------------
// START / STOP
// ------------------------------------------------------------

function startHealthSummary() {
    if (!getUserId()) {
        console.log(
            '⏸️ Health summary is off (HEALTH_SUMMARY_USER_ID is not set)'
        );

        return;
    }

    if (!schedulerEnabled()) {
        console.log(
            '⏸️ Health summary is off on this server ' +
            '(the price scheduler is off here)'
        );

        return;
    }

    if (timer) {
        return;
    }

    timer = setInterval(
        () => {
            maybeSend().catch(error => {
                console.error(
                    '[HealthSummary] tick failed:',
                    error.message
                );
            });
        },
        TICK_MS
    );

    console.log(
        `✓ Health summary on (Telegram, about ${getSendHour()}:00 Lagos time)`
    );
}


function stopHealthSummary() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}


module.exports = {
    startHealthSummary,
    stopHealthSummary,
    buildSummary,
    sendSummary
};
