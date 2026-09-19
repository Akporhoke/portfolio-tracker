const express = require('express');
const router = express.Router();

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
        baselineRows.length <
            REQUIRED_PRE_ADD_DAYS ||
        observationRows.length < 1
    ) {
        return null;
    }

    const baselineStart =
        baselineRows[0].close;

    const baselineEnd =
        baselineRows[
            baselineRows.length - 1
        ].close;

    const observationStart =
        observationRows[0].close;

    const observationEnd =
        observationRows[
            observationRows.length - 1
        ].close;

    if (
        !isValidPrice(baselineStart) ||
        !isValidPrice(baselineEnd) ||
        !isValidPrice(observationStart) ||
        !isValidPrice(observationEnd)
    ) {
        return null;
    }

    const baselineReturn =
        ((baselineEnd - baselineStart) /
            baselineStart) * 100;

    const observationReturn =
        ((observationEnd - observationStart) /
            observationStart) * 100;

    const improvement =
        observationReturn -
        baselineReturn;

    /*
     * Rough interpretation:
     *
     * -10% improvement = 0
     *   0% improvement = 50
     * +10% improvement = 100
     */

    return clamp(
        50 + (improvement * 5)
    );
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

function calculateConfidence({
    baselineRows,
    observationRows,
    sector
}) {
    const preAddDataDays =
        baselineRows.length;

    const postAddDays =
        Math.min(
            observationRows.length,
            MAX_POST_ADD_DAYS
        );

    // --------------------------------------------------------
    // Not enough baseline data
    // --------------------------------------------------------

    if (
        preAddDataDays <
        REQUIRED_PRE_ADD_DAYS
    ) {
        return {
            score: null,
            signal: null,

            dataDays: 0,

            preAddDataDays,

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

            status:
                'waiting_for_baseline',

            confidenceStage:
                'waiting',

            isFinal: false
        };
    }

    // --------------------------------------------------------
    // BASELINE-ONLY SCORE
    //
    // At 7/7 baseline and 0/7 observation days,
    // Gaze creates an initial score from real historical data.
    // --------------------------------------------------------

    const baselineStart =
        baselineRows[0]?.close;

    const baselineEnd =
        baselineRows[
            baselineRows.length - 1
        ]?.close;

    let baselineMomentum = null;

    if (
        isValidPrice(baselineStart) &&
        isValidPrice(baselineEnd)
    ) {
        const baselineReturn =
            (
                (baselineEnd -
                    baselineStart) /
                baselineStart
            ) * 100;

        baselineMomentum =
            clamp(
                50 +
                (baselineReturn * 5)
            );
    }

    // --------------------------------------------------------
    // Historical stability
    // --------------------------------------------------------

    let baselineStability = null;

    const baselineReturns =
        calculateReturns(
            baselineRows
        );

    if (
        baselineReturns.length >= 2
    ) {
        const baselineStd =
            standardDeviation(
                baselineReturns
            );

        if (
            Number.isFinite(
                baselineStd
            )
        ) {
            /*
             * Lower historical volatility =
             * higher stability score.
             *
             * 0% volatility = 100
             * 5% volatility = 50
             * 10% volatility = 0
             */

            baselineStability =
                clamp(
                    100 -
                    (baselineStd * 10)
                );
        }
    }

    // --------------------------------------------------------
    // Historical volatility
    // --------------------------------------------------------

    let baselineVolatilityScore =
        null;

    const baselineVolatility = [];

    for (
        const row of baselineRows
    ) {
        if (
            isValidPrice(row.high) &&
            isValidPrice(row.low) &&
            isValidPrice(row.close)
        ) {
            baselineVolatility.push(
                (
                    (row.high -
                        row.low) /
                    row.close
                ) * 100
            );
        }
    }

    const baselineAverageVolatility =
        average(
            baselineVolatility
        );

    if (
        Number.isFinite(
            baselineAverageVolatility
        )
    ) {
        /*
         * Lower volatility =
         * higher score.
         *
         * 0% = 100
         * 5% = 50
         * 10%+ = 0
         */

        baselineVolatilityScore =
            clamp(
                100 -
                (
                    baselineAverageVolatility *
                    10
                )
            );
    }

    // --------------------------------------------------------
    // Historical volume
    // --------------------------------------------------------

    let baselineVolumeScore =
        null;

    const baselineVolumes =
        baselineRows
            .map(
                row =>
                    Number(row.volume)
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    if (
        baselineVolumes.length > 0
    ) {
        /*
         * For the initial score we don't yet
         * have post-add volume to compare against.
         *
         * A valid historical volume record
         * therefore receives a neutral score.
         *
         * This is not fabricated market data;
         * it simply means volume cannot yet
         * provide directional evidence.
         */

        baselineVolumeScore = 50;
    }

    // --------------------------------------------------------
    // Sector
    // --------------------------------------------------------

    const sectorScore =
        calculateSectorScore(
            sector
        );

    // --------------------------------------------------------
    // INITIAL SCORE
    // --------------------------------------------------------

    if (
        postAddDays === 0
    ) {
        const components = [];

        if (
            baselineMomentum !== null
        ) {
            components.push({
                value:
                    baselineMomentum,
                weight: 0.30
            });
        }

        if (
            baselineStability !== null
        ) {
            components.push({
                value:
                    baselineStability,
                weight: 0.25
            });
        }

        if (
            baselineVolatilityScore !==
            null
        ) {
            components.push({
                value:
                    baselineVolatilityScore,
                weight: 0.20
            });
        }

        if (
            baselineVolumeScore !==
            null
        ) {
            components.push({
                value:
                    baselineVolumeScore,
                weight: 0.15
            });
        }

        if (
            sectorScore !== null
        ) {
            components.push({
                value:
                    sectorScore,
                weight: 0.10
            });
        }

        let score = null;

        if (
            components.length > 0
        ) {
            const totalWeight =
                components.reduce(
                    (sum, item) =>
                        sum +
                        item.weight,
                    0
                );

            score =
                components.reduce(
                    (sum, item) =>
                        sum +
                        (
                            item.value *
                            item.weight
                        ),
                    0
                ) /
                totalWeight;
        }

        let signal = null;

        if (score !== null) {
            if (score >= 80) {
                signal = 'strong';
            } else if (score >= 65) {
                signal = 'positive';
            } else if (score >= 50) {
                signal = 'neutral';
            } else if (score >= 35) {
                signal = 'weak';
            } else {
                signal = 'negative';
            }
        }

        return {
            score:
                score !== null
                    ? round(score, 2)
                    : null,

            signal,

            dataDays: 0,

            preAddDataDays,

            postAddDays: 0,

            stockGainPercent: null,

            breakdown: {
                momentum:
                    baselineMomentum !== null
                        ? round(
                            baselineMomentum,
                            2
                        )
                        : null,

                stability:
                    baselineStability !== null
                        ? round(
                            baselineStability,
                            2
                        )
                        : null,

                volatility:
                    baselineVolatilityScore !==
                    null
                        ? round(
                            baselineVolatilityScore,
                            2
                        )
                        : null,

                volume:
                    baselineVolumeScore !==
                    null
                        ? round(
                            baselineVolumeScore,
                            2
                        )
                        : null,

                sector:
                    sectorScore !== null
                        ? round(
                            sectorScore,
                            2
                        )
                        : null
            },

            sectorIncluded:
                sectorScore !== null,

            status:
                'observing',

            confidenceStage:
                'initial',

            isFinal: false
        };
    }

    // --------------------------------------------------------
    // PROGRESSIVE OBSERVATION SCORE
    // --------------------------------------------------------

    const momentum =
        calculateMomentumScore(
            baselineRows,
            observationRows
        );

    const stability =
        calculateStabilityScore(
            baselineRows,
            observationRows
        );

    const volatility =
        calculateVolatilityScore(
            baselineRows,
            observationRows
        );

    const volume =
        calculateVolumeScore(
            baselineRows,
            observationRows
        );

    // --------------------------------------------------------
    // Build observed components
    // --------------------------------------------------------

    const components = [];

    if (momentum !== null) {
        components.push({
            value: momentum,
            weight: 0.30
        });
    }

    if (stability !== null) {
        components.push({
            value: stability,
            weight: 0.25
        });
    }

    if (volatility !== null) {
        components.push({
            value: volatility,
            weight: 0.20
        });
    }

    if (volume !== null) {
        components.push({
            value: volume,
            weight: 0.15
        });
    }

    if (sectorScore !== null) {
        components.push({
            value: sectorScore,
            weight: 0.10
        });
    }

    let observedScore = null;

    if (
        components.length > 0
    ) {
        const totalWeight =
            components.reduce(
                (sum, item) =>
                    sum +
                    item.weight,
                0
            );

        observedScore =
            components.reduce(
                (sum, item) =>
                    sum +
                    (
                        item.value *
                        item.weight
                    ),
                0
            ) /
            totalWeight;
    }

    // --------------------------------------------------------
    // Recreate initial score so the transition
    // remains continuous.
    // --------------------------------------------------------

    const initialComponents = [];

    if (
        baselineMomentum !== null
    ) {
        initialComponents.push({
            value:
                baselineMomentum,
            weight: 0.30
        });
    }

    if (
        baselineStability !== null
    ) {
        initialComponents.push({
            value:
                baselineStability,
            weight: 0.25
        });
    }

    if (
        baselineVolatilityScore !==
        null
    ) {
        initialComponents.push({
            value:
                baselineVolatilityScore,
            weight: 0.20
        });
    }

    if (
        baselineVolumeScore !==
        null
    ) {
        initialComponents.push({
            value:
                baselineVolumeScore,
            weight: 0.15
        });
    }

    if (
        sectorScore !== null
    ) {
        initialComponents.push({
            value:
                sectorScore,
            weight: 0.10
        });
    }

    let initialScore = null;

    if (
        initialComponents.length > 0
    ) {
        const totalWeight =
            initialComponents.reduce(
                (sum, item) =>
                    sum +
                    item.weight,
                0
            );

        initialScore =
            initialComponents.reduce(
                (sum, item) =>
                    sum +
                    (
                        item.value *
                        item.weight
                    ),
                0
            ) /
            totalWeight;
    }

    // --------------------------------------------------------
    // Progressive weighting
    //
    // 1/7 = 90% historical / 10% observed
    // 2/7 = 80% historical / 20% observed
    // ...
    // 7/7 = 0% historical / 100% observed
    // --------------------------------------------------------

    let score = null;

    if (
        initialScore !== null &&
        observedScore !== null
    ) {
        const observationWeight =
            postAddDays /
            MAX_POST_ADD_DAYS;

        const historicalWeight =
            1 -
            observationWeight;

        score =
            (
                initialScore *
                historicalWeight
            ) +
            (
                observedScore *
                observationWeight
            );
    } else if (
        observedScore !== null
    ) {
        score =
            observedScore;
    } else if (
        initialScore !== null
    ) {
        score =
            initialScore;
    }

    // --------------------------------------------------------
    // Gain since first observed trading day
    // --------------------------------------------------------

    let stockGainPercent = null;

    if (
        observationRows.length >= 1 &&
        isValidPrice(
            observationRows[0].close
        )
    ) {
        const firstPrice =
            observationRows[0].close;

        const latestPrice =
            observationRows[
                observationRows.length - 1
            ].close;

        if (
            isValidPrice(latestPrice)
        ) {
            stockGainPercent =
                round(
                    (
                        (
                            latestPrice -
                            firstPrice
                        ) /
                        firstPrice
                    ) * 100,
                    2
                );
        }
    }

    // --------------------------------------------------------
    // Signal
    // --------------------------------------------------------

    let signal = null;

    if (score !== null) {
        if (score >= 80) {
            signal = 'strong';
        } else if (score >= 65) {
            signal = 'positive';
        } else if (score >= 50) {
            signal = 'neutral';
        } else if (score >= 35) {
            signal = 'weak';
        } else {
            signal = 'negative';
        }
    }

    // --------------------------------------------------------
    // Final state
    // --------------------------------------------------------

    const isFinal =
        postAddDays >=
        MAX_POST_ADD_DAYS;

    return {
        score:
            score !== null
                ? round(score, 2)
                : null,

        signal,

        dataDays:
            postAddDays,

        preAddDataDays,

        postAddDays,

        stockGainPercent,

        breakdown: {
            momentum:
                momentum !== null
                    ? round(
                        momentum,
                        2
                    )
                    : baselineMomentum !== null
                        ? round(
                            baselineMomentum,
                            2
                        )
                        : null,

            stability:
                stability !== null
                    ? round(
                        stability,
                        2
                    )
                    : baselineStability !== null
                        ? round(
                            baselineStability,
                            2
                        )
                        : null,

            volatility:
                volatility !== null
                    ? round(
                        volatility,
                        2
                    )
                    : baselineVolatilityScore !==
                      null
                        ? round(
                            baselineVolatilityScore,
                            2
                        )
                        : null,

            volume:
                volume !== null
                    ? round(
                        volume,
                        2
                    )
                    : baselineVolumeScore !==
                      null
                        ? round(
                            baselineVolumeScore,
                            2
                        )
                        : null,

            sector:
                sectorScore !== null
                    ? round(
                        sectorScore,
                        2
                    )
                    : null
        },

        sectorIncluded:
            sectorScore !== null,

        status:
            isFinal
                ? 'complete'
                : 'observing',

        confidenceStage:
            isFinal
                ? 'final'
                : 'progressive',

        isFinal
    };
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

        status:
            'waiting_for_baseline',

        isFinal: false
    };
}


