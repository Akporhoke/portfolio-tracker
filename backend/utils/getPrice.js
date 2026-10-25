const axios = require('axios');
const PriceSnapshot = require('../models/PriceSnapshot');
const PriceHistory = require('../models/PriceHistory');
const ProviderState = require('../models/ProviderState');
const providerBudget = require('../services/providerBudget');
const quoteStore = require('../services/quoteStore');
const priceEvents = require('../services/priceEvents');
const breaker = require('../services/circuitBreaker');

// ============================================================
// API CONFIG
// ============================================================

const NGNMARKET_BASE_URL = 'https://api.ngnmarket.com/v1';
const INVESTO_BASE_URL = 'https://investo.ng/api/v1';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

// ============================================================
// CACHE
// ============================================================

const PRICE_CACHE_TTL = 2 * 60 * 1000;
const HISTORY_CACHE_TTL = 60 * 60 * 1000;
// NGN Market free plan = 3,000 calls/month; one call returns every company
const COMPANY_LIST_CACHE_TTL =
    (Number(process.env.NGN_COMPANY_CACHE_MINUTES) || 5) * 60 * 1000;

const priceCache = new Map();
const historyCache = new Map();

// Symbols whose last price lookup failed: do not retry until this time
const priceFailCache = new Map();

const PRICE_FAIL_TTL =
    (Number(process.env.PRICE_FAIL_CACHE_SECONDS) || 60) * 1000;

// Source details for the price held in priceCache
const priceMetaCache = new Map();

// Details a provider supplies about a quote, e.g. "US:AAPL" -> { sourceTimestamp }
const quoteMeta = new Map();

// After a failed or empty NGN Market list, do not retry until this time
let companyListFailUntil = 0;

// Prevent duplicate Twelve Data requests
const twelveDataInFlight = new Map();
const investoInFlight = new Map();
const investoHistoryInFlight = new Map();

// ============================================================
// CIRCUIT BREAKER WRAPPER
// ============================================================
//
// Every provider request goes through this. It asks the breaker for
// permission, sends the request, then reports the result so the breaker
// knows when a provider is down and when it has recovered.
//
// requestFn must contain ONLY the axios call.

async function guardedRequest(provider, endpoint, requestFn) {
    const key = breaker.keyFor(provider, endpoint);

    // Also claims the single test request once the cooldown is over
    const permit = breaker.beforeRequest(key);

    if (!permit.allowed) {
        const error = new Error(`circuit open for ${key}`);
        error.circuitOpen = true;
        throw error;
    }

    try {
        const response = await requestFn();
        breaker.recordSuccess(key);
        return response;

    } catch (error) {
        if (breaker.isProviderFailure(error)) {
            // timeout, network, 5xx, 429, 401, 403: the provider's fault
            breaker.recordFailure(key, error);
        } else {
            // 404 / unknown symbol: the provider answered, so it is up
            breaker.recordSuccess(key);
        }

        throw error;
    }
}

// ============================================================
// TWELVE DATA REQUEST QUEUE
// ============================================================

const twelveDataQueue = [];
let twelveDataProcessing = false;

const TWELVE_DATA_MIN_INTERVAL = 8000;
let lastTwelveDataRequestTime = 0;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function enqueueTwelveDataRequest(requestFn) {
    return new Promise((resolve, reject) => {
        twelveDataQueue.push({
            requestFn,
            resolve,
            reject
        });

        processTwelveDataQueue();
    });
}

async function processTwelveDataQueue() {
    if (twelveDataProcessing) {
        return;
    }

    twelveDataProcessing = true;

    while (twelveDataQueue.length > 0) {
        const job = twelveDataQueue.shift();

        try {
            // Circuit open: fail this job at once, before the 8 second
            // wait, so a blocked queue clears quickly
            if (breaker.blockingKey('twelvedata', 'time_series')) {
                throw new Error('twelvedata circuit open');
            }

            const now = Date.now();

            const elapsed =
                now - lastTwelveDataRequestTime;

            if (
                elapsed <
                TWELVE_DATA_MIN_INTERVAL
            ) {
                await wait(
                    TWELVE_DATA_MIN_INTERVAL -
                    elapsed
                );
            }

            const budget =
                await providerBudget.spend(
                    'twelvedata',
                    'time_series'
                );

            if (!budget.ok) {
                throw new Error(budget.reason);
            }

            lastTwelveDataRequestTime =
                Date.now();

            const result =
                await job.requestFn();

            job.resolve(result);
        } catch (error) {
            job.reject(error);
        }
    }

    twelveDataProcessing = false;
}

// ============================================================
// COMPANY LIST CACHE
// ============================================================

let companyListCache = null;
let companyListCacheTime = 0;
let companyListRequest = null;

// ============================================================
// PROVIDER PERSISTENT COOLDOWN
// ============================================================

async function getProviderState(provider) {
    try {
        return await ProviderState.findOne({
            provider
        }).lean();
    } catch (error) {
        console.error(
            `[getProviderState] ${provider}:`,
            error.message
        );

        return null;
    }
}

async function isProviderCoolingDown(provider) {
    const state =
        await getProviderState(provider);

    if (
        !state ||
        !state.cooldownUntil
    ) {
        return false;
    }

    const cooldownUntil =
        new Date(
            state.cooldownUntil
        ).getTime();

    if (
        Date.now() >= cooldownUntil
    ) {
        return false;
    }

    return true;
}

async function activateProviderCooldown(
    provider,
    cooldownUntil,
    reason
) {
    try {
        await ProviderState.findOneAndUpdate(
            { provider },
            {
                provider,
                status: 'quota_exceeded',
                cooldownUntil:
                    new Date(cooldownUntil),
                lastError:
                    reason || 'quota_exceeded',
                updatedAt: new Date()
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        console.warn(
            `⏸️ ${provider} cooldown active until ${new Date(
                cooldownUntil
            ).toISOString()}`
        );
    } catch (error) {
        console.error(
            `[activateProviderCooldown] ${provider}:`,
            error.message
        );
    }
}

async function clearProviderCooldown(
    provider
) {
    try {
        await ProviderState.findOneAndUpdate(
            { provider },
            {
                status: 'available',
                cooldownUntil: null,
                lastError: '',
                updatedAt: new Date()
            },
            {
                upsert: true
            }
        );
    } catch (error) {
        console.error(
            `[clearProviderCooldown] ${provider}:`,
            error.message
        );
    }
}

// ============================================================
// NGN MARKET QUOTA / COOLDOWN
// ============================================================

function getNextMonthStartUTC() {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() + 1,
            1,
            0,
            0,
            0,
            0
        )
    ).getTime();
}

