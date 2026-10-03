const express = require('express');
const router = express.Router();

const ConfidenceSnapshot =
    require('../models/ConfidenceSnapshot');
const Portfolio = require('../models/portfolio');

const {
    getPrice,
    getPriceHistory
} = require('../utils/getPrice');


// ============================================================
// CONFIDENCE SYSTEM SETTINGS
// ============================================================

const REQUIRED_PRE_ADD_DAYS = 7;
const MAX_POST_ADD_DAYS = 7;


// ============================================================
// BASIC HELPERS
// ============================================================

function normalizeTicker(ticker) {
    return String(ticker || '')
        .trim()
        .toUpperCase();
}


function normalizeMarket(market) {
    return String(market || 'US')
        .trim()
        .toUpperCase();
}


function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}


function round(value, decimals = 2) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(value)
    ) {
        return null;
    }

    const multiplier = Math.pow(10, decimals);

    return Math.round(value * multiplier) / multiplier;
}


function getMarketTimeZone(market) {
    return normalizeMarket(market) === 'US'
        ? 'America/New_York'
        : 'Africa/Lagos';
}

function dateOnly(value, market = 'NGX') {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: getMarketTimeZone(market),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}


function isValidPrice(value) {
    return (
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value)) &&
        Number(value) > 0
    );
}


// ============================================================
// HISTORY NORMALIZATION
// ============================================================

function normalizeHistoryRows(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const normalized = [];

    for (const row of history) {
        if (!row || typeof row !== 'object') {
            continue;
        }

        const dateValue =
            row.date ??
            row.datetime ??
            row.timestamp ??
            row.t;

        const closeValue =
            row.close ??
            row.c ??
            row.price;

        const openValue =
            row.open ??
            row.o;

        const highValue =
            row.high ??
            row.h;

        const lowValue =
            row.low ??
            row.l;

        const volumeValue =
            row.volume ??
            row.v;

        // ----------------------------------------------------
        // Normalize date
        // ----------------------------------------------------

        let normalizedDate = null;

        if (typeof dateValue === 'number') {
            const timestamp =
                dateValue < 10000000000
                    ? dateValue * 1000
                    : dateValue;

            const parsed = new Date(timestamp);

            if (!Number.isNaN(parsed.getTime())) {
                normalizedDate =
                    parsed.toISOString().slice(0, 10);
            }
        } else if (dateValue) {
            const parsed = new Date(dateValue);

            if (!Number.isNaN(parsed.getTime())) {
                normalizedDate =
                    parsed.toISOString().slice(0, 10);
            } else {
                const stringDate =
                    String(dateValue).slice(0, 10);

                if (/^\d{4}-\d{2}-\d{2}$/.test(stringDate)) {
                    normalizedDate = stringDate;
                }
            }
        }

        if (!normalizedDate) {
            continue;
        }

        // ----------------------------------------------------
        // Normalize numbers
        // ----------------------------------------------------

        const close = Number(closeValue);
        const open = Number(openValue);
        const high = Number(highValue);
        const low = Number(lowValue);
        const volume = Number(volumeValue);

        if (
            !Number.isFinite(close) ||
            close <= 0
        ) {
            continue;
        }

        normalized.push({
            date: normalizedDate,

            open:
                Number.isFinite(open) && open > 0
                    ? open
                    : null,

            high:
                Number.isFinite(high) && high > 0
                    ? high
                    : null,

            low:
                Number.isFinite(low) && low > 0
                    ? low
                    : null,

            close,

            volume:
                Number.isFinite(volume) && volume >= 0
                    ? volume
                    : null
        });
    }

    // --------------------------------------------------------
    // Deduplicate by date
    // --------------------------------------------------------

    const byDate = new Map();

    for (const row of normalized) {
        byDate.set(row.date, row);
    }

    return Array.from(byDate.values())
        .sort((a, b) =>
            a.date.localeCompare(b.date)
        );
}


// ============================================================
// STATISTICAL HELPERS
// ============================================================

function average(values) {
    const valid =
        values.filter(
            value =>
                Number.isFinite(value)
        );

    if (!valid.length) {
        return null;
    }

    return (
        valid.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / valid.length
    );
}


function standardDeviation(values) {
    const valid =
        values.filter(
            value =>
                Number.isFinite(value)
        );

    if (valid.length < 2) {
        return null;
    }

    const mean =
        average(valid);

    const variance =
        valid.reduce(
            (sum, value) =>
                sum +
                Math.pow(
                    value - mean,
                    2
                ),
            0
        ) / valid.length;

    return Math.sqrt(variance);
}


function calculateReturns(rows) {
    if (
        !Array.isArray(rows) ||
        rows.length < 2
    ) {
        return [];
    }

    const result = [];

    for (
        let i = 1;
        i < rows.length;
        i++
    ) {
        const previous =
            Number(
                rows[i - 1].close
            );

        const current =
            Number(
                rows[i].close
            );

        if (
            !Number.isFinite(previous) ||
            !Number.isFinite(current) ||
            previous <= 0
        ) {
            continue;
        }

        result.push(
            ((current - previous) /
                previous) * 100
        );
    }

    return result;
}


// ============================================================
// CONFIDENCE COMPONENTS
// ============================================================

function calculateMomentumScore(
    baselineRows,
    observationRows
) {
    if (
        baselineRows.length < REQUIRED_PRE_ADD_DAYS ||
        observationRows.length < 1
    ) {
        return null;
    }

    const lastBaseline =
        baselineRows[baselineRows.length - 1];

    // Average daily % move BEFORE the stock was added
    const baselineAverage =
        average(calculateReturns(baselineRows));

    // Average daily % move AFTER. The last baseline row is prepended so
    // the first observation day also produces a return: N rows = N returns.
    const observationAverage =
        average(
            calculateReturns([lastBaseline, ...observationRows])
        );

    if (
        baselineAverage === null ||
        observationAverage === null
    ) {
        return null;
    }

    // Difference in average daily % move, after vs before:
    //   0           => 50
    //   +1.5 %/day  => 100
    //   -1.5 %/day  => 0
    const improvement =
        observationAverage - baselineAverage;

    return clamp(50 + improvement * 33);
}