// ============================================================
// WATCHLIST CONFIDENCE
// ============================================================

async function buildWatchlistConfidence(stock) {
    const ticker =
        normalizeTicker(
            stock.ticker
        );

    const market =
        normalizeMarket(
            stock.market
        );

    const addedDate =
        dateOnly(
            stock.dateAdded
        );

    if (!addedDate) {
        return emptyConfidence();
    }

    // --------------------------------------------------------
    // NEVER recalculate completed confidence
    // --------------------------------------------------------

    if (
        stock.confidenceLevel &&
        stock.confidenceLevel.isFinal === true
    ) {
        return stock.confidenceLevel.toObject
            ? stock.confidenceLevel.toObject()
            : stock.confidenceLevel;
    }

    /*
     * Use the current completed calendar date.
     *
     * Only rows strictly before this date are used so
     * today's potentially incomplete candle is excluded.
     */

    const today = dateOnly(new Date(), market);

    let history = [];

    try {
        /*
         * We deliberately request a large enough window to
         * contain BOTH:
         *
         *   7 trading days before the stock was added
         *
         *   +
         *
         *   7 trading days after the stock was added
         *
         * This is critical for progressive observation.
         */

        history =
            await getPriceHistory(
                ticker,
                60,
                market
            );

    } catch (error) {
        console.error(
            `[Confidence] Failed history for ${ticker}:`,
            error.message
        );
    }

    const allHistory =
        normalizeHistoryRows(
            history
        );

    // --------------------------------------------------------
    // Only completed trading days
    // --------------------------------------------------------

    const completedHistory =
        allHistory.filter(
            row =>
                row.date < today
        );

    console.log(
        `[Confidence] ${ticker} ` +
        `addedDate=${addedDate}, ` +
        `today=${today}, ` +
        `history=${completedHistory.length}`
    );

    // --------------------------------------------------------
    // EXACTLY 7 TRADING DAYS BEFORE ADD
    // --------------------------------------------------------

    const baselineRows =
        completedHistory
            .filter(
                row =>
                    row.date < addedDate
            )
            .slice(
                -REQUIRED_PRE_ADD_DAYS
            );

    // --------------------------------------------------------
    // FIRST 7 TRADING DAYS AFTER ADD
    // --------------------------------------------------------

    const observationRows =
        completedHistory
            .filter(
                row =>
                    row.date > addedDate
            )
            .slice(
                0,
                MAX_POST_ADD_DAYS
            );

    console.log(
        `[Confidence] ${ticker}: ` +
        `${baselineRows.length}/7 baseline, ` +
        `${observationRows.length}/7 post-add`
    );

    if (baselineRows.length) {
        console.log(
            `  ↳ Baseline: ` +
            `${baselineRows[0].date} → ` +
            `${baselineRows[
                baselineRows.length - 1
            ].date}`
        );
    }

    if (observationRows.length) {
        console.log(
            `  ↳ Observation: ` +
            `${observationRows[0].date} → ` +
            `${observationRows[
                observationRows.length - 1
            ].date}`
        );
    }

    const confidence =
        calculateConfidence({
            baselineRows,
            observationRows,
            sector:
                stock.sector
        });

    // --------------------------------------------------------
    // Update confidence cycle metadata
    // --------------------------------------------------------

    if (
        stock.confidenceCycle
    ) {
        stock.confidenceCycle.postAddDays =
            confidence.postAddDays;

        stock.confidenceCycle.preAddDays =
            confidence.preAddDataDays;

        stock.confidenceCycle.finalScore =
            confidence.score;

        stock.confidenceCycle.isFinal =
            confidence.isFinal;

        if (
            confidence.isFinal
        ) {
            stock.confidenceCycle.finalizedAt =
                stock.confidenceCycle.finalizedAt ||
                new Date();
        }
    }
// --------------------------------------------------------
// FREEZE AFTER DAY 7
// --------------------------------------------------------

if (
    confidence.postAddDays >=
    MAX_POST_ADD_DAYS
) {
    confidence.postAddDays =
        MAX_POST_ADD_DAYS;

    confidence.dataDays =
        MAX_POST_ADD_DAYS;

    confidence.status =
        'complete';

    confidence.isFinal =
        true;

    confidence.completedAt =
    confidence.completedAt ||
    new Date();

confidence.finalDate =
    confidence.finalDate ||
    new Date();
}

return confidence;
}


