const axios = require('axios');
const PriceSnapshot = require('../models/PriceSnapshot');
const PriceHistory = require('../models/PriceHistory');
const ProviderState = require('../models/ProviderState');


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
const COMPANY_LIST_CACHE_TTL = 2 * 60 * 1000;

const priceCache = new Map();
const historyCache = new Map();

// Prevent duplicate Twelve Data requests
const twelveDataInFlight = new Map();
const investoInFlight = new Map();
const investoHistoryInFlight = new Map();

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
// NGN MARKET QUOTA / COOLDOWN
// ============================================================
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

    companyListRequest =
        (async () => {
            try {
                console.log(
                    '→ Requesting NGX company prices from NGN Market'
                );

                const response =
                    await axios.get(
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
}finally {
                companyListRequest = null;
            }
        })();

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
                console.log(
                    `→ Requesting Investo current price for ${symbol}`
                );

                const response =
                    await axios.get(
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

async function getFinnhubPrice(
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

    try {
        const response =
            await axios.get(
                `${FINNHUB_BASE_URL}/quote`,
                {
                    params: {
                        symbol,
                        token
                    },
                    timeout: 15000
                }
            );

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
// INVESTO — NGX HISTORY
// ============================================================

async function getInvestoHistory(
    ticker,
    days = 30,
    endDate = null,
    forceRefresh = false
) {
    const symbol =
        normalizeTicker(ticker);

    if (await isInvestoCoolingDown()) {
        console.log(
            `⏸️ Investo cooldown active. Skipping history for ${symbol}`
        );

        return [];
    }

    const token =
        getInvestoToken();

    if (!token) {
        console.error(
            '❌ INVESTO_API_KEY is missing from .env'
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

    // --------------------------------------------------------
    // CACHE KEY
    // --------------------------------------------------------

    const cacheKey =
        `investo-history:${symbol}:${safeDays}:${from}:${end}`;

    // --------------------------------------------------------
    // MEMORY CACHE
    // --------------------------------------------------------

    if (!forceRefresh) {
        const cached =
            cacheGet(
                historyCache,
                cacheKey
            );

        if (cached) {
            console.log(
                `✓ Cached Investo history for ${symbol}: ${cached.length} real trading days`
            );

            return cached;
        }
    }

    // --------------------------------------------------------
    // SHARE IDENTICAL IN-FLIGHT REQUESTS
    // --------------------------------------------------------

    if (
        investoHistoryInFlight.has(
            cacheKey
        )
    ) {
        console.log(
            `↳ Sharing in-flight Investo history request for ${symbol}`
        );

        return await investoHistoryInFlight.get(
            cacheKey
        );
    }

    // --------------------------------------------------------
    // REQUEST
    // --------------------------------------------------------

    const requestPromise =
        (async () => {
            try {
                console.log(
                    `→ Requesting Investo history for ${symbol}: ${from} → ${end}`
                );

                const response =
                    await axios.get(
                        `${INVESTO_BASE_URL}/prices/${encodeURIComponent(symbol)}`,
                        {
                            params: {
                                from,
                                to: end,
                                provenance: 1
                            },

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            },

                            timeout: 20000
                        }
                    );

                const body =
                    response.data;

                // ------------------------------------------------
                // API RESPONSE ERRORS
                // ------------------------------------------------

                if (
                    body?.ok === false
                ) {
                    const code =
                        body?.error?.code;

                    if (
                        code === 'rate_limited'
                    ) {
                        await activateInvestoCooldown();

                        return [];
                    }

                    if (
                        code === 'unknown_symbol'
                    ) {
                        console.warn(
                            `⚠️ Investo has no historical data for ${symbol}.`
                        );

                        return [];
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
                            `❌ Investo authentication error while loading ${symbol}:`,
                            body.error?.message
                        );

                        return [];
                    }

                    console.error(
                        `[getInvestoHistory] ${symbol}:`,
                        body.error || body
                    );

                    return [];
                }

                // ------------------------------------------------
                // FIND RAW HISTORY ARRAY
                // ------------------------------------------------

                const rawRows =
                    Array.isArray(
                        body?.data
                    )
                        ? body.data
                        : Array.isArray(
                            body
                        )
                            ? body
                            : Array.isArray(
                                body?.history
                            )
                                ? body.history
                                : Array.isArray(
                                    body?.results
                                )
                                    ? body.results
                                    : [];

                // ------------------------------------------------
                // NORMALIZE ALL REAL ROWS
                // ------------------------------------------------

                const allRows =
                    normalizeHistoricalRows(
                        rawRows
                    )
                        .filter(
                            row =>
                                row.date >= from &&
                                row.date <= end
                        )
                        .sort(
                            (a, b) =>
                                a.date.localeCompare(
                                    b.date
                                )
                        );

                // ------------------------------------------------
                // SAVE ALL AVAILABLE HISTORY
                // ------------------------------------------------

                await savePriceHistory(
                    symbol,
                    'NGX',
                    allRows,
                    'investo'
                );

                // ------------------------------------------------
                // RETURN ONLY REQUESTED NUMBER OF DAYS
                // ------------------------------------------------

                const rows =
                    allRows.slice(
                        -safeDays
                    );

                // ------------------------------------------------
                // MEMORY CACHE
                // ------------------------------------------------

                cacheSet(
                    historyCache,
                    cacheKey,
                    rows,
                    HISTORY_CACHE_TTL
                );

                console.log(
                    `✓ Investo history for ${symbol}: ${rows.length} real trading days`
                );

                await clearProviderCooldown(
                    'investo'
                );

                if (
                    rows.length
                ) {
                    console.log(
                        `  ↳ ${rows[0].date} → ${
                            rows[
                                rows.length - 1
                            ].date
                        }`
                    );
                }

                return rows;

            } catch (error) {
                const responseData =
                    error.response?.data;

                const errorCode =
                    responseData?.error?.code;

                // ------------------------------------------------
                // RATE LIMIT
                // ------------------------------------------------

                if (
                    error.response?.status === 429 ||
                    errorCode === 'rate_limited'
                ) {
                    await activateInvestoCooldown();
                }

                // ------------------------------------------------
                // UNKNOWN SYMBOL
                // ------------------------------------------------

                if (
                    error.response?.status === 404 ||
                    errorCode === 'unknown_symbol'
                ) {
                    console.warn(
                        `⚠️ Investo has no historical data for ${symbol}.`
                    );

                    return [];
                }

                // ------------------------------------------------
                // AUTHORIZATION
                // ------------------------------------------------

                if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                ) {
                    console.error(
                        `❌ Investo authentication/permission error for ${symbol}:`,
                        responseData ||
                        error.message
                    );

                    return [];
                }

                // ------------------------------------------------
                // OTHER ERRORS
                // ------------------------------------------------

                console.error(
                    `[getInvestoHistory] ${symbol}:`,
                    responseData ||
                    error.message
                );

                return [];
            }
        })();

    investoHistoryInFlight.set(
        cacheKey,
        requestPromise
    );

    try {
        return await requestPromise;
    } finally {
        investoHistoryInFlight.delete(
            cacheKey
        );
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

    // Shared cache for all history lengths.
    const cacheKey =
        `twelvedata-history:${symbol}:${end}`;

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
        `twelvedata-history:${symbol}:${end}`;

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

async function getPrice(
    ticker,
    market = 'NGX'
) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    const cacheKey =
        `price:${normalizedMarket}:${symbol}`;

    const cached =
        cacheGet(
            priceCache,
            cacheKey
        );

    if (isValidPrice(cached)) {
        console.log(
            `✓ Cached ${normalizedMarket} price for ${symbol}: ${cached}`
        );

        return cached;
    }

    let price = null;

    // --------------------------------------------------------
    // US
    // --------------------------------------------------------

    if (
        normalizedMarket === 'US'
    ) {
        price =
            await getFinnhubPrice(
                symbol
            );
    }

    // --------------------------------------------------------
    // NGX
    // --------------------------------------------------------

    else {
        price =
            await getNGNMarketPrice(
                symbol
            );

        if (!isValidPrice(price)) {
            price =
                await getInvestoCurrentPrice(
                    symbol
                );
        }
    }

    if (isValidPrice(price)) {
        const numericPrice =
            Number(price);

        cacheSet(
            priceCache,
            cacheKey,
            numericPrice,
            PRICE_CACHE_TTL
        );

        return numericPrice;
    }

    console.warn(
        `⚠️ No real ${normalizedMarket} price available for ${symbol}`
    );

    return null;
}

// ============================================================
// QUOTE ALIAS
// ============================================================

async function getQuote(
    ticker,
    market = 'NGX'
) {
    const price =
        await getPrice(
            ticker,
            market
        );

    return {
        ticker:
            normalizeTicker(ticker),
        market:
            normalizeMarket(market),
        price
    };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getPrice,
    getPriceHistory,
    getInvestoHistory,
    getQuote,
    getNGNMarketCompanies
};