function calculateStabilityScore(
    baselineRows,
    observationRows
) {
    if (
        baselineRows.length <
            REQUIRED_PRE_ADD_DAYS ||
        observationRows.length < 2
    ) {
        return null;
    }

    const baselineReturns =
        calculateReturns(
            baselineRows
        );

    const observationReturns =
        calculateReturns(
            observationRows
        );

    if (
        baselineReturns.length < 2 ||
        observationReturns.length < 1
    ) {
        return null;
    }

    const baselineStd =
        standardDeviation(
            baselineReturns
        );

    /*
     * With only one post-add return,
     * use the absolute return as a temporary
     * volatility estimate.
     *
     * Once more days exist, use the actual
     * standard deviation.
     */

    let observationStd = null;

    if (observationReturns.length >= 2) {
        observationStd =
            standardDeviation(
                observationReturns
            );
    } else if (
        observationReturns.length === 1
    ) {
        observationStd =
            Math.abs(
                observationReturns[0]
            );
    }

    if (
        !Number.isFinite(baselineStd) ||
        !Number.isFinite(observationStd)
    ) {
        return null;
    }

    if (baselineStd === 0) {
        return observationStd === 0
            ? 100
            : 50;
    }

    const change =
        ((baselineStd - observationStd) /
            baselineStd) * 100;

    return clamp(
        50 + change
    );
}


function calculateVolatilityScore(
    baselineRows,
    observationRows
) {
    if (
        baselineRows.length <
            REQUIRED_PRE_ADD_DAYS ||
        observationRows.length < 1
    ) {
        return null;
    }

    const baselineVolatility = [];

    for (const row of baselineRows) {
        if (
            isValidPrice(row.high) &&
            isValidPrice(row.low) &&
            isValidPrice(row.close)
        ) {
            baselineVolatility.push(
                ((row.high - row.low) /
                    row.close) * 100
            );
        }
    }

    const observationVolatility = [];

    for (const row of observationRows) {
        if (
            isValidPrice(row.high) &&
            isValidPrice(row.low) &&
            isValidPrice(row.close)
        ) {
            observationVolatility.push(
                ((row.high - row.low) /
                    row.close) * 100
            );
        }
    }

    const baselineAverage =
        average(
            baselineVolatility
        );

    const observationAverage =
        average(
            observationVolatility
        );

    // --------------------------------------------------------
    // Genuine high/low data available
    // --------------------------------------------------------

    if (
        baselineAverage !== null &&
        observationAverage !== null
    ) {
        if (baselineAverage === 0) {
            return observationAverage === 0
                ? 100
                : 50;
        }

        const change =
            ((baselineAverage -
                observationAverage) /
                baselineAverage) * 100;

        return clamp(
            50 + change
        );
    }

    // --------------------------------------------------------
    // Fallback to close-to-close volatility
    // --------------------------------------------------------

    const baselineReturns =
        calculateReturns(
            baselineRows
        );

    const observationReturns =
        calculateReturns(
            observationRows
        );

    const baselineStd =
        standardDeviation(
            baselineReturns
        );

    let observationStd = null;

    if (observationReturns.length >= 2) {
        observationStd =
            standardDeviation(
                observationReturns
            );
    } else if (
        observationReturns.length === 1
    ) {
        observationStd =
            Math.abs(
                observationReturns[0]
            );
    }

    if (
        baselineStd === null ||
        observationStd === null
    ) {
        return null;
    }

    if (baselineStd === 0) {
        return observationStd === 0
            ? 100
            : 50;
    }

    const change =
        ((baselineStd - observationStd) /
            baselineStd) * 100;

    return clamp(
        50 + change
    );
}


