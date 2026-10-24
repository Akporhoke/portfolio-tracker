/*
 * Provider quota budgeter.
 *
 * Every outbound request to a market-data provider goes through
 * spend(). It checks the provider's windows (minute / day / month),
 * records the request, and says whether it may proceed.
 *
 * Free-plan limits (override with environment variables):
 *
 *   NGN Market   3,000 per month   NGNMARKET_MONTHLY_LIMIT
 *   Investo      1,000 per day     INVESTO_DAILY_LIMIT
 *   Finnhub      60 per minute     FINNHUB_PER_MINUTE (default 50)
 *   Twelve Data  8 per minute,
 *                800 per day       TWELVEDATA_PER_MINUTE / _DAILY_LIMIT
 *
 * Day and month windows stop at PROVIDER_BUDGET_SAFETY (default 0.9) of
 * the limit, leaving a margin for requests Gaze did not log (dev
 * machines, dashboards, restarts). Minute windows use the limit as given.
 *
 * SCHEDULER SHARE
 * Work started by the background scheduler runs inside runRoutine().
 * It may only use SCHEDULER_BUDGET_SHARE (default 0.7) of each window,
 * so the rest stays free for things a person is waiting on: adding a
 * stock, selling, opening a chart.
 *
 * If the budget database cannot be read, requests are ALLOWED:
 * a tracking failure must never take prices down. The providers
 * enforce their own limits as a backstop.
 */

const { AsyncLocalStorage } = require('async_hooks');

const ProviderRequestLog =
    require('../models/ProviderRequestLog');

const ProviderState =
    require('../models/ProviderState');


function num(value, fallback) {
    const n = Number(value);

    return Number.isFinite(n) && n > 0
        ? n
        : fallback;
}

const SAFETY =
    Math.min(
        Math.max(
            Number(process.env.PROVIDER_BUDGET_SAFETY) || 0.9,
            0.1
        ),
        1
    );

const ROUTINE_SHARE =
    Math.min(
        Math.max(
            Number(process.env.SCHEDULER_BUDGET_SHARE) || 0.7,
            0.1
        ),
        1
    );

const LIMITS = {
    ngnmarket: {
        month: num(process.env.NGNMARKET_MONTHLY_LIMIT, 3000)
    },

    investo: {
        day: num(process.env.INVESTO_DAILY_LIMIT, 1000)
    },

    finnhub: {
        minute: num(process.env.FINNHUB_PER_MINUTE, 50)
    },

    twelvedata: {
        minute: num(process.env.TWELVEDATA_PER_MINUTE, 8),
        day: num(process.env.TWELVEDATA_DAILY_LIMIT, 800)
    }
};

const WINDOW_KINDS = ['minute', 'day', 'month'];


// ------------------------------------------------------------
// WHO IS ASKING (scheduler work vs. a person waiting)
// ------------------------------------------------------------

const purposeStore = new AsyncLocalStorage();

// Run fn (and everything it awaits) as scheduler work
function runRoutine(fn) {
    return purposeStore.run('routine', fn);
}

function isRoutine() {
    return purposeStore.getStore() === 'routine';
}


function windowStart(kind, now = new Date()) {
    if (kind === 'minute') {
        return new Date(now.getTime() - 60 * 1000);
    }

    if (kind === 'day') {
        return new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            )
        );
    }

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1
        )
    );
}


function capFor(kind, limit, routine = false) {
    const base =
        kind === 'minute'
            ? limit
            : Math.floor(limit * SAFETY);

    return routine
        ? Math.floor(base * ROUTINE_SHARE)
        : base;
}


const lastWarn = new Map();

function warnOnce(provider, message) {
    const now = Date.now();

    if (now - (lastWarn.get(provider) || 0) < 60 * 1000) {
        return;
    }

    lastWarn.set(provider, now);

    console.warn(message);
}


// ------------------------------------------------------------
// CHECK (does not record anything)
// ------------------------------------------------------------

