/*
 * Circuit breaker, one per provider endpoint.
 *
 * When a provider starts failing (timeouts, server errors, bad key), asking
 * it again and again only wastes time and quota. The breaker stops the
 * requests for a while, then tries ONE request to see if it recovered:
 *
 *   closed     requests go through normally
 *   open       requests are blocked until the cooldown ends
 *   half_open  cooldown over: ONE test request is allowed
 *                 test works  -> closed
 *                 test fails  -> open again, with a longer cooldown
 *
 * What counts as a provider failure (opens the breaker):
 *   - no answer at all (timeout, network error)
 *   - server errors (5xx)
 *   - 429 (too many requests), 401 / 403 (key rejected)
 *
 * What does NOT count: an answer that is about one stock (404, unknown
 * symbol, no data). The provider is up; that stock is the problem.
 * An answer like that even counts as proof the provider is healthy.
 *
 * Endpoints are tracked separately, so a failing history endpoint does not
 * stop current prices from the same provider.
 *
 * State is kept in memory (one server). A restart starts closed, and the
 * first requests find out again within seconds.
 *
 * Settings (environment variables):
 *   BREAKER_FAILURE_THRESHOLD       failures in a row before opening (5)
 *   BREAKER_BASE_COOLDOWN_SECONDS   first cooldown (30)
 *   BREAKER_MAX_COOLDOWN_SECONDS    longest cooldown (600)
 * Cooldowns double each time the test request fails: 30s, 60s, 2m, 4m ...
 */

function num(value, fallback) {
    const n = Number(value);

    return Number.isFinite(n) && n > 0
        ? n
        : fallback;
}

const FAILURE_THRESHOLD =
    Math.floor(num(process.env.BREAKER_FAILURE_THRESHOLD, 5));

const BASE_COOLDOWN_MS =
    num(process.env.BREAKER_BASE_COOLDOWN_SECONDS, 30) * 1000;

const MAX_COOLDOWN_MS =
    num(process.env.BREAKER_MAX_COOLDOWN_SECONDS, 600) * 1000;

// If a test request never reports back, allow another after this long
const PROBE_TIMEOUT_MS =
    60 * 1000;

// Every endpoint Gaze calls, by provider
const PROVIDER_KEYS = {
    ngnmarket: ['ngnmarket:companies'],
    investo: ['investo:price', 'investo:history'],
    finnhub: ['finnhub:quote'],
    twelvedata: ['twelvedata:time_series']
};

const breakers = new Map();


function stateOf(key) {
    if (!breakers.has(key)) {
        breakers.set(
            key,
            {
                state: 'closed',
                failures: 0,
                openCount: 0,
                retryAt: 0,
                probeStartedAt: 0,
                lastError: ''
            }
        );
    }

    return breakers.get(key);
}


// 'history-status' is the same Investo endpoint as 'history'
function keyFor(provider, endpoint) {
    const name =
        endpoint === 'history-status'
            ? 'history'
            : endpoint;

    return `${provider}:${name}`;
}


function describe(error) {
    if (!error) {
        return 'unknown error';
    }

    if (error.response && error.response.status) {
        return `HTTP ${error.response.status}`;
    }

    return String(error.code || error.message || 'no answer').slice(0, 80);
}


// Is this error the provider's fault (as opposed to one stock's)?
function isProviderFailure(error) {
    if (!error || error.circuitOpen) {
        return false;
    }

    // No answer at all: timeout, network, DNS
    if (!error.response) {
        return true;
    }

    const status = error.response.status;

    return (
        status >= 500 ||
        status === 429 ||
        status === 401 ||
        status === 403
    );
}


// ------------------------------------------------------------
// BEFORE A REQUEST
// ------------------------------------------------------------

// Asks permission AND, once the cooldown is over, claims the single test
// request. Use this right before sending.
function beforeRequest(key) {
    const b = stateOf(key);
    const now = Date.now();

    if (b.state === 'closed') {
        return { allowed: true };
    }

    if (b.state === 'open') {
        if (now < b.retryAt) {
            return { allowed: false, retryAt: b.retryAt };
        }

        b.state = 'half_open';
        b.probeStartedAt = now;

        return { allowed: true, probe: true };
    }

    // half_open: only one test request at a time
    if (now - b.probeStartedAt > PROBE_TIMEOUT_MS) {
        b.probeStartedAt = now;

        return { allowed: true, probe: true };
    }

    return { allowed: false, retryAt: b.retryAt };
}


// Looks without claiming anything: "should I even bother trying?"
function isBlocking(key) {
    const b = breakers.get(key);

    if (!b || b.state === 'closed') {
        return false;
    }

    if (b.state === 'open') {
        return Date.now() < b.retryAt;
    }

    return Date.now() - b.probeStartedAt <= PROBE_TIMEOUT_MS;
}


// The key that is blocking this provider (or endpoint), or null.
// With no endpoint, the provider counts as blocked only when EVERY
// endpoint of it is blocked.
function blockingKey(provider, endpoint) {
    if (endpoint) {
        const key = keyFor(provider, endpoint);

        return isBlocking(key)
            ? key
            : null;
    }

    const keys = PROVIDER_KEYS[provider] || [];

    if (keys.length > 0 && keys.every(isBlocking)) {
        return keys[0];
    }

    return null;
}


// ------------------------------------------------------------
// AFTER A REQUEST
// ------------------------------------------------------------

function recordSuccess(key) {
    const b = stateOf(key);

    if (b.state !== 'closed') {
        console.log(
            `✓ Circuit closed for ${key} (provider answered again)`
        );
    }

    b.state = 'closed';
    b.failures = 0;
    b.openCount = 0;
    b.retryAt = 0;
    b.lastError = '';
}


function open(b, key, now) {
    b.openCount++;

    const cooldown =
        Math.min(
            BASE_COOLDOWN_MS * Math.pow(2, b.openCount - 1),
            MAX_COOLDOWN_MS
        );

    b.state = 'open';
    b.retryAt = now + cooldown;

    console.warn(
        `⛔ Circuit OPEN for ${key} (${b.lastError}). ` +
        `Paused for ${Math.round(cooldown / 1000)}s, then one test request.`
    );
}


function recordFailure(key, error) {
    const b = stateOf(key);
    const now = Date.now();

    b.lastError = describe(error);

    // A late failure from a request sent before the circuit opened
    if (b.state === 'open') {
        return;
    }

    // The test request failed: back to open, with a longer cooldown
    if (b.state === 'half_open') {
        open(b, key, now);
        return;
    }

    b.failures++;

    if (b.failures >= FAILURE_THRESHOLD) {
        open(b, key, now);
    }
}


// ------------------------------------------------------------
// VISIBILITY
// ------------------------------------------------------------

function getSnapshot() {
    const keys =
        new Set(
            Object.values(PROVIDER_KEYS).flat()
        );

    for (const key of breakers.keys()) {
        keys.add(key);
    }

    const now = Date.now();

    return Array.from(keys).sort().map(key => {
        const b = stateOf(key);

        return {
            key,
            state: b.state,
            failures: b.failures,
            openCount: b.openCount,
            retryInSeconds:
                b.state === 'open'
                    ? Math.max(0, Math.round((b.retryAt - now) / 1000))
                    : 0,
            lastError: b.lastError
        };
    });
}


function reset() {
    breakers.clear();
}


module.exports = {
    keyFor,
    beforeRequest,
    isBlocking,
    blockingKey,
    recordSuccess,
    recordFailure,
    isProviderFailure,
    getSnapshot,
    reset
};