function calculateVolumeScore(
    baselineRows,
    observationRows
) {
    if (
        baselineRows.length <
            REQUIRED_PRE_ADD_DAYS ||
        observationRows.length < 1
    ) {
        return null;
    }

    const baselineVolumes =
        baselineRows
            .map(
                row => row.volume
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    const observationVolumes =
        observationRows
            .map(
                row => row.volume
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    if (
        baselineVolumes.length === 0 ||
        observationVolumes.length === 0
    ) {
        return null;
    }

    const baselineAverage =
        average(
            baselineVolumes
        );

    const observationAverage =
        average(
            observationVolumes
        );

    if (
        !Number.isFinite(
            baselineAverage
        ) ||
        baselineAverage <= 0 ||
        !Number.isFinite(
            observationAverage
        )
    ) {
        return null;
    }

    const ratio =
        observationAverage /
        baselineAverage;

    /*
     * 0.5x = 25
     * 1.0x = 50
     * 1.5x = 75
     * 2.0x = 100
     */

    return clamp(
        ratio * 50
    );
}


function calculateSectorScore(sector) {
    if (
        sector &&
        String(sector).trim()
    ) {
        return 70;
    }

    return null;
}

    // ============================================================
// CONFIDENCE CALCULATOR
// ============================================================

// How much each factor counts. Must add up to 100.
// Missing factors (null) are skipped and the rest are re-scaled.
const COMPONENT_WEIGHTS = {
    momentum: 30,
    stability: 20,
    volatility: 20,
    volume: 15,
    sector: 15
};


// Used ONLY at 0/7, when no post-add days exist yet.
// Scores the stock from its 7 baseline days alone.
function calculateBaselineBreakdown(baselineRows, sector) {
    const first = baselineRows[0].close;
    const last = baselineRows[baselineRows.length - 1].close;

    // Baseline return: +10% over the week => 100, 0% => 50
    const momentum =
        isValidPrice(first) && isValidPrice(last)
            ? clamp(50 + ((last - first) / first) * 100 * 5)
            : null;

    // Lower day-to-day swing => higher score (5% std => 0)
    const returnsStd =
        standardDeviation(calculateReturns(baselineRows));

    const stability =
        returnsStd === null
            ? null
            : clamp(100 - returnsStd * 20);

    // Smaller daily high-low range => higher score (10% range => 0)
    const ranges = baselineRows
        .filter(r =>
            isValidPrice(r.high) &&
            isValidPrice(r.low) &&
            isValidPrice(r.close)
        )
        .map(r => ((r.high - r.low) / r.close) * 100);

    const avgRange = average(ranges);

    const volatility =
        avgRange === null
            ? null
            : clamp(100 - avgRange * 10);

    return {
        momentum,
        stability,
        volatility,
        volume: null, // needs post-add volume to compare against
        sector: calculateSectorScore(sector)
    };
}


function calculateConfidence({
    baselineRows,
    observationRows,
    sector
}) {
    const preAddDays = baselineRows.length;

    const observed =
        observationRows.slice(0, MAX_POST_ADD_DAYS);

    const postAddDays = observed.length;

    // Start from the empty shape so every field always exists
    const result = emptyConfidence();

    result.preAddDataDays = preAddDays;
    result.postAddDays = postAddDays;
    result.dataDays = postAddDays;

    
    // No full 7-day baseline => no real score (never fabricate one)
    if (preAddDays < REQUIRED_PRE_ADD_DAYS) {
        result.status = 'waiting_for_baseline';
        return result;
    }

    // 0/7 uses baseline-only scoring; 1/7+ compares baseline vs observation
    const raw =
        postAddDays === 0
            ? calculateBaselineBreakdown(baselineRows, sector)
            : {
                momentum: calculateMomentumScore(baselineRows, observed),
                stability: calculateStabilityScore(baselineRows, observed),
                volatility: calculateVolatilityScore(baselineRows, observed),
                volume: calculateVolumeScore(baselineRows, observed),
                sector: calculateSectorScore(sector)
            };

    // Weighted average over the factors that actually have a value
    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown = {};

    for (const [key, weight] of Object.entries(COMPONENT_WEIGHTS)) {
        const value = raw[key];

        if (Number.isFinite(value)) {
            breakdown[key] = Math.round(value);
            weightedSum += value * weight;
            totalWeight += weight;
        } else {
            breakdown[key] = null;
        }
    }

    // Nothing calculable => N/A, no snapshot will be saved
    if (totalWeight === 0) {
        result.status = 'waiting_for_baseline';
        return result;
    }

    const score = Math.round(weightedSum / totalWeight);

    result.score = score;
    result.breakdown = breakdown;
    result.sectorIncluded = breakdown.sector !== null;

    result.signal =
        score >= 70 ? 'strong'
        : score >= 50 ? 'moderate'
        : 'weak';

    // Gain since the last baseline close, only once post-add days exist
    if (postAddDays > 0) {
        const baseEnd = baselineRows[baselineRows.length - 1].close;
        const obsEnd = observed[observed.length - 1].close;

        result.stockGainPercent =
            round(((obsEnd - baseEnd) / baseEnd) * 100, 2);
    }

    // Finalize at 7/7 (only with a real score), then stop forever
    if (postAddDays >= MAX_POST_ADD_DAYS) {
        result.isFinal = true;
        result.status = 'complete';
        result.completedAt = new Date();
        result.finalDate = new Date();
    } else {
        result.status = 'observing';
    }

    return result;
}

// ============================================================
// EMPTY CONFIDENCE OBJECT
// ============================================================
function emptyConfidence() {
    return {
        score: null,
        signal: null,
        dataDays: 0,
        preAddDataDays: 0,
        postAddDays: 0,
        stockGainPercent: null,
        breakdown: {
            momentum: null,
            stability: null,
            volatility: null,
            volume: null,
            sector: null
        },
        sectorIncluded: false,
        status: 'waiting_for_baseline',
        isFinal: false
    };
}


// ============================================================
// WATCHLIST CONFIDENCE
// ============================================================
async function buildWatchlistConfidence(stock, userId) {
    const ticker = normalizeTicker(stock.ticker);
    const market = normalizeMarket(stock.market);

    // Pass market so the date uses the stock's own timezone
    const addedDate = dateOnly(stock.dateAdded, market);

    if (!addedDate) {
        return emptyConfidence();
    }

    // Finished cycles are never recalculated
    if (
        stock.confidenceLevel &&
        stock.confidenceLevel.isFinal === true
    ) {
        return stock.confidenceLevel.toObject
            ? stock.confidenceLevel.toObject()
            : stock.confidenceLevel;
    }

    const today = dateOnly(new Date(), market);

    let history = [];

    try {
        history = await getPriceHistory(ticker, 60, market);
    } catch (error) {
        console.error(
            `[Confidence] Failed history for ${ticker}:`,
            error.message
        );
    }

    // Only completed trading days (today is still in progress)
    const completedHistory =
        normalizeHistoryRows(history)
            .filter(row => row.date < today);

    const latestCompletedDate =
        completedHistory.length
            ? completedHistory[completedHistory.length - 1].date
            : null;

    // Up to 7 trading days before the add date
    const baselineRows =
        completedHistory
            .filter(row => row.date < addedDate)
            .slice(-REQUIRED_PRE_ADD_DAYS);

    // First 7 trading days after the add date
    const observationRows =
        completedHistory
            .filter(row => row.date > addedDate)
            .slice(0, MAX_POST_ADD_DAYS);

    console.log(
        `[Confidence] ${ticker}: ` +
        `${baselineRows.length}/7 baseline, ` +
        `${observationRows.length}/7 post-add`
    );

    // --------------------------------------------------------
    // Calculate EVERY stage: 0/7 up to what is available now.
    // Stage k uses the first k observation days.
    // Its snapshot date is the add date for 0/7, otherwise the
    // date of the k-th observation day. Because the date is part
    // of the unique key, re-running never creates duplicates and
    // any stages missed while the server was down get filled in.
    // --------------------------------------------------------
    const stages = [];

    for (let k = 0; k <= observationRows.length; k++) {
        stages.push({
            date: k === 0 ? addedDate : observationRows[k - 1].date,
            confidence: calculateConfidence({
                baselineRows,
                observationRows: observationRows.slice(0, k),
                sector: stock.sector
            })
        });
    }

    // The latest stage is the stock's current confidence
    const confidence = stages[stages.length - 1].confidence;

    // --------------------------------------------------------
    // Save snapshots (skip stages with no real score)
    // --------------------------------------------------------
    if (userId) {
        const ops = stages
            .filter(s => Number.isFinite(s.confidence.score))
            .map(({ date, confidence: c }) => ({
                updateOne: {
                    filter: { userId, ticker, market, date },
                    update: {
                        $set: {
                            score: c.score,
                            signal: c.signal,
                            dataDays: c.dataDays,
                            preAddDataDays: c.preAddDataDays,
                            postAddDays: c.postAddDays,
                            stockGainPercent: c.stockGainPercent,
                            breakdown: c.breakdown,
                            sectorIncluded: c.sectorIncluded,
                            isFinal: c.isFinal,
                            calculatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));

        if (ops.length) {
            try {
                await ConfidenceSnapshot.bulkWrite(
                    ops,
                    { ordered: false }
                );
            } catch (error) {
                // A snapshot failure must not block the live score
                console.error(
                    `[Confidence] Snapshot save failed for ${ticker}:`,
                    error.message
                );
            }
        }
    }

    // --------------------------------------------------------
    // Cycle metadata (AFTER the final state is known)
    // --------------------------------------------------------
    if (stock.confidenceCycle) {
        stock.confidenceCycle.postAddDays = confidence.postAddDays;
        stock.confidenceCycle.preAddDays = confidence.preAddDataDays;
        stock.confidenceCycle.finalScore = confidence.score;
        stock.confidenceCycle.isFinal = confidence.isFinal;

        if (confidence.isFinal) {
            stock.confidenceCycle.finalizedAt =
                stock.confidenceCycle.finalizedAt || new Date();
        }
    }

    if (latestCompletedDate) {
        stock.lastProcessedDate = latestCompletedDate;
    }

    return confidence;
}



// ============================================================
// UPDATE WATCHLIST CONFIDENCE
// ============================================================

async function updateWatchlistConfidence(
    portfolio,
    targetStock = null
) {
    if (!portfolio) {
        return false;
    }

    if (
        !Array.isArray(
            portfolio.watchlist
        )
    ) {
        return false;
    }

    let changed = false;

    const stocks =
        targetStock
            ? [targetStock]
            : portfolio.watchlist;

    for (
        const stock of stocks
    ) {
        if (!stock) {
            continue;
        }

        console.log(
            `[Confidence Debug] ${stock.ticker}:`,
            stock.confidenceLevel
        );

        // ----------------------------------------------------
        // Never touch frozen confidence
        // ----------------------------------------------------

        if (
            stock.confidenceLevel &&
            stock.confidenceLevel.isFinal === true
        ) {
            continue;
        }

        try {
            const confidence =
                await buildWatchlistConfidence(
                    stock,
                    portfolio.userId
                    );

            stock.confidenceLevel =
                confidence;

            changed = true;

            console.log(
                `✓ Confidence ${stock.ticker}: ` +
                `${
                    confidence.score !== null
                        ? confidence.score
                        : 'N/A'
                } ` +
                `(${confidence.preAddDataDays}/7 baseline, ` +
                `${confidence.postAddDays}/7 post-add)`
            );

        } catch (error) {
            console.error(
                `[Confidence] ${stock.ticker} failed:`,
                error.message
            );
        }
    }

    return changed;
}

// ============================================================
// GET REAL STOCK HISTORY
// ============================================================

router.get(
    '/stocks/history/:ticker',
    async (req, res) => {
        try {
            const ticker =
                normalizeTicker(
                    req.params.ticker
                );

            const market =
                normalizeMarket(
                    req.query.market
                );

            const requestedDays =
                Number(
                    req.query.days
                );

            const days =
                Number.isFinite(requestedDays) &&
                requestedDays > 0
                    ? Math.min(
                        Math.floor(requestedDays),
                        365
                    )
                    : 30;

            if (!ticker) {
                return res.status(400).json({
                    error:
                        'ticker is required'
                });
            }

            console.log(
                `[History] ${ticker} ${market} ` +
                `requesting ${days} days`
            );

            const history =
                await getPriceHistory(
                    ticker,
                    days,
                    market
                );

            const normalizedHistory =
                normalizeHistoryRows(
                    history
                );

            if (
                normalizedHistory.length === 0
            ) {
                return res.status(404).json({
                    error:
                        'No historical price data available',
                    ticker,
                    market
                });
            }

            console.log(
                `[History] ${ticker}: ` +
                `${normalizedHistory.length} real trading days`
            );

            res.json(
                normalizedHistory
            );

        } catch (error) {

            console.error(
                `[GET /stocks/history/${req.params.ticker}] Error:`,
                error
            );

            res.status(500).json({
                error:
                    'Failed to load stock history',

                message:
                    error.message
            });
        }
    }
);






// ============================================================
// GET PORTFOLIO
// ============================================================

router.get(
    '/:userId',
    async (req, res) => {
        try {
            const userId =
                req.params.userId;

            let portfolio =
                await Portfolio.findOne({
                    userId
                });

            // ------------------------------------------------
            // Create portfolio if it doesn't exist
            // ------------------------------------------------

            if (!portfolio) {
                portfolio =
                    new Portfolio({
                        userId,

                        stocks: [],

                        watchlist: [],

                        sold: [],

                        activity: [],

                        settings: {
                            goalAmount:
                                1000000,

                            displayCurrency:
                                'NGN'
                        }
                    });

                await portfolio.save();
            }

            // ------------------------------------------------
            // Refresh live prices
            // ------------------------------------------------

            const collections = [
                portfolio.stocks,
                portfolio.watchlist
            ];

            for (
                const collection of
                collections
            ) {
                if (
                    !Array.isArray(collection)
                ) {
                    continue;
                }

                for (
                    const stock of
                    collection
                ) {
                    if (!stock) {
                        continue;
                    }

                    try {
                        const ticker =
                            normalizeTicker(
                                stock.ticker
                            );

                        const market =
                            normalizeMarket(
                                stock.market
                            );

                        const currentPrice =
                            await getPrice(
                                ticker,
                                market
                            );

                        if (
                            isValidPrice(
                                currentPrice
                            )
                        ) {
                            stock.currentPrice =
                                Number(
                                    currentPrice
                                );
                        }

                    } catch (error) {
                        console.error(
                            `[Price] ${stock.ticker}:`,
                            error.message
                        );
                    }
                }
            }
// ------------------------------------------------
// Confidence
// ------------------------------------------------
//
// Confidence is calculated when a stock is added
// and updated by the appropriate write flow.
// Do NOT recalculate it during GET requests.
//
// This prevents duplicate confidence calculations
// whenever the frontend loads the portfolio.

            // ------------------------------------------------
            // Return clean JSON
            // ------------------------------------------------

            const result =
                portfolio.toObject();

            res.json({
                portfolio:
                    result.stocks || [],

                watchlist:
                    result.watchlist || [],

                sold:
                    result.sold || [],

                activity:
                    result.activity || [],

                settings:
                    result.settings || {}
            });

        } catch (error) {
            console.error(
                '[GET /:userId] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to load portfolio',

                message:
                    error.message
            });
        }
    }
);


// ============================================================
// ADD STOCK DIRECTLY TO PORTFOLIO
// ============================================================
//
// THIS ROUTE WAS MISSING FROM THE PREVIOUS VERSION.
//
// Frontend request:
// POST /api/portfolio/:userId/stocks
//
// Example body:
// {
//   ticker: "AMZN",
//   quantity: 5,
//   buyPrice: 250,
//   sector: "Technology",
//   notes: "...",
//   market: "US"
// }
//
// ============================================================

router.post(
    '/:userId/stocks',
    async (req, res) => {
        try {
            const userId =
                req.params.userId;

            const {
                ticker,
                quantity,
                buyPrice,
                sector,
                notes,
                market
            } = req.body;

            // ------------------------------------------------
            // Validate
            // ------------------------------------------------

            if (!ticker) {
                return res.status(400).json({
                    error:
                        'ticker is required'
                });
            }

            const normalizedTicker =
                normalizeTicker(
                    ticker
                );

            const normalizedMarket =
                normalizeMarket(
                    market
                );

            const numericQuantity =
                Number(quantity);

            const numericBuyPrice =
                Number(buyPrice);

            if (
                !Number.isFinite(
                    numericQuantity
                ) ||
                numericQuantity <= 0
            ) {
                return res.status(400).json({
                    error:
                        'quantity must be greater than 0'
                });
            }

            if (
                !Number.isFinite(
                    numericBuyPrice
                ) ||
                numericBuyPrice <= 0
            ) {
                return res.status(400).json({
                    error:
                        'buyPrice must be greater than 0'
                });
            }

            // ------------------------------------------------
            // Find/create portfolio
            // ------------------------------------------------

            let portfolio =
                await Portfolio.findOne({
                    userId
                });

            if (!portfolio) {
                portfolio =
                    new Portfolio({
                        userId
                    });
            }

            // ------------------------------------------------
            // Prevent duplicate stock
            // ------------------------------------------------

            const existingIndex =
                portfolio.stocks.findIndex(
                    stock =>
                        normalizeTicker(
                            stock.ticker
                        ) ===
                        normalizedTicker
                );

            if (
                existingIndex !== -1
            ) {
                return res.status(409).json({
                    error:
                        `${normalizedTicker} is already in your portfolio`
                });
            }

            // ------------------------------------------------
            // Get current market price
            // ------------------------------------------------

            let currentPrice = null;

            try {
                const livePrice =
                    await getPrice(
                        normalizedTicker,
                        normalizedMarket
                    );

                if (
                    isValidPrice(
                        livePrice
                    )
                ) {
                    currentPrice =
                        Number(
                            livePrice
                        );
                }
            } catch (error) {
                console.error(
                    `[Portfolio] Price failed for ${normalizedTicker}:`,
                    error.message
                );
            }

            // ------------------------------------------------
            // Add stock
            // ------------------------------------------------

            const dateAdded =
                new Date();

            const stock = {
                ticker:
                    normalizedTicker,

                quantity:
                    numericQuantity,

                buyPrice:
                    numericBuyPrice,

                currentPrice:
                    isValidPrice(
                        currentPrice
                    )
                        ? currentPrice
                        : numericBuyPrice,

                sector:
                    sector || null,

                notes:
                    notes || null,

                market:
                    normalizedMarket,

                confidenceLevel:
                    emptyConfidence(),

                dateAdded
            };

            portfolio.stocks.push(
                stock
            );

            // ------------------------------------------------
            // Activity
            // ------------------------------------------------

           portfolio.activity.push({
    type: 'invested',
    title: `${normalizedTicker} added to portfolio`,
    description: 'Stock added to your portfolio',
    ticker: normalizedTicker,
    date: dateAdded
});

            await portfolio.save();

            console.log(
                `✓ Added ${normalizedTicker} to portfolio`
            );

            res.status(201).json({
                success: true,

                message:
                    `${normalizedTicker} added to portfolio`,

                stock:
                    portfolio.stocks[
                        portfolio.stocks.length - 1
                    ]
            });

        } catch (error) {
            console.error(
                '[POST /:userId/stocks] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to add stock to portfolio',

                message:
                    error.message
            });
        }
    }
);


// ============================================================
// ADD TO WATCHLIST
// ============================================================
router.post(
    '/:userId/add-watchlist',
    async (req, res) => {
        try {
            const {
                ticker,
                sector,
                notes,
                market,
                watchingDuration
            } = req.body;

            const { userId } = req.params;

            if (
                !userId ||
                !ticker
            ) {
                return res.status(400).json({
                    error:
                        'userId and ticker are required'
                });
            }

            const normalizedTicker =
                normalizeTicker(
                    ticker
                );

            const normalizedMarket =
                normalizeMarket(
                    market
                );

            let portfolio =
                await Portfolio.findOne({
                    userId
                });

            if (!portfolio) {
                portfolio =
                    new Portfolio({
                        userId
                    });
            }

            // ------------------------------------------------
            // Prevent duplicate watchlist entries
            // ------------------------------------------------

            const alreadyWatching =
                portfolio.watchlist.some(
                    item =>
                        normalizeTicker(
                            item.ticker
                        ) ===
                        normalizedTicker
                );

            if (
                alreadyWatching
            ) {
                return res.status(409).json({
                    error:
                        `${normalizedTicker} is already in your watchlist`
                });
            }

                        // ------------------------------------------------
            // Start a clean cycle: clear any leftover snapshots
            // for this user + stock (e.g. from a removal that
            // happened through another path)
            // ------------------------------------------------
            await ConfidenceSnapshot.deleteMany({
                userId,
                ticker: normalizedTicker,
                market: normalizedMarket
            });

            // ------------------------------------------------
            // Get current price
            // ------------------------------------------------

            let currentPrice = null;

            try {
                currentPrice =
                    await getPrice(
                        normalizedTicker,
                        normalizedMarket
                    );
            } catch (error) {
                console.error(
                    `[Watchlist] Price failed for ${normalizedTicker}:`,
                    error.message
                );
            }

            const dateAdded =
                new Date();

            // ------------------------------------------------
            // Add watchlist item
            // ------------------------------------------------

            portfolio.watchlist.push({
                ticker:
                    normalizedTicker,

                currentPrice:
                    isValidPrice(
                        currentPrice
                    )
                        ? Number(
                            currentPrice
                        )
                        : null,

                priceAtAdd:
                    isValidPrice(
                        currentPrice
                    )
                        ? Number(
                            currentPrice
                        )
                        : null,

                watchingDuration:
                    [
                        '2d',
                        '1w',
                        '2w'
                    ].includes(
                        watchingDuration
                    )
                        ? watchingDuration
                        : '1w',

                sector:
                    sector || null,

                notes:
                    notes || null,

                market:
                    normalizedMarket,

                confidenceLevel:
                    emptyConfidence(),

                confidenceCycle: {
                    startedAt:
                        dateAdded,

                    preAddDays:
                        REQUIRED_PRE_ADD_DAYS,

                    postAddDays:
                        0,

                    finalScore:
                        null,

                    isFinal:
                        false,

                    finalizedAt:
                        null
                },

                dateAdded
            });

           portfolio.activity.push({
    type: 'watching',
    title: `${normalizedTicker} added to watchlist`,
    description: 'Now being monitored',
    ticker: normalizedTicker,
    date: dateAdded
});

            await portfolio.save();

            // ------------------------------------------------
            // Try initial confidence calculation
            // ------------------------------------------------

            const added =
    portfolio.watchlist[
        portfolio.watchlist.length - 1
    ];

try {
    await updateWatchlistConfidence(
        portfolio,
        added
    );

    await portfolio.save();

} catch (error) {
    console.error(
        '[Watchlist] Initial confidence update failed:',
        error.message
    );
}

res.status(201).json({
    success: true,
    watchlistItem:
        added
});

        } catch (error) {
            console.error(
                '[POST /add-watchlist] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to add stock to watchlist',

                message:
                    error.message
            });
        }
    }
);


// ============================================================
// WATCHLIST → PORTFOLIO
// ============================================================

// ============================================================
// MOVE WATCHLIST STOCK TO PORTFOLIO
// ============================================================

router.post(
    '/:userId/watchlist/:ticker/add-to-portfolio',
    async (req, res) => {
        try {
            const {
                userId,
                ticker
            } = req.params;

            const {
                quantity,
                buyPrice
            } = req.body;

            const normalizedTicker =
                normalizeTicker(ticker);

            const portfolio =
                await Portfolio.findOne({
                    userId
                });

            if (!portfolio) {
                return res.status(404).json({
                    error: 'Portfolio not found'
                });
            }

            const index =
                portfolio.watchlist.findIndex(
                    item =>
                        normalizeTicker(
                            item.ticker
                        ) === normalizedTicker
                );

            if (index === -1) {
                return res.status(404).json({
                    error:
                        'Stock not found in watchlist'
                });
            }

            const watched =
                portfolio.watchlist[index];

            const normalizedMarket =
                normalizeMarket(
                    watched.market
                );

            let finalBuyPrice =
                Number(buyPrice);

            if (!isValidPrice(finalBuyPrice)) {
                finalBuyPrice =
                    Number(
                        watched.currentPrice
                    );
            }

            if (!isValidPrice(finalBuyPrice)) {
                return res.status(400).json({
                    error:
                        'A valid buy price is required'
                });
            }

            let currentPrice =
                watched.currentPrice;

            try {
                const livePrice =
                    await getPrice(
                        normalizedTicker,
                        normalizedMarket
                    );

                if (isValidPrice(livePrice)) {
                    currentPrice =
                        Number(livePrice);
                }
            } catch (error) {
                console.error(
                    `[Move to Portfolio] ${normalizedTicker} live price failed:`,
                    error.message
                );
            }

            const confidence =
                watched.confidenceLevel
                    ? (
                        watched.confidenceLevel.toObject
                            ? watched.confidenceLevel.toObject()
                            : watched.confidenceLevel
                    )
                    : emptyConfidence();

            portfolio.stocks.push({
                ticker:
                    normalizedTicker,

                quantity:
                    Number(quantity) || 0,

                buyPrice:
                    finalBuyPrice,

                currentPrice:
                    isValidPrice(currentPrice)
                        ? currentPrice
                        : finalBuyPrice,

                sector:
                    watched.sector || null,

                notes:
                    watched.notes || null,

                market:
                    normalizedMarket,

                confidenceLevel:
                    confidence,

                dateAdded:
                    new Date()
            });

            portfolio.watchlist.splice(
                index,
                1
            );

            portfolio.activity.push({
                type: 'invested',
                title:
                    `${normalizedTicker} added to portfolio`,
                description:
                    'Moved from watchlist to portfolio',
                ticker:
                    normalizedTicker,
                date:
                    new Date()
            });

            await portfolio.save();

            res.json({
                success: true,

                message:
                    `${normalizedTicker} moved to portfolio`
            });

        } catch (error) {
            console.error(
                '[POST /:userId/watchlist/:ticker/add-to-portfolio] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to move stock to portfolio',

                message:
                    error.message
            });
        }
    }
);;

// ============================================================
// REMOVE FROM WATCHLIST
// ============================================================

router.post(
    '/:userId/remove-watchlist',
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { ticker } = req.body;

            const normalizedTicker = normalizeTicker(ticker);

            const portfolio =
                await Portfolio.findOne({ userId });

            if (!portfolio) {
                return res.status(404).json({
                    error: 'Portfolio not found'
                });
            }

            const index =
                portfolio.watchlist.findIndex(
                    item =>
                        normalizeTicker(item.ticker) ===
                        normalizedTicker
                );

            if (index === -1) {
                return res.status(404).json({
                    error: 'Stock not found in watchlist'
                });
            }

            const removed = portfolio.watchlist[index];

            // Read the market BEFORE splicing the item out
            const removedMarket = normalizeMarket(removed.market);

            portfolio.watchlist.splice(index, 1);

            portfolio.activity.push({
                type: 'rejected',
                title: `${normalizedTicker} rejected`,
                description: 'Removed from watchlist',
                ticker: normalizedTicker,
                date: new Date()
            });

            await portfolio.save();

            // Delete only THIS user's confidence history for this
            // stock. Done after save so history is never lost if the
            // removal itself fails. PriceHistory is left alone.
            await ConfidenceSnapshot.deleteMany({
                userId,
                ticker: normalizedTicker,
                market: removedMarket
            });

            res.json({
                success: true,
                removed
            });

        } catch (error) {
            console.error(
                '[POST /:userId/remove-watchlist] Error:',
                error
            );

            res.status(500).json({
                error: 'Failed to remove watchlist item',
                message: error.message
            });
        }
    }
);