// ============================================================
// UPDATE WATCHLIST CONFIDENCE
// ============================================================

async function updateWatchlistConfidence(
    portfolio
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

    for (
        const stock of
        portfolio.watchlist
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
                    stock
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

            try {
                await updateWatchlistConfidence(
                    portfolio
                );

                await portfolio.save();

            } catch (error) {
                console.error(
                    '[Watchlist] Initial confidence update failed:',
                    error.message
                );
            }

            const added =
                portfolio.watchlist[
                    portfolio.watchlist.length - 1
                ];

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

// ============================================================
// REMOVE FROM WATCHLIST
// ============================================================

router.post(
    '/:userId/remove-watchlist',
    async (req, res) => {
        try {
            const {
                userId
            } = req.params;

            const {
                ticker
            } = req.body;

            const normalizedTicker =
                normalizeTicker(ticker);

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

            const removed =
                portfolio.watchlist[index];

            portfolio.watchlist.splice(
                index,
                1
            );

            portfolio.activity.push({
                type: 'rejected',
                title:
                    `${normalizedTicker} rejected`,
                description:
                    'Removed from watchlist',
                ticker:
                    normalizedTicker,
                date:
                    new Date()
            });

            await portfolio.save();

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
                error:
                    'Failed to remove watchlist item',

                message:
                    error.message
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

module.exports = router;