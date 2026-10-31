const express = require('express');

const router = express.Router();

const Stock = require('../models/Stock');

const {
    getQuote,
    getPriceHistory
} = require('../utils/getPrice');

const quoteStore =
    require('../services/quoteStore');

const calendarService =
    require('../services/marketCalendarService');

const {
    collectTrackedSymbols
} = require('../services/priceScheduler');

// ============================================================
// VALID MARKETS
// ============================================================

const VALID_MARKETS = ['NGX', 'US'];

// Letters, digits and dots, up to 12 characters (for example GTCO, BRK.B)
const TICKER_PATTERN = /^[A-Z0-9.]{1,12}$/;


// ============================================================
// HELPERS
// ============================================================

function normalizeMarket(market) {
    return market
        ? String(market).trim().toUpperCase()
        : null;
}


function normalizeTicker(ticker) {
    return String(ticker || '')
        .trim()
        .toUpperCase();
}

function escapeRegex(value) {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
}


// ============================================================
// WHO MAY CAUSE A PROVIDER REQUEST
//
// /price and /history need no login (the app calls them like a
// public page), so anyone can call them, including with made-up
// tickers. Every provider request spends a free-plan allowance that the
// price scheduler and the alerts depend on. So:
//
//   tracked    held, watched, or has an alert  -> allowed
//   directory  a real stock nobody follows     -> allowed, but only
//              a few per minute across everyone
//   unknown    not a real stock                -> refused, no provider
//              request at all
// ============================================================

// The set of followed stocks is rebuilt at most this often
const TRACKED_CACHE_MS = 15 * 1000;

const DIRECTORY_CACHE_MS = 5 * 60 * 1000;
const DIRECTORY_CACHE_MAX = 2000;

// Untracked (directory-only) provider requests, all callers together
const UNTRACKED_PER_MINUTE =
    Number(process.env.PUBLIC_LOOKUPS_PER_MINUTE) || 20;

let trackedCache = {
    at: 0,
    keys: new Set()
};

const directoryCache = new Map();

let untrackedWindowStart = 0;
let untrackedCount = 0;


async function isTracked(ticker, market) {
    if (Date.now() - trackedCache.at > TRACKED_CACHE_MS) {
        try {
            const items = await collectTrackedSymbols();

            trackedCache = {
                at: Date.now(),
                keys: new Set(
                    items.map(item => `${item.ticker}|${item.market}`)
                )
            };

        } catch (error) {
            console.error(
                '[Stocks] could not load followed stocks:',
                error.message
            );

            // Keep the old list, and do not retry on every request
            trackedCache.at = Date.now();
        }
    }

    return trackedCache.keys.has(`${ticker}|${market}`);
}


async function inDirectory(ticker, market) {
    const key = `${ticker}|${market}`;

    const hit = directoryCache.get(key);

    if (hit && Date.now() - hit.at < DIRECTORY_CACHE_MS) {
        return hit.value;
    }

    let value = false;

    try {
        value = Boolean(
            await Stock.exists({
                ticker,
                market,
                active: true
            })
        );
    } catch (error) {
        console.error(
            '[Stocks] directory lookup failed:',
            error.message
        );

        // Do not remember a failed lookup
        return false;
    }

    // Made-up tickers must not be able to grow this without limit
    if (directoryCache.size >= DIRECTORY_CACHE_MAX) {
        directoryCache.clear();
    }

    directoryCache.set(key, { value, at: Date.now() });

    return value;
}


function allowUntrackedLookup() {
    const now = Date.now();

    if (now - untrackedWindowStart >= 60 * 1000) {
        untrackedWindowStart = now;
        untrackedCount = 0;
    }

    if (untrackedCount >= UNTRACKED_PER_MINUTE) {
        return false;
    }

    untrackedCount++;

    return true;
}


// A stored quote, in the same shape getQuote returns
function quoteFromStore(stored, ticker, market, stale = false) {
    return {
        ticker,
        market,
        price: Number(stored.price),
        source: stored.source || null,
        sourceTimestamp: stored.sourceTimestamp || null,
        fetchedAt: stored.fetchedAt || null,
        cached: true,
        ...(stale ? { stale: true } : {})
    };
}


// ============================================================
// LIST / FILTER STOCK DIRECTORY (EXPLORER)
//
// Example:
// GET /api/stocks?market=US&sector=Technology&page=1&limit=30
// GET /api/stocks?q=apple
// GET /api/stocks?sp500=true
// ============================================================