// ============================================================
// SELL STOCK
// ============================================================
//
// Frontend request:
// POST /api/portfolio/:userId/sell-stock
//
// Body:
// {
//   ticker: "GTCO",
//   quantity: 10,
//   market: "NGX"
// }
//
// ============================================================

router.post(
    '/:userId/sell-stock',
    async (req, res) => {
        try {
            const {
                userId
            } = req.params;

            const {
                ticker,
                quantity,
                market
            } = req.body;

            // ------------------------------------------------
            // Validate request
            // ------------------------------------------------

            if (!ticker) {
                return res.status(400).json({
                    error:
                        'ticker is required'
                });
            }

            const normalizedTicker =
                normalizeTicker(ticker);

            const normalizedMarket =
                normalizeMarket(market);

            const sellQuantity =
                Number(quantity);

            if (
                !Number.isFinite(
                    sellQuantity
                ) ||
                sellQuantity <= 0
            ) {
                return res.status(400).json({
                    error:
                        'quantity must be greater than 0'
                });
            }

            // ------------------------------------------------
            // Find portfolio
            // ------------------------------------------------

            const portfolio =
                await Portfolio.findOne({
                    userId
                });

            if (!portfolio) {
                return res.status(404).json({
                    error:
                        'Portfolio not found'
                });
            }

            // ------------------------------------------------
            // Find stock
            // ------------------------------------------------

            const stockIndex =
                portfolio.stocks.findIndex(
                    stock =>
                        normalizeTicker(
                            stock.ticker
                        ) === normalizedTicker &&
                        normalizeMarket(
                            stock.market
                        ) === normalizedMarket
                );

            if (stockIndex === -1) {
                return res.status(404).json({
                    error:
                        `${normalizedTicker} is not in your portfolio`
                });
            }

            const stock =
                portfolio.stocks[stockIndex];

            const ownedQuantity =
                Number(stock.quantity);

            if (
                !Number.isFinite(
                    ownedQuantity
                ) ||
                ownedQuantity <= 0
            ) {
                return res.status(400).json({
                    error:
                        'Invalid portfolio quantity'
                });
            }

            // ------------------------------------------------
            // Cannot sell more than owned
            // ------------------------------------------------

            if (
                sellQuantity >
                ownedQuantity
            ) {
                return res.status(400).json({
                    error:
                        `You only own ${ownedQuantity} shares of ${normalizedTicker}`
                });
            }

            // ------------------------------------------------
            // Get current market price
            // ------------------------------------------------

            let sellPrice =
                Number(
                    stock.currentPrice
                );

            try {
                const livePrice =
                    await getPrice(
                        normalizedTicker,
                        normalizedMarket
                    );

                if (
                    isValidPrice(
                        livePrice
                    )
                ) {
                    sellPrice =
                        Number(
                            livePrice
                        );
                }
            } catch (error) {
                console.error(
                    `[Sell] Price failed for ${normalizedTicker}:`,
                    error.message
                );
            }

            // ------------------------------------------------
            // Require a valid selling price
            // ------------------------------------------------

            if (
                !isValidPrice(
                    sellPrice
                )
            ) {
                return res.status(400).json({
                    error:
                        'Unable to determine a valid sell price'
                });
            }

            const buyPrice =
                Number(
                    stock.buyPrice
                );

            if (
                !isValidPrice(
                    buyPrice
                )
            ) {
                return res.status(400).json({
                    error:
                        'Invalid buy price'
                });
            }

            // ------------------------------------------------
            // Create sold record
            // ------------------------------------------------

            const soldRecord = {
                ticker:
                    normalizedTicker,

                quantity:
                    sellQuantity,

                buyPrice:
                    buyPrice,

                sellPrice:
                    sellPrice,

                market:
                    normalizedMarket
            };

            portfolio.sold.push(
                soldRecord
            );

            // ------------------------------------------------
            // Update portfolio holding
            // ------------------------------------------------

            const remainingQuantity =
                ownedQuantity -
                sellQuantity;

            if (
                remainingQuantity <= 0
            ) {
                // Entire position sold
                portfolio.stocks.splice(
                    stockIndex,
                    1
                );
            } else {
                // Partial sale
                stock.quantity =
                    remainingQuantity;
            }

            // ------------------------------------------------
            // Activity
            // ------------------------------------------------

            portfolio.activity.push({
                type: 'sold',

                title:
                    `${normalizedTicker} sold`,

                description:
                    `${sellQuantity} shares sold at ${sellPrice}`,

                ticker:
                    normalizedTicker,

                date:
                    new Date()
            });

            // ------------------------------------------------
            // Save
            // ------------------------------------------------

            await portfolio.save();

            console.log(
                `✓ Sold ${sellQuantity} ${normalizedTicker} at ${sellPrice}`
            );

            // ------------------------------------------------
            // Response
            // ------------------------------------------------

            res.json({
                success: true,

                message:
                    `${normalizedTicker} sold successfully`,

                sold:
                    soldRecord,

                remainingQuantity:
                    remainingQuantity
            });

        } catch (error) {
            console.error(
                '[POST /:userId/sell-stock] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to sell stock',

                message:
                    error.message
            });
        }
    }
);



