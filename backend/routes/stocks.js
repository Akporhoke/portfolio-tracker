const express = require('express');

const router = express.Router();

const Stock = require('../models/Stock');

const {
    getQuote,
    getPriceHistory
} = require('../utils/getPrice');

// ============================================================
// VALID MARKETS
// ============================================================

const VALID_MARKETS = ['NGX', 'US'];


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
// GET CURRENT PRICE + CHANGE
//
// Example:
// GET /stocks/price/GTCO?market=NGX
// GET /stocks/price/AAPL?market=US
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
        // Validate market
        // --------------------------------------------------------

        if (
            !VALID_MARKETS.includes(market)
        ) {

            return res.status(400).json({
                error:
                    'Market must be NGX or US'
            });
        }


        // --------------------------------------------------------
        // Get quote
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
        // Validate market
        // --------------------------------------------------------

        if (
            !VALID_MARKETS.includes(market)
        ) {

            return res.status(400).json({
                error:
                    'Market must be NGX or US'
            });
        }


        // --------------------------------------------------------
        // Get REAL historical data
        //
        // NGX → Investo
        // US  → Finnhub
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