router.get('/', async (req, res) => {
    try {
        const market =
            normalizeMarket(req.query.market);

        const sector =
            String(req.query.sector || '')
                .trim();

        const q =
            String(req.query.q || '')
                .trim();

        const filter = {
            active: true
        };

        if (VALID_MARKETS.includes(market)) {
            filter.market = market;
        }

        if (sector) {
            filter.sector = sector;
        }

        if (req.query.sp500 === 'true') {
            filter.isSP500 = true;
        }

        if (q) {
            const rx =
                new RegExp(
                    escapeRegex(q),
                    'i'
                );

            filter.$or = [
                { ticker: rx },
                { name: rx },
                { aliases: rx }
            ];
        }

        const page =
            Math.max(
                parseInt(
                    req.query.page,
                    10
                ) || 1,
                1
            );

        const limit =
            Math.min(
                Math.max(
                    parseInt(
                        req.query.limit,
                        10
                    ) || 30,
                    1
                ),
                100
            );

        const [results, total] =
            await Promise.all([
                Stock.find(filter)
                    .select(
                        'ticker name market sector industry marketCap isSP500'
                    )
                    .sort({
                        marketCap: -1,
                        ticker: 1
                    })
                    .skip(
                        (page - 1) * limit
                    )
                    .limit(limit)
                    .lean(),

                Stock.countDocuments(filter)
            ]);

        return res.json({
            results,
            total,
            page,
            pages:
                Math.ceil(total / limit)
        });

    } catch (err) {
        console.error(
            '[GET /stocks] Error:',
            err
        );

        return res.status(500).json({
            error:
                'Failed to load stock directory'
        });
    }
});


// ============================================================
// SEARCH STOCK DIRECTORY
//
// Example:
// GET /api/stocks/search?q=gtco
// GET /api/stocks/search?q=apple
//
// IMPORTANT:
// MongoDB is ALWAYS searched first.
// External APIs are NOT called by this route yet.
// ============================================================

router.get('/search', async (req, res) => {
    try {
        const query =
            String(req.query.q || '')
                .trim();

        if (!query) {
            return res.json({
                results: []
            });
        }

        const normalizedQuery =
            query.toLowerCase();

        const searchQuery =
            escapeRegex(query);

        const stocks =
            await Stock.find({
                active: true,
                $or: [
                    {
                        ticker: {
                            $regex:
                                `^${searchQuery}`,
                            $options: 'i'
                        }
                    },
                    {
                        name: {
                            $regex:
                                searchQuery,
                            $options: 'i'
                        }
                    },
                    {
                        aliases: {
                            $regex:
                                searchQuery,
                            $options: 'i'
                        }
                    }
                ]
            })
            .limit(50)
            .lean();

        // Rank results by relevance
        const rankedStocks =
            stocks
                .map(stock => {
                    const ticker =
                        String(
                            stock.ticker || ''
                        ).toLowerCase();

                    const name =
                        String(
                            stock.name || ''
                        ).toLowerCase();

                    const aliases =
                        Array.isArray(
                            stock.aliases
                        )
                            ? stock.aliases
                            : [];

                    const normalizedAliases =
                        aliases.map(alias =>
                            String(alias)
                                .toLowerCase()
                        );

                    let score = 0;

                    // 1. Exact ticker match
                    if (
                        ticker ===
                        normalizedQuery
                    ) {
                        score += 1000;
                    }

                    // 2. Ticker starts with query
                    else if (
                        ticker.startsWith(
                            normalizedQuery
                        )
                    ) {
                        score += 800;
                    }

                    // 3. Exact company name
                    if (
                        name ===
                        normalizedQuery
                    ) {
                        score += 700;
                    }

                    // 4. Company name starts with query
                    else if (
                        name.startsWith(
                            normalizedQuery
                        )
                    ) {
                        score += 600;
                    }

                    // 5. Alias exact match
                    if (
                        normalizedAliases
                            .some(
                                alias =>
                                    alias ===
                                    normalizedQuery
                            )
                    ) {
                        score += 500;
                    }

                    // 6. Alias starts with query
                    else if (
                        normalizedAliases
                            .some(
                                alias =>
                                    alias.startsWith(
                                        normalizedQuery
                                    )
                            )
                    ) {
                        score += 400;
                    }

                    // 7. Company name contains query
                    if (
                        name.includes(
                            normalizedQuery
                        )
                    ) {
                        score += 200;
                    }

                    // 8. Alias contains query
                    if (
                        normalizedAliases
                            .some(
                                alias =>
                                    alias.includes(
                                        normalizedQuery
                                    )
                            )
                    ) {
                        score += 100;
                    }

                    return {
                        ...stock,
                        _score: score
                    };
                })
                .sort(
                    (a, b) =>
                        b._score -
                        a._score
                )
                .slice(0, 8);

        return res.json({
            results:
                rankedStocks.map(
                    stock => {
                        const {
                            _score,
                            ...cleanStock
                        } = stock;

                        return cleanStock;
                    }
                )
        });

    } catch (err) {
        console.error(
            '[GET /stocks/search] Error:',
            err
        );

        return res.status(500).json({
            error:
                'Failed to search stock directory'
        });
    }
});