function isNGNMarketQuotaExceeded(data) {
    const code =
        data?.error?.code ||
        data?.code ||
        data?.errorCode;

    const message =
        String(
            data?.error?.message ||
            data?.error?.detail ||
            data?.message ||
            data?.error ||
            ''
        ).toLowerCase();

    return (
        code === 'QUOTA_EXCEEDED' ||
        code === 'quota_exceeded' ||
        message.includes(
            'monthly call limit'
        ) ||
        message.includes(
            'quota exceeded'
        )
    );
}

async function isNGNMarketCoolingDown() {
    return await isProviderCoolingDown(
        'ngnmarket'
    );
}

async function activateNGNMarketQuotaCooldown() {
    const cooldownUntil =
        getNextMonthStartUTC();

    await activateProviderCooldown(
        'ngnmarket',
        cooldownUntil,
        'monthly_quota_exceeded'
    );
}

// ============================================================
// INVESTO DAILY QUOTA / COOLDOWN
// ============================================================

function getNextInvestoResetUTC() {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0,
            0,
            0,
            0
        )
    ).getTime();
}

async function isInvestoCoolingDown() {
    return await isProviderCoolingDown(
        'investo'
    );
}

async function activateInvestoCooldown() {
    const cooldownUntil =
        getNextInvestoResetUTC();

    await activateProviderCooldown(
        'investo',
        cooldownUntil,
        'daily_quota_exceeded'
    );
}
// ============================================================
// API KEYS
// ============================================================

function getInvestoToken() {
    return (
        process.env.INVESTO_API_KEY ||
        process.env.INVESTO_API_TOKEN ||
        ''
    ).trim();
}

function getNGNMarketToken() {
    return (
        process.env.NGNMARKET_API_KEY ||
        process.env.NGN_MARKET_API_KEY ||
        process.env.NGNMARKET_TOKEN ||
        ''
    ).trim();
}

function getFinnhubToken() {
    return (
        process.env.FINNHUB_API_KEY ||
        process.env.FINNHUB_TOKEN ||
        ''
    ).trim();
}


function getTwelveDataToken() {
    return (
        process.env.TWELVE_DATA_API_KEY ||
        process.env.TWELVEDATA_API_KEY ||
        ''
    ).trim();
}

// ============================================================
// HELPERS
// ============================================================

function normalizeTicker(ticker) {
    return String(ticker || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.]/g, '');
}

function normalizeMarket(market) {
    return String(market || 'NGX')
        .trim()
        .toUpperCase() === 'US'
        ? 'US'
        : 'NGX';
}

function todayStr() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

function dateOnly(value) {
    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
        return null;
    }

    return d.toISOString()
        .slice(0, 10);
}

function subtractDays(
    dateString,
    days
) {
    const d = new Date(
        `${dateString}T00:00:00.000Z`
    );

    d.setUTCDate(
        d.getUTCDate() - days
    );

    return d.toISOString()
        .slice(0, 10);
}

function addDays(
    dateString,
    days
) {
    const d = new Date(
        `${dateString}T00:00:00.000Z`
    );

    d.setUTCDate(
        d.getUTCDate() + days
    );

    return d.toISOString()
        .slice(0, 10);
}

function isValidPrice(price) {
    return (
        Number.isFinite(Number(price)) &&
        Number(price) > 0
    );
}

function parseNumber(value) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

function cacheGet(cache, key) {
    const item = cache.get(key);

    if (!item) {
        return null;
    }

    if (
        Date.now() - item.timestamp >
        item.ttl
    ) {
        cache.delete(key);
        return null;
    }

    return item.value;
}

function cacheSet(
    cache,
    key,
    value,
    ttl
) {
    cache.set(key, {
        value,
        timestamp: Date.now(),
        ttl
    });
}

// ============================================================
// PERSISTENT PRICE HISTORY
// ============================================================

async function savePriceHistory(
    ticker,
    market,
    rows,
    source
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    if (!Array.isArray(rows) || !rows.length) {
        return;
    }

    const operations =
        rows
            .filter(row =>
                row &&
                row.date &&
                isValidPrice(row.close)
            )
            .map(row => ({
                updateOne: {
                    filter: {
                        ticker: symbol,
                        market: normalizedMarket,
                        date: row.date
                    },

                    update: {
                        $set: {
                            ticker: symbol,
                            market: normalizedMarket,
                            date: row.date,
                            open:
                                parseNumber(row.open),
                            high:
                                parseNumber(row.high),
                            low:
                                parseNumber(row.low),
                            close:
                                Number(row.close),
                            volume:
                                parseNumber(row.volume),
                            source:
                                source || 'unknown'
                        }
                    },

                    upsert: true
                }
            }));

    if (!operations.length) {
        return;
    }

    try {
        await PriceHistory.bulkWrite(
            operations,
            {
                ordered: false
            }
        );

        console.log(
            `💾 Saved ${operations.length} historical rows for ${symbol} (${normalizedMarket})`
        );

    } catch (error) {
        console.error(
            `[savePriceHistory] ${symbol}:`,
            error.message
        );
    }
}

async function getStoredPriceHistory(
    ticker,
    market,
    days,
    endDate
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 30,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    const historyDays =
        Math.max(
            safeDays,
            60
        );

    const calendarWindow =
        Math.max(
            30,
            historyDays * 3
        );

    const start =
        subtractDays(
            end,
            calendarWindow
        );

    try {
        const rows =
            await PriceHistory.find({
                ticker: symbol,
                market: normalizedMarket,
                date: {
                    $gte: start,
                    $lte: end
                }
            })
                .sort({
                    date: 1
                })
                .lean();

        const normalized =
            normalizeHistoricalRows(
                rows
            );

        if (
            normalized.length >=
            safeDays
        ) {
            console.log(
                `✓ MongoDB history for ${symbol} (${normalizedMarket}): ${normalized.length} real trading days`
            );

            return normalized.slice(
                -safeDays
            );
        }

        if (normalized.length) {
            console.log(
                `ℹ️ MongoDB history for ${symbol} (${normalizedMarket}) only has ${normalized.length}/${safeDays} days`
            );
        }

        return [];
    } catch (error) {
        console.error(
            `[getStoredPriceHistory] ${symbol}:`,
            error.message
        );

        return [];
    }
}