async function check(provider) {
    const limits = LIMITS[provider];

    if (!limits) {
        return { ok: true, unknownProvider: true };
    }

    const routine = isRoutine();

    try {
        for (const kind of WINDOW_KINDS) {
            if (!limits[kind]) {
                continue;
            }

            const cap = capFor(kind, limits[kind], routine);

            const used =
                await ProviderRequestLog.countDocuments({
                    provider,
                    at: { $gte: windowStart(kind) }
                });

            if (used >= cap) {
                return {
                    ok: false,
                    kind,
                    used,
                    cap,
                    routine,
                    reason:
                        `${provider} ${kind} budget used (${used}/${cap}` +
                        `${routine ? ', scheduler share' : ''})`
                };
            }
        }

        // NGN Market reports its own remaining quota; trust it too
        if (provider === 'ngnmarket') {
            const state =
                await ProviderState.findOne({ provider })
                    .select({
                        reportedRemaining: 1,
                        reportedAt: 1
                    })
                    .lean();

            if (
                state &&
                Number.isFinite(state.reportedRemaining) &&
                state.reportedAt &&
                new Date(state.reportedAt) >= windowStart('month')
            ) {
                const floor =
                    limits.month -
                    capFor('month', limits.month, routine);

                if (state.reportedRemaining <= floor) {
                    return {
                        ok: false,
                        kind: 'month',
                        routine,
                        reason:
                            `ngnmarket reports only ${state.reportedRemaining} calls remaining` +
                            `${routine ? ' (scheduler share)' : ''}`
                    };
                }
            }
        }

        return { ok: true };

    } catch (error) {
        console.error(
            `[ProviderBudget] check failed for ${provider}:`,
            error.message
        );

        // Fail open
        return { ok: true, error: error.message };
    }
}


// ------------------------------------------------------------
// SPEND (check, then record)
// ------------------------------------------------------------

async function spend(provider, endpoint = '') {
    const result = await check(provider);

    if (!result.ok) {
        warnOnce(
            provider,
            `⛔ ${result.reason}; skipping ${endpoint || 'request'}`
        );

        return result;
    }

    try {
        await ProviderRequestLog.create({
            provider,
            endpoint
        });
    } catch (error) {
        console.error(
            `[ProviderBudget] could not record ${provider} request:`,
            error.message
        );
    }

    return result;
}


// ------------------------------------------------------------
// PROVIDER-REPORTED QUOTA (NGN Market returns calls_used / remaining)
// ------------------------------------------------------------

async function noteReported(provider, used, remaining) {
    const r = Number(remaining);

    if (!Number.isFinite(r)) {
        return;
    }

    const u = Number(used);

    try {
        await ProviderState.findOneAndUpdate(
            { provider },
            {
                $set: {
                    reportedUsed:
                        Number.isFinite(u) ? u : null,
                    reportedRemaining: r,
                    reportedAt: new Date()
                }
            },
            { upsert: true }
        );
    } catch (error) {
        console.error(
            `[ProviderBudget] noteReported failed for ${provider}:`,
            error.message
        );
    }
}


// ------------------------------------------------------------
// USAGE REPORT
// ------------------------------------------------------------

async function getUsage() {
    const report = {};

    for (const [provider, limits] of Object.entries(LIMITS)) {
        report[provider] = {};

        for (const kind of WINDOW_KINDS) {
            if (!limits[kind]) {
                continue;
            }

            const used =
                await ProviderRequestLog.countDocuments({
                    provider,
                    at: { $gte: windowStart(kind) }
                });

            report[provider][kind] = {
                used,
                cap: capFor(kind, limits[kind]),
                schedulerCap: capFor(kind, limits[kind], true),
                limit: limits[kind]
            };
        }
    }

    return report;
}


module.exports = {
    check,
    spend,
    noteReported,
    getUsage,
    runRoutine,
    LIMITS
};