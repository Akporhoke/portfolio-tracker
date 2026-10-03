const PriceHistory = require('../models/PriceHistory');
const GazeEvent = require('../models/GazeEvent');

const SIGNIFICANCE = {
    portfolio: 5,
    watchlist: 10
};

function normalizeTicker(ticker) {
    return String(ticker || '')
        .trim()
        .toUpperCase();
}

function normalizeMarket(market) {
    const value = String(market || '')
        .trim()
        .toUpperCase();

    return value === 'US' ? 'US' : 'NGX';
}

function calculateChangePercent(previousPrice, currentPrice) {
    if (
        !Number.isFinite(previousPrice) ||
        !Number.isFinite(currentPrice) ||
        previousPrice <= 0
    ) {
        return null;
    }

    return (
        (currentPrice - previousPrice) /
        previousPrice
    ) * 100;
}

function getImportance(changePercent, threshold) {
    const absoluteChange =
        Math.abs(changePercent);

    if (absoluteChange >= threshold * 2) {
        return 'major';
    }

    if (absoluteChange >= threshold) {
        return 'significant';
    }

    return 'minor';
}

function buildSummary(
    ticker,
    changePercent,
    previousPrice,
    currentPrice
) {
    const direction =
        changePercent >= 0
            ? 'increased'
            : 'decreased';

    const sign =
        changePercent > 0
            ? '+'
            : '';

    return `${ticker} ${direction} by ${sign}${changePercent.toFixed(2)}% from ${previousPrice.toFixed(2)} to ${currentPrice.toFixed(2)}.`;
}

function buildExplanation(changePercent) {
    const direction =
        changePercent >= 0
            ? 'higher'
            : 'lower';

    return `The latest recorded trading price is ${Math.abs(changePercent).toFixed(2)}% ${direction} than the previous trading day.`;
}

/**
 * Detect a price movement for one stock.
 *
 * history must be sorted oldest → newest.
 */
async function detectPriceMove({
    userId,
    ticker,
    market,
    history,
    threshold
}) {
    const symbol = normalizeTicker(ticker);
    const normalizedMarket =
        normalizeMarket(market);

    if (
        !userId ||
        !symbol ||
        !Array.isArray(history)
    ) {
        return null;
    }

    if (history.length < 2) {
        return null;
    }

    const previous =
        history[history.length - 2];

    const current =
        history[history.length - 1];

    if (
        !previous ||
        !current ||
        !previous.date ||
        !current.date
    ) {
        return null;
    }

    if (
        !Number.isFinite(previous.close) ||
        !Number.isFinite(current.close)
    ) {
        return null;
    }

    const changePercent =
        calculateChangePercent(
            previous.close,
            current.close
        );

    if (changePercent === null) {
        return null;
    }

    const absoluteChange =
        Math.abs(changePercent);

    /*
     * Small tolerance prevents floating-point
     * precision from incorrectly rejecting an
     * exact threshold such as 10.00%.
     */
    if (
        absoluteChange + 0.000001 <
        threshold
    ) {
        return null;
    }

    const importance =
        getImportance(
            changePercent,
            threshold
        );

    const event = {
        userId,

        symbol,

        market: normalizedMarket,

        type: 'price_move',

        importance,

        date: current.date,

        data: {
            previousPrice: previous.close,

            currentPrice: current.close,

            changePercent: Number(
                changePercent.toFixed(2)
            )
        },

        summary: buildSummary(
            symbol,
            changePercent,
            previous.close,
            current.close
        ),

        explanation:
            buildExplanation(
                changePercent
            )
    };

    /*
     * Only insert the event if it does not
     * already exist.
     *
     * This makes the engine safe to run
     * repeatedly.
     */
    const savedEvent =
        await GazeEvent.findOneAndUpdate(
            {
                userId,

                symbol,

                market: normalizedMarket,

                type: 'price_move',

                date: current.date
            },

            {
                $setOnInsert: event
            },

            {
                upsert: true,

                new: true
            }
        );

    return savedEvent;
}

/**
 * Process one stock.
 *
 * holdingType:
 * - portfolio
 * - watchlist
 */
async function processStock({
    userId,
    ticker,
    market,
    holdingType
}) {
    const symbol =
        normalizeTicker(ticker);

    const normalizedMarket =
        normalizeMarket(market);

    if (
        holdingType !== 'portfolio' &&
        holdingType !== 'watchlist'
    ) {
        throw new Error(
            'holdingType must be "portfolio" or "watchlist".'
        );
    }

    const threshold =
        SIGNIFICANCE[holdingType];

    const history =
        await PriceHistory.find({
            ticker: symbol,
            market: normalizedMarket
        })
            .sort({ date: 1 })
            .lean();

    return detectPriceMove({
        userId,

        ticker: symbol,

        market: normalizedMarket,

        history,

        threshold
    });
}

/**
 * Process all portfolio holdings and
 * watchlist stocks.
 *
 * Duplicate ticker + market combinations
 * are processed only once.
 */
async function processPortfolio({
    userId,
    stocks = [],
    watchlist = []
}) {
    const events = [];

    const processed = new Set();

    async function processUniqueStock(
        stock,
        holdingType
    ) {
        const symbol =
            normalizeTicker(stock.ticker);

        const market =
            normalizeMarket(stock.market);

        if (!symbol) {
            return;
        }

        const key =
            `${symbol}:${market}`;

        if (processed.has(key)) {
            return;
        }

        processed.add(key);

        const event =
            await processStock({
                userId,

                ticker: symbol,

                market,

                holdingType
            });

        if (event) {
            events.push(event);
        }
    }

    for (const stock of stocks) {
        await processUniqueStock(
            stock,
            'portfolio'
        );
    }

    for (const stock of watchlist) {
        await processUniqueStock(
            stock,
            'watchlist'
        );
    }

    return events;
}

module.exports = {
    detectPriceMove,
    processStock,
    processPortfolio
};