// ============================================================
// STORED HISTORY ONLY (never calls a provider)
// ============================================================

async function getStoredHistoryRows(
    ticker,
    market,
    days = 60,
    endDate = null
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 60,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    const start =
        subtractDays(
            end,
            Math.max(30, safeDays * 3)
        );

    try {
        const rows =
            await PriceHistory.find({
                ticker: symbol,
                market: normalizedMarket,
                date: {
                    $gte: start,
                    $lte: end
                }
            })
                .sort({ date: 1 })
                .lean();

        const normalized =
            normalizeHistoricalRows(rows)
                .slice(-safeDays);

        if (normalized.length > 0) {
            return normalized;
        }

        // Same fallback the old path had: real snapshots
        // Gaze observed itself (NGX only)
        if (normalizedMarket === 'NGX') {
            return await getSnapshotHistory(
                symbol,
                safeDays,
                end
            );
        }

        return [];

    } catch (error) {
        console.error(
            `[getStoredHistoryRows] ${symbol}:`,
            error.message
        );

        return [];
    }
}

async function ensureStoredHistory(
    ticker,
    market,
    minRows = 10,
    days = 60
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const stored =
        await PriceHistory.countDocuments({
            ticker: symbol,
            market: normalizedMarket
        });

    if (stored >= minRows) {
        return { fetched: false, count: stored };
    }

    const result =
        await getHistoricalProviderStatus(
            symbol,
            days,
            normalizedMarket,
            null
        );

    if (
        result.status === 'available' &&
        Array.isArray(result.rows) &&
        result.rows.length > 0
    ) {
        await savePriceHistory(
            symbol,
            normalizedMarket,
            result.rows,
            normalizedMarket === 'US'
                ? 'twelvedata'
                : 'investo'
        );
    }

    return {
        fetched: result.requestMade !== false,
        status: result.status
    };
}

// ============================================================
// PRICE SNAPSHOT
// ============================================================

async function recordSnapshot(
    ticker,
    price,
    source
) {
    if (!isValidPrice(price)) {
        return;
    }

    try {
        const symbol =
            normalizeTicker(ticker);

        const date =
            todayStr();

        await PriceSnapshot.findOneAndUpdate(
            {
                ticker: symbol,
                date
            },
            {
                ticker: symbol,
                date,
                price: Number(price),
                source:
                    source || 'unknown'
            },
            {
                upsert: true,
                returnDocument: 'after',
                setDefaultsOnInsert: true
            }
        );
    } catch (error) {
        console.error(
            `[recordSnapshot] ${ticker}:`,
            error.message
        );
    }
}

// ============================================================
// NGN MARKET — COMPANY LIST
// ============================================================
async function getNGNMarketCompanies() {
    if (await isNGNMarketCoolingDown()) {
        console.log(
            '⏸️ NGN Market quota cooldown active. Skipping NGN Market.'
        );

        return [];
    }

    const token =
        getNGNMarketToken();

    if (!token) {
        console.warn(
            '⚠️ NGNMARKET_API_KEY is missing. Skipping NGN Market.'
        );

        return [];
    }

    if (
        companyListCache &&
        Date.now() -
            companyListCacheTime <
            COMPANY_LIST_CACHE_TTL
    ) {
        return companyListCache;
    }

    if (companyListRequest) {
        return companyListRequest;
    }

    // Last attempt failed or came back empty: do not retry yet
    if (Date.now() < companyListFailUntil) {
        return companyListCache || [];
    }

    // Circuit open: NGN Market is failing, so do not spend quota on it.
    // Serve the last list we have.
    if (breaker.blockingKey('ngnmarket', 'companies')) {
        return companyListCache || [];
    }

    companyListRequest =
        (async () => {
            try {
                const budget =
                    await providerBudget.spend(
                        'ngnmarket',
                        'companies'
                    );

                if (!budget.ok) {
                    // Serve the last list we have rather than letting
                    // every NGX symbol fall through to Investo
                    return companyListCache || [];
                }
                console.log(
                    '→ Requesting NGX company prices from NGN Market'
                );

                const response =
                    await guardedRequest('ngnmarket', 'companies', () =>
                        axios.get(
                            `${NGNMARKET_BASE_URL}/companies`,
                            {
                                params: {
                                    limit: 200,
                                    page: 1
                                },
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                },
                                timeout: 15000
                            }
                        )
                    );

                const body =
                    response.data;

                if (isNGNMarketQuotaExceeded(body)) {
                    await activateNGNMarketQuotaCooldown();

                    return [];
                }

                if (
                    body?.success === false
                ) {
                    console.error(
                        '[getNGNMarketCompanies] API error:',
                        body.error || body
                    );

                    return [];
                }

                let companies = [];

                if (
                    Array.isArray(
                        body?.data?.data
                    )
                ) {
                    companies =
                        body.data.data;
                } else if (
                    Array.isArray(
                        body?.data
                    )
                ) {
                    companies =
                        body.data;
                } else if (
                    Array.isArray(
                        body?.companies
                    )
                ) {
                    companies =
                        body.companies;
                } else if (
                    Array.isArray(body)
                ) {
                    companies = body;
                }

                companyListCache =
                    companies;

                companyListCacheTime =
                    Date.now();

                console.log(
                    `✓ NGN Market returned ${companies.length} NGX companies`
                );

                await clearProviderCooldown(
                    'ngnmarket'
                );

                if (body?.meta) {
                    console.log(
                        `ℹ️ NGN Market quota: ${
                            body.meta.calls_used ??
                            'unknown'
                        } used / ${
                            body.meta.calls_remaining ??
                            'unknown'
                        } remaining`
                    );
                    await providerBudget.noteReported(
                        'ngnmarket',
                        body.meta.calls_used,
                        body.meta.calls_remaining
                    );
                }

                return companies;
            } catch (error) {
                const responseData =
                    error.response?.data;

                if (
                    isNGNMarketQuotaExceeded(
                        responseData
                    )
                ) {
                    await activateNGNMarketQuotaCooldown();
                    return [];
                }

                console.error(
                    '[getNGNMarketCompanies] Error:',
                    responseData ||
                    error.message
                );

                return [];
            } finally {
                companyListRequest = null;
            }
        })();

    companyListRequest
        .then(list => {
            companyListFailUntil =
                Array.isArray(list) && list.length > 0
                    ? 0
                    : Date.now() + PRICE_FAIL_TTL;
        })
        .catch(() => {});

    return companyListRequest;

}