// ============================================================
// GET CURRENT PRICE
//
// Example:
// GET /stocks/price/GTCO?market=NGX
// GET /stocks/price/AAPL?market=US
//
// Order of work:
//   1. A stored price that is still fresh (by the market calendar
//      rules the scheduler uses) is returned. No provider is asked.
//   2. Otherwise a provider may be asked, but only for a followed
//      stock, or (a few per minute) for a real stock in the directory.
//   3. If a provider may not be asked, the stored price is returned
//      marked "stale", or the request is refused.
// ============================================================

router.get('/price/:ticker', async (req, res) => {

    try {

        const ticker =
            normalizeTicker(
                req.params.ticker
            );

        const market =
            normalizeMarket(
                req.query.market
            );


        // --------------------------------------------------------
        // Validate input
        // --------------------------------------------------------

        if (
            !VALID_MARKETS.includes(market)
        ) {

            return res.status(400).json({
                error:
                    'Market must be NGX or US'
            });
        }

        if (!TICKER_PATTERN.test(ticker)) {

            return res.status(400).json({
                error: 'Invalid ticker'
            });
        }


        // --------------------------------------------------------
        // 1. Fresh stored price: answer from the database
        // --------------------------------------------------------

        const stored =
            await quoteStore.getStoredQuote(
                ticker,
                market
            );

        const hasStored =
            Boolean(
                stored &&
                Number(stored.price) > 0
            );

        if (hasStored) {

            const state =
                await calendarService.getMarketState(
                    market
                );

            const assessed =
                calendarService.assessQuote(
                    market,
                    stored,
                    state
                );

            if (!assessed.shouldRefresh) {

                return res.json(
                    quoteFromStore(
                        stored,
                        ticker,
                        market
                    )
                );
            }
        }


        // --------------------------------------------------------
        // 2. May a provider be asked?
        // --------------------------------------------------------

        let allowed =
            await isTracked(
                ticker,
                market
            );

        if (!allowed) {

            const listed =
                await inDirectory(
                    ticker,
                    market
                );

            if (!listed && !hasStored) {

                return res.status(404).json({
                    error: 'Unknown stock'
                });
            }

            allowed =
                listed &&
                allowUntrackedLookup();
        }


        // --------------------------------------------------------
        // 3. Not allowed: stored price (marked stale) or refuse
        // --------------------------------------------------------

        if (!allowed) {

            if (hasStored) {

                return res.json(
                    quoteFromStore(
                        stored,
                        ticker,
                        market,
                        true
                    )
                );
            }

            return res.status(429).json({
                error:
                    'Too many price requests right now. Try again in a minute.'
            });
        }


        // --------------------------------------------------------
        // Ask the provider (through the budget and circuit breaker)
        // --------------------------------------------------------

        const quote =
            await getQuote(
                ticker,
                market
            );


        res.json(quote);


    } catch (err) {

        console.error(
            '[GET /stocks/price/:ticker] Error:',
            err
        );


        res.status(500).json({
            error: err.message
        });
    }
});


// ============================================================
// GET HISTORICAL PRICE DATA
//
// Example:
// GET /stocks/history/GTCO?market=NGX&days=7
// GET /stocks/history/AAPL?market=US&days=7
//
// Stored history is used first (inside getPriceHistory). A provider
// is only asked for a followed stock, or (a few per minute) for a
// real stock in the directory.
// ============================================================

router.get('/history/:ticker', async (req, res) => {

    try {

        const ticker =
            normalizeTicker(
                req.params.ticker
            );


        const market =
            normalizeMarket(
                req.query.market
            );


        const days =
            Math.min(
                Math.max(
                    parseInt(
                        req.query.days,
                        10
                    ) || 7,
                    1
                ),
                365
            );


        // --------------------------------------------------------
        // Validate input
        // --------------------------------------------------------

        if (
            !VALID_MARKETS.includes(market)
        ) {

            return res.status(400).json({
                error:
                    'Market must be NGX or US'
            });
        }

        if (!TICKER_PATTERN.test(ticker)) {

            return res.status(400).json({
                error: 'Invalid ticker'
            });
        }


        // --------------------------------------------------------
        // May this stock cause provider requests?
        // --------------------------------------------------------

        const tracked =
            await isTracked(
                ticker,
                market
            );

        if (!tracked) {

            const listed =
                await inDirectory(
                    ticker,
                    market
                );

            if (!listed) {

                return res.status(404).json({
                    error: 'Unknown stock'
                });
            }

            if (!allowUntrackedLookup()) {

                return res.status(429).json({
                    error:
                        'Too many requests right now. Try again in a minute.'
                });
            }
        }


        // --------------------------------------------------------
        // Get REAL historical data
        //
        // NGX → Investo
        // US  → Twelve Data
        // (stored history is used first)
        // --------------------------------------------------------

        const history =
            await getPriceHistory(
                ticker,
                days,
                market
            );


        res.json({

            ticker,

            market,

            days:
                history.length,

            data:
                history

        });


    } catch (err) {

        console.error(
            '[GET /stocks/history/:ticker] Error:',
            err
        );


        res.status(500).json({
            error: err.message
        });
    }
});


module.exports = router;