// ============================================================
// EDIT STOCK
// ============================================================
//
// Frontend request:
// POST /api/portfolio/:userId/edit-stock
//
// Body:
// {
//   ticker: "GTCO",
//   market: "NGX",
//   quantity: 100,
//   buyPrice: 130
// }
//
// Only quantity and buyPrice are changed.
// Existing price, confidence, dateAdded, sector, etc. remain intact.
//
// ============================================================

router.post(
    '/:userId/edit-stock',
    async (req, res) => {
        try {
            const {
                userId
            } = req.params;

            const {
                ticker,
                market,
                quantity,
                buyPrice
            } = req.body;

            // ------------------------------------------------
            // Validate request
            // ------------------------------------------------

            if (!ticker) {
                return res.status(400).json({
                    error:
                        'ticker is required'
                });
            }

            const normalizedTicker =
                normalizeTicker(ticker);

            const normalizedMarket =
                normalizeMarket(market);

            const newQuantity =
                Number(quantity);

            const newBuyPrice =
                Number(buyPrice);

            if (
                !Number.isFinite(
                    newQuantity
                ) ||
                newQuantity <= 0
            ) {
                return res.status(400).json({
                    error:
                        'quantity must be greater than 0'
                });
            }

            if (
                !Number.isFinite(
                    newBuyPrice
                ) ||
                newBuyPrice <= 0
            ) {
                return res.status(400).json({
                    error:
                        'buyPrice must be greater than 0'
                });
            }

            // ------------------------------------------------
            // Find portfolio
            // ------------------------------------------------

            const portfolio =
                await Portfolio.findOne({
                    userId
                });

            if (!portfolio) {
                return res.status(404).json({
                    error:
                        'Portfolio not found'
                });
            }

            // ------------------------------------------------
            // Find stock
            // ------------------------------------------------

            const stock =
                portfolio.stocks.find(
                    item =>
                        normalizeTicker(
                            item.ticker
                        ) === normalizedTicker &&
                        normalizeMarket(
                            item.market
                        ) === normalizedMarket
                );

            if (!stock) {
                return res.status(404).json({
                    error:
                        `${normalizedTicker} is not in your portfolio`
                });
            }

            // ------------------------------------------------
            // Update ONLY editable fields
            // ------------------------------------------------

            stock.quantity =
                newQuantity;

            stock.buyPrice =
                newBuyPrice;

            // ------------------------------------------------
            // Activity
            // ------------------------------------------------

            portfolio.activity.push({
                type: 'invested',

                title:
                    `${normalizedTicker} position updated`,

                description:
                    'Quantity and average buy price updated',

                ticker:
                    normalizedTicker,

                date:
                    new Date()
            });

            // ------------------------------------------------
            // Save
            // ------------------------------------------------

            await portfolio.save();

            console.log(
                `✓ Edited ${normalizedTicker}: ` +
                `${newQuantity} shares @ ${newBuyPrice}`
            );

            // ------------------------------------------------
            // Response
            // ------------------------------------------------

            res.json({
                success: true,

                message:
                    `${normalizedTicker} updated successfully`,

                stock
            });

        } catch (error) {
            console.error(
                '[POST /:userId/edit-stock] Error:',
                error
            );

            res.status(500).json({
                error:
                    'Failed to update stock',

                message:
                    error.message
            });
        }
    }
);

// ============================================================
// EXPORT
// ============================================================

router.updateWatchlistConfidence =
    updateWatchlistConfidence;

module.exports = router;