// ============================================================
// NGN MARKET — CURRENT PRICE
// ============================================================

async function getNGNMarketPrice(
    ticker
) {
    const symbol =
        normalizeTicker(ticker);

    try {
        const companies =
            await getNGNMarketCompanies();

        if (!companies.length) {
            return null;
        }

        const company =
            companies.find(item => {
                const possibleTicker =
                    normalizeTicker(
                        item?.symbol ||
                        item?.ticker ||
                        item?.code ||
                        item?.securityCode ||
                        item?.stockSymbol
                    );

                return (
                    possibleTicker ===
                    symbol
                );
            });

        if (!company) {
            console.log(
                `[getNGNMarketPrice] No NGN Market match for ${symbol}`
            );

            return null;
        }

        const price =
            parseNumber(
                company.price ??
                company.currentPrice ??
                company.lastPrice ??
                company.close ??
                company.ltp ??
                company.last ??
                company.todays_close
            );

        if (!isValidPrice(price)) {
            console.warn(
                `⚠️ NGN Market returned no usable price for ${symbol}`
            );

            return null;
        }

        quoteMeta.set(
            `NGX:${symbol}`,
            { fetchedAt: new Date(companyListCacheTime) }
        );

        console.log(
            `✓ NGN Market price for ${symbol}: ${price}`
        );

        await recordSnapshot(
            symbol,
            price,
            'ngnmarket'
        );

        return price;
    } catch (error) {
        console.error(
            `[getNGNMarketPrice] ${symbol}:`,
            error.response?.data ||
            error.message
        );

        return null;
    }
}

// ============================================================
// INVESTO — CURRENT PRICE
// ============================================================
async function getInvestoCurrentPrice(
    ticker
) {
    const symbol =
        normalizeTicker(ticker);

    if (await isInvestoCoolingDown()) {
        console.log(
            `⏸️ Investo cooldown active. Skipping ${symbol}`
        );

        return null;
    }

    const token =
        getInvestoToken();

    if (!token) {
        console.error(
            '❌ INVESTO_API_KEY is missing from .env'
        );

        return null;
    }

    // --------------------------------------------------------
    // SHARE IDENTICAL IN-FLIGHT REQUESTS
    // --------------------------------------------------------

    if (investoInFlight.has(symbol)) {
        console.log(
            `↳ Sharing in-flight Investo request for ${symbol}`
        );

        return await investoInFlight.get(symbol);
    }

    const requestPromise =
        (async () => {
            try {
                // Circuit open: do not spend budget on a request
                // that will not be sent
                if (breaker.blockingKey('investo', 'price')) {
                    return null;
                }

                const budget =
                    await providerBudget.spend(
                        'investo',
                        'price'
                    );

                if (!budget.ok) {
                    return null;
                }
                console.log(
                    `→ Requesting Investo current price for ${symbol}`
                );

                const response =
                    await guardedRequest('investo', 'price', () =>
                        axios.get(
                            `${INVESTO_BASE_URL}/prices/${encodeURIComponent(symbol)}`,
                            {
                                params: {
                                    interval: 'latest',
                                    provenance: 1
                                },
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                },
                                timeout: 15000
                            }
                        )
                    );

                const body =
                    response.data;

                if (body?.ok === false) {
                    const code =
                        body?.error?.code;

                    if (
                        code === 'rate_limited'
                    ) {
                        await activateInvestoCooldown();
                        return null;
                    }

                    if (
                        code === 'unknown_symbol'
                    ) {
                        console.warn(
                            `⚠️ Investo has no current-price data for ${symbol}`
                        );

                        return null;
                    }

                    if (
                        code ===
                            'missing_api_key' ||
                        code ===
                            'invalid_api_key' ||
                        code ===
                            'revoked_api_key'
                    ) {
                        console.error(
                            `❌ Investo authentication error for ${symbol}:`,
                            body.error?.message
                        );

                        return null;
                    }

                    console.error(
                        `[getInvestoCurrentPrice] ${symbol}:`,
                        body.error || body
                    );

                    return null;
                }

                const data =
                    body?.data;

                let price = null;

                if (
                    data &&
                    !Array.isArray(data)
                ) {
                    price =
                        parseNumber(
                            data.close ??
                            data.price ??
                            data.currentPrice ??
                            data.lastPrice
                        );
                }

                if (
                    !isValidPrice(price) &&
                    Array.isArray(data) &&
                    data.length
                ) {
                    const latest =
                        data[data.length - 1];

                    price =
                        parseNumber(
                            latest?.close ??
                            latest?.price ??
                            latest?.currentPrice ??
                            latest?.lastPrice
                        );
                }

                if (!isValidPrice(price)) {
                    console.warn(
                        `⚠️ Investo has no current-price data for ${symbol}`
                    );

                    return null;
                }

                console.log(
                    `✓ Investo current price for ${symbol}: ${price}`
                );

                await clearProviderCooldown(
                    'investo'
                );

                await recordSnapshot(
                    symbol,
                    price,
                    'investo'
                );

                return price;

            } catch (error) {
                const responseData =
                    error.response?.data;

                const errorCode =
                    responseData?.error?.code;

                if (
                    error.response?.status === 429 ||
                    errorCode === 'rate_limited'
                ) {
                    await activateInvestoCooldown();
                }

                if (
                    error.response?.status === 404 ||
                    errorCode === 'unknown_symbol'
                ) {
                    console.warn(
                        `⚠️ Investo has no current-price data for ${symbol}`
                    );

                    return null;
                }

                if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                ) {
                    console.error(
                        `❌ Investo authentication/permission error for ${symbol}:`,
                        responseData ||
                        error.message
                    );

                    return null;
                }

                console.error(
                    `[getInvestoCurrentPrice] ${symbol}:`,
                    responseData ||
                    error.message
                );

                return null;
            }
        })();

    investoInFlight.set(
        symbol,
        requestPromise
    );

    try {
        return await requestPromise;
    } finally {
        investoInFlight.delete(symbol);
    }
}

// ============================================================
// FINNHUB — CURRENT PRICE
// ============================================================

const finnhubInFlight = new Map();

async function getFinnhubPrice(ticker) {
    const symbol = normalizeTicker(ticker);

    if (finnhubInFlight.has(symbol)) {
        return finnhubInFlight.get(symbol);
    }

    const request =
        fetchFinnhubPrice(symbol).finally(() => {
            finnhubInFlight.delete(symbol);
        });

    finnhubInFlight.set(symbol, request);

    return request;
}

