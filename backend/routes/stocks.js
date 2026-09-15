const express = require('express');

const router = express.Router();

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