async function fetchFinnhubPrice(
    ticker
) {
    const token =
        getFinnhubToken();

    if (!token) {
        console.error(
            '❌ FINNHUB_API_KEY is missing from .env'
        );

        return null;
    }

    const symbol =
        normalizeTicker(ticker);

    // Circuit open: do not spend budget on a request that will not be sent
    if (breaker.blockingKey('finnhub', 'quote')) {
        return null;
    }

    const budget =
        await providerBudget.spend(
            'finnhub',
            'quote'
        );

    if (!budget.ok) {
        return null;
    }

    try {
        const response =
            await guardedRequest('finnhub', 'quote', () =>
                axios.get(
                    `${FINNHUB_BASE_URL}/quote`,
                    {
                        params: {
                            symbol,
                            token
                        },
                        timeout: 15000
                    }
                )
            );

        // Finnhub's "t" is the Unix time (seconds) of the last trade.
        // This needs `response`, so it lives here, after the request.
        const tradeTime =
            Number(response.data?.t);

        if (
            Number.isFinite(tradeTime) &&
            tradeTime > 0
        ) {
            quoteMeta.set(
                `US:${symbol}`,
                { sourceTimestamp: new Date(tradeTime * 1000) }
            );
        } else {
            quoteMeta.delete(`US:${symbol}`);
        }

        const price =
            parseNumber(
                response.data?.c
            );

        if (!isValidPrice(price)) {
            console.warn(
                `⚠️ Finnhub returned no usable price for ${symbol}`
            );

            return null;
        }

        console.log(
            `✓ Finnhub price for ${symbol}: ${price}`
        );

        await recordSnapshot(
            symbol,
            price,
            'finnhub'
        );

        return price;
    } catch (error) {
        console.error(
            `[getFinnhubPrice] ${symbol}:`,
            error.response?.data ||
            error.message
        );

        return null;
    }
}

// ============================================================
// NGX HISTORY — INVESTO
// ============================================================

async function getInvestoHistory(
    ticker,
    days = 30,
    endDate = null
) {
    const symbol =
        normalizeTicker(ticker);

    const token =
        getInvestoToken();

    if (!token) {
        console.error(
            '❌ INVESTO_API_KEY is missing from .env'
        );

        return [];
    }

    if (await isInvestoCoolingDown()) {
        console.log(
            `⏸️ Investo cooldown active. Skipping history for ${symbol}`
        );

        return [];
    }

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 30,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    /*
     * Request more calendar days than trading days
     * because weekends and holidays do not count.
     */
    const calendarWindow =
        Math.max(
            30,
            safeDays * 3
        );

    const from =
        subtractDays(
            end,
            calendarWindow
        );

    const cacheKey =
        `investo-history:${symbol}:${safeDays}:${from}:${end}`;

    const cached =
        cacheGet(
            historyCache,
            cacheKey
        );

    if (cached) {
        return cached;
    }

    // Circuit open: do not spend budget on a request that will not be sent
    if (breaker.blockingKey('investo', 'history')) {
        return [];
    }

    const budget =
        await providerBudget.spend(
            'investo',
            'history'
        );

    if (!budget.ok) {
        return [];
    }

    try {
        const response =
            await guardedRequest('investo', 'history', () =>
                axios.get(
                    `${INVESTO_BASE_URL}/prices/${encodeURIComponent(symbol)}`,
                    {
                        params: {
                            from,
                            to: end
                        },

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        timeout: 20000
                    }
                )
            );

        const data =
            response.data;

        /*
         * Investo returns:
         *
         * {
         *   ok: true,
         *   data: [...]
         * }
         */

        if (
            data?.ok === false
        ) {
            const errorCode =
                data?.error?.code ||
                'unknown';

            if (
                errorCode ===
                'rate_limited'
            ) {
                activateInvestoCooldown();
            }

            console.warn(
                `⚠️ Investo history error for ${symbol}: ${errorCode}`
            );

            return [];
        }

        const rawRows =
            Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.history)
                        ? data.history
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

        const rows =
            normalizeHistoricalRows(
                rawRows
            )
                .filter(row =>
                    row.date >= from &&
                    row.date <= end
                )
                .sort(
                    (a, b) =>
                        a.date.localeCompare(
                            b.date
                        )
                )
                .slice(-safeDays);

        cacheSet(
            historyCache,
            cacheKey,
            rows,
            HISTORY_CACHE_TTL
        );

        console.log(
            `✓ Investo history for ${symbol}: ${rows.length} real trading days`
        );

        return rows;

    } catch (error) {
        const responseData =
            error.response?.data;

        const status =
            error.response?.status;

        if (
            status === 429 ||
            responseData?.error?.code ===
                'rate_limited'
        ) {
            activateInvestoCooldown();
        }

        console.error(
            `[getInvestoHistory] ${symbol}:`,
            responseData ||
            error.message
        );

        return [];
    }
}

// ============================================================
// TWELVE DATA — US HISTORY
// ============================================================

async function getTwelveDataHistory(
    ticker,
    days = 30,
    endDate = null,
    forceRefresh = false
) {
    const token =
        getTwelveDataToken();

    if (!token) {
        console.error(
            '❌ TWELVE_DATA_API_KEY is missing from .env'
        );

        return [];
    }

    const symbol =
        normalizeTicker(ticker);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 30,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    // Fetch the number of trading days requested.
    const historyDays =
        safeDays;

    const calendarWindow =
        Math.max(
            30,
            historyDays * 3
        );

    const from =
        subtractDays(
            end,
            calendarWindow
        );

    // Cached per history length so a short fetch never
    // serves a longer request.
    const cacheKey =
        `twelvedata-history:${symbol}:${safeDays}:${end}`;

    if (!forceRefresh) {
        const cached =
            cacheGet(
                historyCache,
                cacheKey
            );

        if (cached) {
            const result =
                cached.slice(-safeDays);

            console.log(
                `✓ Cached Twelve Data history for ${symbol}: ${result.length} real trading days`
            );

            return result;
        }
    }

    // --------------------------------------------------------
    // Request deduplication
    // --------------------------------------------------------

    const inFlightKey =
        `twelvedata-history:${symbol}:${safeDays}:${end}`;

    const existingRequest =
        twelveDataInFlight.get(
            inFlightKey
        );

    if (existingRequest) {
        console.log(
            `↳ Sharing in-flight Twelve Data request for ${symbol}`
        );

        const sharedRows =
            await existingRequest;

        return sharedRows.slice(
            -safeDays
        );
    }

    // --------------------------------------------------------
    // Make one queued request
    // --------------------------------------------------------

    const requestPromise =
        (async () => {
            try {
                const response =
                    await enqueueTwelveDataRequest(
                        () =>
                            guardedRequest('twelvedata', 'time_series', () =>
                                axios.get(
                                    `${TWELVE_DATA_BASE_URL}/time_series`,
                                    {
                                        params: {
                                            symbol,
                                            interval:
                                                '1day',
                                            start_date:
                                                from,
                                            end_date:
                                                end,
                                            apikey:
                                                token,
                                            order:
                                                'asc',
                                            timezone:
                                                'America/New_York',
                                            outputsize:
                                                5000
                                        },
                                        timeout: 20000
                                    }
                                )
                            )
                    );

                const data =
                    response.data;

                if (
                    !data ||
                    data.status === 'error' ||
                    !Array.isArray(
                        data.values
                    )
                ) {
                    console.error(
                        `[getTwelveDataHistory] ${symbol}:`,
                        data
                    );

                    return [];
                }

                const allRows =
                    data.values
                        .map(row => ({
                            date:
                                row.datetime,
                            open:
                                parseNumber(
                                    row.open
                                ),
                            high:
                                parseNumber(
                                    row.high
                                ),
                            low:
                                parseNumber(
                                    row.low
                                ),
                            close:
                                parseNumber(
                                    row.close
                                ),
                            volume:
                                parseNumber(
                                    row.volume
                                )
                        }))
                        .filter(
                            row =>
                                row.date &&
                                isValidPrice(
                                    row.close
                                )
                        )
                        .sort(
                            (a, b) =>
                                a.date.localeCompare(
                                    b.date
                                )
                        );

                console.log(
                    `📅 Twelve Data ${symbol} dates:`,
                    allRows.map(row => row.date)
                );

                await savePriceHistory(
                    symbol,
                    'US',
                    allRows,
                    'twelvedata'
                );

                const rows =
                    allRows.slice(
                        -historyDays
                    );

                cacheSet(
                    historyCache,
                    cacheKey,
                    rows,
                    HISTORY_CACHE_TTL
                );

                console.log(
                    `✓ Twelve Data history for ${symbol}: ${rows.length} real trading days`
                );

                return rows;
            } catch (error) {
                console.error(
                    `[getTwelveDataHistory] ${symbol}:`,
                    error.response?.data ||
                    error.message
                );

                return [];
            }
        })();

    twelveDataInFlight.set(
        inFlightKey,
        requestPromise
    );

    try {
        const rows =
            await requestPromise;

        return rows.slice(
            -safeDays
        );
    } finally {
        twelveDataInFlight.delete(
            inFlightKey
        );
    }
}

// ============================================================
// NORMALIZE HISTORICAL ROWS
// ============================================================

function normalizeHistoricalRows(
    rows
) {
    if (!Array.isArray(rows)) {
        return [];
    }

    const unique = new Map();

    for (const row of rows) {
        if (!row) {
            continue;
        }

        const dateValue =
            row.date ??
            row.datetime ??
            row.timestamp ??
            row.t;

        let date = null;

        if (
            typeof dateValue ===
            'number'
        ) {
            const timestamp =
                dateValue <
                100000000000
                    ? dateValue * 1000
                    : dateValue;

            const parsed =
                new Date(timestamp);

            if (
                !Number.isNaN(
                    parsed.getTime()
                )
            ) {
                date =
                    parsed
                        .toISOString()
                        .slice(0, 10);
            }
        } else if (dateValue) {
            date =
                dateOnly(dateValue);
        }

        const close =
            parseNumber(
                row.close ??
                row.c ??
                row.price
            );

        if (
            !date ||
            !isValidPrice(close)
        ) {
            continue;
        }

        const open =
            parseNumber(
                row.open ??
                row.o
            );

        const high =
            parseNumber(
                row.high ??
                row.h
            );

        const low =
            parseNumber(
                row.low ??
                row.l
            );

        const volume =
            parseNumber(
                row.volume ??
                row.v
            );

        unique.set(
            date,
            {
                date,
                open:
                    isValidPrice(open)
                        ? open
                        : null,
                high:
                    isValidPrice(high)
                        ? high
                        : null,
                low:
                    isValidPrice(low)
                        ? low
                        : null,
                close,
                volume
            }
        );
    }

    return Array.from(
        unique.values()
    ).sort(
        (a, b) =>
            a.date.localeCompare(
                b.date
            )
    );
}

// ============================================================
// PRICE SNAPSHOT HISTORY FALLBACK
// ============================================================

async function getSnapshotHistory(
    ticker,
    days = 30,
    endDate = null
) {
    const symbol =
        normalizeTicker(ticker);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 30,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    const historyDays =
        Math.max(
            safeDays,
            60
        );

    const calendarWindow =
        Math.max(
            30,
            historyDays * 3
        );

    const start =
        subtractDays(
            end,
            calendarWindow
        );

    try {
        const snapshots =
            await PriceSnapshot.find({
                ticker: symbol,
                date: {
                    $gte: start,
                    $lte: end
                }
            })
                .sort({
                    date: 1
                })
                .lean();

        const rows =
            snapshots
                .map(snapshot => {
                    const price =
                        Number(
                            snapshot.price
                        );

                    if (
                        !isValidPrice(
                            price
                        )
                    ) {
                        return null;
                    }

                    return {
                        date:
                            snapshot.date,
                        open: price,
                        high: price,
                        low: price,
                        close: price,
                        volume: null
                    };
                })
                .filter(Boolean)
                .slice(-safeDays);

        console.log(
            `✓ Snapshot fallback for ${symbol}: ${rows.length} real observed days`
        );

        return rows;
    } catch (error) {
        console.error(
            `[getSnapshotHistory] ${symbol}:`,
            error.message
        );

        return [];
    }
}



// ============================================================
// HISTORICAL PROVIDER STATUS
// ============================================================
//
// Used ONLY by the scheduler.
//
// This deliberately does NOT use PriceSnapshot fallback.
// Therefore:
//
// available     = provider returned real history
// no_data       = provider responded successfully but had
//                 no historical rows
// provider_error = provider request failed
// cooldown      = no request was made (quota or circuit open)
//
// IMPORTANT:
// getPriceHistory() remains unchanged and can still use
// PriceSnapshot for "Observed by Gaze" charts.
// ============================================================

async function getHistoricalProviderStatus(
    ticker,
    days = 10,
    market = 'NGX',
    endDate = null
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 10,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return {
            status: 'provider_error',
            rows: []
        };
    }

    // ========================================================
    // US — TWELVE DATA
    // ========================================================

    if (normalizedMarket === 'US') {
        // Circuit open: report "cooldown", NOT "no_data". Without this,
        // getPriceHistory would return an empty list and the scheduler
        // would wrongly believe the stock has no history.
        if (breaker.blockingKey('twelvedata', 'time_series')) {
            return {
                status: 'cooldown',
                rows: [],
                requestMade: false
            };
        }

        const budgetCheck =
            await providerBudget.check('twelvedata');

        if (!budgetCheck.ok) {
            return {
                status: 'cooldown',
                rows: [],
                requestMade: false
            };
        }

        try {
            /*
             * getPriceHistory() routes US history to Twelve Data
             * and does not use the NGX snapshot fallback.
             */
            const rows =
                await getPriceHistory(
                    symbol,
                    safeDays,
                    'US',
                    end,
                    true
                );

            return {
                status:
                    rows.length > 0
                        ? 'available'
                        : 'no_data',

                rows
            };

        } catch (error) {
            console.error(
                `[HistoricalProviderStatus] ${symbol} (${normalizedMarket}):`,
                error.message
            );

            return {
                status: 'provider_error',
                rows: []
            };
        }
    }

    // ========================================================
    // NGX — INVESTO
    // ========================================================

    const token =
        getInvestoToken();

    if (!token) {
        console.error(
            '❌ INVESTO_API_KEY is missing from .env'
        );

        return {
            status: 'provider_error',
            rows: []
        };
    }

    if (
        await isInvestoCoolingDown()
    ) {
        console.log(
            `⏸️ Investo cooldown active. Skipping provider status for ${symbol}`
        );

        return {
            status: 'cooldown',
            rows: [],
            requestMade: false
        };
    }

    // Circuit open: do not spend budget on a request that will not be sent
    if (breaker.blockingKey('investo', 'history-status')) {
        return {
            status: 'cooldown',
            rows: [],
            requestMade: false
        };
    }

    const budget =
        await providerBudget.spend(
            'investo',
            'history-status'
        );

    if (!budget.ok) {
        return {
            status: 'cooldown',
            rows: [],
            requestMade: false
        };
    }

    /*
     * Request extra calendar days because NGX has
     * weekends and market holidays.
     */

    const calendarWindow =
        Math.max(
            30,
            safeDays * 3
        );

    const from =
        subtractDays(
            end,
            calendarWindow
        );

    try {
        const response =
            await guardedRequest('investo', 'history-status', () =>
                axios.get(
                    `${INVESTO_BASE_URL}/prices/${encodeURIComponent(symbol)}`,
                    {
                        params: {
                            from,
                            to: end
                        },

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        timeout: 20000
                    }
                )
            );

        const data =
            response.data;

        /*
         * Explicit API error response.
         */

        if (
            data?.ok === false
        ) {
            const errorCode =
                data?.error?.code ||
                'unknown';

            if (
                errorCode ===
                'rate_limited'
            ) {
                await activateInvestoCooldown();
            }

            console.warn(
                `[HistoricalProviderStatus] ${symbol}: Investo error ${errorCode}`
            );

            return {
                status:
                    errorCode ===
                    'unknown_symbol'
                        ? 'no_data'
                        : 'provider_error',

                rows: [],
                requestMade: true
            };
        }

        const rawRows =
            Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.history)
                        ? data.history
                        : Array.isArray(data?.results)
                            ? data.results
                            : [];

        const rows =
            normalizeHistoricalRows(
                rawRows
            )
                .filter(row =>
                    row.date >= from &&
                    row.date <= end
                )
                .sort(
                    (a, b) =>
                        a.date.localeCompare(
                            b.date
                        )
                )
                .slice(-safeDays);

        if (rows.length > 0) {
            console.log(
                `✓ Investo provider status for ${symbol}: ${rows.length} real trading days available`
            );

            return {
                status: 'available',
                rows,
                requestMade: true
            };
        }

        console.log(
            `⏸️ Investo provider status for ${symbol}: no historical data`
        );

        return {
            status: 'no_data',
            rows: [],
            requestMade: true
        };

    } catch (error) {
        const responseStatus =
            error.response?.status;

        const responseData =
            error.response?.data;

        /*
         * 404 means Investo has no recognized historical
         * dataset for this symbol. Treat it as no_data,
         * not as a provider outage.
         */

        if (
            responseStatus === 404
        ) {
            console.log(
                `⏸️ Investo provider status for ${symbol}: no historical data`
            );

            return {
                status: 'no_data',
                rows: [],
                requestMade: true
            };
        }

        /*
         * Rate limit.
         */

        if (
            responseStatus === 429 ||
            responseData?.error?.code ===
                'rate_limited'
        ) {
            await activateInvestoCooldown();
        }

        console.error(
            `[HistoricalProviderStatus] ${symbol} (${normalizedMarket}):`,
            responseStatus || '',
            responseData?.error ||
            error.message
        );

        return {
            status: 'provider_error',
            rows: [],
            requestMade: true
        };
    }
}

// ============================================================
// PUBLIC HISTORY FUNCTION
// ============================================================
async function getPriceHistory(
    ticker,
    days = 30,
    market = 'NGX',
    endDate = null,
    forceRefresh = false
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const safeDays =
        Math.min(
            Math.max(
                Number(days) || 30,
                1
            ),
            365
        );

    const end =
        endDate
            ? dateOnly(endDate)
            : todayStr();

    if (!end) {
        return [];
    }

    // --------------------------------------------------------
    // CACHE KEY
    // --------------------------------------------------------

    const cacheKey =
        `history:${normalizedMarket}:${symbol}:${safeDays}:${end}`;

    // --------------------------------------------------------
    // NORMAL REQUEST
    //
    // Memory cache + MongoDB first.
    // --------------------------------------------------------

    if (!forceRefresh) {
        const cached =
            cacheGet(
                historyCache,
                cacheKey
            );

        if (cached) {
            return cached;
        }

        const storedHistory =
            await getStoredPriceHistory(
                symbol,
                normalizedMarket,
                safeDays,
                end
            );

        if (storedHistory.length) {
            cacheSet(
                historyCache,
                cacheKey,
                storedHistory,
                HISTORY_CACHE_TTL
            );

            return storedHistory;
        }
    }

    let history = [];

    // --------------------------------------------------------
    // US STOCKS
    // --------------------------------------------------------

    if (
        normalizedMarket === 'US'
    ) {
        history =
            await getTwelveDataHistory(
                symbol,
                safeDays,
                end,
                forceRefresh
            );
    }

    // --------------------------------------------------------
    // NGX STOCKS
    // --------------------------------------------------------

    else {
        history =
            await getInvestoHistory(
                symbol,
                safeDays,
                end,
                forceRefresh
            );

        /*
         * Snapshot fallback is still allowed when
         * Investo returns no historical data.
         *
         * This fallback uses only real observed
         * snapshots already stored by Gaze.
         */

        if (!history.length) {
            history =
                await getSnapshotHistory(
                    symbol,
                    safeDays,
                    end
                );
        }
    }

    // --------------------------------------------------------
    // NORMALIZE RESULT
    // --------------------------------------------------------

    const normalized =
        normalizeHistoricalRows(
            history
        );

    // --------------------------------------------------------
    // SAVE TO MEMORY CACHE
    // --------------------------------------------------------

    cacheSet(
        historyCache,
        cacheKey,
        normalized,
        HISTORY_CACHE_TTL
    );

    return normalized;
}

// ============================================================
// CURRENT PRICE
// ============================================================

async function getPriceWithMeta(
    ticker,
    market = 'NGX'
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const cacheKey =
        `price:${normalizedMarket}:${symbol}`;

    const none = {
        price: null,
        source: null,
        sourceTimestamp: null,
        fetchedAt: null
    };

    // --------------------------------------------------------
    // Fresh enough in memory
    // --------------------------------------------------------

    const cached =
        cacheGet(
            priceCache,
            cacheKey
        );

    if (isValidPrice(cached)) {
        console.log(
            `✓ Cached ${normalizedMarket} price for ${symbol}: ${cached}`
        );

        const meta =
            priceMetaCache.get(cacheKey) || {};

        return {
            price: cached,
            source: meta.source || null,
            sourceTimestamp: meta.sourceTimestamp || null,
            fetchedAt: meta.fetchedAt || null
        };
    }

    // --------------------------------------------------------
    // Failed a moment ago: do not ask the providers again yet
    // --------------------------------------------------------

    const failedUntil =
        priceFailCache.get(cacheKey);

    if (
        failedUntil &&
        failedUntil > Date.now()
    ) {
        return none;
    }

    let price = null;
    let source = null;

    // --------------------------------------------------------
    // US
    // --------------------------------------------------------

    if (
        normalizedMarket === 'US'
    ) {
        source = 'finnhub';

        price =
            await getFinnhubPrice(
                symbol
            );
    }

    // --------------------------------------------------------
    // NGX
    // --------------------------------------------------------

    else {
        source = 'ngnmarket';

        price =
            await getNGNMarketPrice(
                symbol
            );

        if (!isValidPrice(price)) {
            source = 'investo';

            price =
                await getInvestoCurrentPrice(
                    symbol
                );
        }
    }

    // --------------------------------------------------------
    // Success: remember it in memory and in MongoDB
    // --------------------------------------------------------

    if (isValidPrice(price)) {
        const numericPrice =
            Number(price);

        const providerMeta =
            quoteMeta.get(
                `${normalizedMarket}:${symbol}`
            ) || {};

        // NGN Market data may come from the cached company list
        const fetchedAt =
            source === 'ngnmarket' && providerMeta.fetchedAt
                ? new Date(providerMeta.fetchedAt)
                : new Date();

        const sourceTimestamp =
            providerMeta.sourceTimestamp || null;

        cacheSet(
            priceCache,
            cacheKey,
            numericPrice,
            PRICE_CACHE_TTL
        );

        priceMetaCache.set(
            cacheKey,
            {
                source,
                sourceTimestamp,
                fetchedAt
            }
        );

        priceFailCache.delete(cacheKey);

        // Not awaited on purpose: saving must never slow a lookup
        void quoteStore.saveQuote({
            ticker: symbol,
            market: normalizedMarket,
            price: numericPrice,
            source,
            sourceTimestamp,
            fetchedAt
        });

        // Tell the rest of Gaze (alerts, later others) about the new price.
        // Only real fetches get here: cache hits return earlier.
        priceEvents.publishPrice({
            ticker: symbol,
            market: normalizedMarket,
            price: numericPrice,
            source,
            sourceTimestamp,
            fetchedAt
        });

        return {
            price: numericPrice,
            source,
            sourceTimestamp,
            fetchedAt
        };
    }

    // --------------------------------------------------------
    // Failure: remember it briefly
    // --------------------------------------------------------

    priceFailCache.set(
        cacheKey,
        Date.now() + PRICE_FAIL_TTL
    );

    void quoteStore.noteFailure({
        ticker: symbol,
        market: normalizedMarket,
        error: 'no price returned by providers'
    });

    console.warn(
        `⚠️ No real ${normalizedMarket} price available for ${symbol}`
    );

    return none;
}


async function getPrice(
    ticker,
    market = 'NGX'
) {
    const result =
        await getPriceWithMeta(
            ticker,
            market
        );

    return result.price;
}

// ============================================================
// QUOTE (price plus where it came from)
// ============================================================

async function getQuote(
    ticker,
    market = 'NGX'
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const live =
        await getPriceWithMeta(
            symbol,
            normalizedMarket
        );

    const quote = {
        ticker: symbol,
        market: normalizedMarket,
        price: live.price,
        source: live.source,
        sourceTimestamp: live.sourceTimestamp,
        fetchedAt: live.fetchedAt
    };

    // No live price: say so, and show the last one we really had
    if (live.price === null) {
        const stored =
            await quoteStore.getStoredQuote(
                symbol,
                normalizedMarket
            );

        if (
            stored &&
            isValidPrice(stored.price)
        ) {
            quote.lastKnown = {
                price: stored.price,
                source: stored.source,
                sourceTimestamp: stored.sourceTimestamp,
                fetchedAt: stored.fetchedAt
            };
        }
    }

    return quote;
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    getPrice,
    getPriceWithMeta,
    getPriceHistory,
    getStoredHistoryRows,
    ensureStoredHistory,
    getInvestoHistory,
    getHistoricalProviderStatus,
    getQuote
};