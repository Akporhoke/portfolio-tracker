/*
 * GAZE CONFIDENCE ENGINE
 *
 * 7 REAL TRADING DAYS BEFORE ADD
 * +
 * 1-7 REAL TRADING DAYS AFTER ADD
 *
 * Score recalculates progressively.
 *
 * On post-add day 7:
 *
 *     score = FINAL
 *     isFinal = true
 *
 * It never changes again for that observation cycle.
 */

const PRE_ADD_DAYS = 7;
const POST_ADD_DAYS = 7;

const WEIGHTS = {
    momentum: 0.30,
    stability: 0.25,
    volatility: 0.20,
    volume: 0.15,
    sector: 0.10
};

function clamp(value, min = 0, max = 100) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function round(value, decimals = 2) {
    if (!Number.isFinite(value)) {
        return null;
    }

    const multiplier =
        Math.pow(10, decimals);

    return Math.round(
        value * multiplier
    ) / multiplier;
}

function average(values) {

    const valid =
        values.filter(
            Number.isFinite
        );

    if (!valid.length) {
        return null;
    }

    return (
        valid.reduce(
            (sum, value) =>
                sum + value,
            0
        ) /
        valid.length
    );
}

function standardDeviation(values) {

    const valid =
        values.filter(
            Number.isFinite
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
        ) /
        valid.length;

    return Math.sqrt(variance);
}

/*
 * Percentage returns between consecutive closes.
 */
function returns(history) {

    const result = [];

    for (
        let i = 1;
        i < history.length;
        i++
    ) {

        const previous =
            Number(
                history[i - 1]?.close
            );

        const current =
            Number(
                history[i]?.close
            );

        if (
            previous > 0 &&
            current > 0
        ) {

            result.push(
                ((current - previous) /
                    previous) *
                100
            );
        }
    }

    return result;
}

/*
 * TREND
 *
 * Measures how consistently price moves upward
 * or downward across the available period.
 */
function calculateMomentum(
    pre,
    post
) {

    if (
        pre.length < PRE_ADD_DAYS ||
        post.length < 1
    ) {
        return null;
    }

    const preFirst =
        Number(pre[0].close);

    const preLast =
        Number(
            pre[pre.length - 1].close
        );

    const postLast =
        Number(
            post[post.length - 1].close
        );

    if (
        !Number.isFinite(preFirst) ||
        !Number.isFinite(preLast) ||
        !Number.isFinite(postLast) ||
        preFirst <= 0 ||
        preLast <= 0 ||
        postLast <= 0
    ) {
        return null;
    }

    const baselineReturn =
        ((preLast - preFirst) /
            preFirst) *
        100;

    const postReturn =
        ((postLast - preLast) /
            preLast) *
        100;

    /*
     * Positive post performance improves confidence.
     * Negative performance reduces it.
     */
    const improvement =
        postReturn -
        baselineReturn;

    /*
     * Map approximately:
     *
     * -10% improvement → 0
     *   0% improvement → 50
     * +10% improvement → 100
     */
    return clamp(
        50 +
        improvement * 5
    );
}

/*
 * STABILITY
 *
 * Lower day-to-day variation = higher stability.
 */
function calculateStability(
    pre,
    post
) {

    const preReturns =
        returns(pre);

    const postReturns =
        returns(post);

    if (
        preReturns.length < 2
    ) {
        return null;
    }

    const baselineVol =
        standardDeviation(
            preReturns
        );

    const observedVol =
        postReturns.length >= 2
            ? standardDeviation(
                postReturns
            )
            : baselineVol;

    if (
        !Number.isFinite(baselineVol) ||
        !Number.isFinite(observedVol)
    ) {
        return null;
    }

    if (baselineVol === 0) {
        return 100;
    }

    const change =
        observedVol /
        baselineVol;

    /*
     * Same volatility = 70
     * Lower volatility = higher score
     * Higher volatility = lower score
     */
    return clamp(
        70 -
        ((change - 1) * 50)
    );
}

/*
 * VOLATILITY
 *
 * Uses real high/low/close data when available.
 * Falls back to close-to-close movement where
 * high/low aren't available.
 */
function calculateVolatility(
    pre,
    post
) {

    const all =
        [...pre, ...post];

    if (all.length < 2) {
        return null;
    }

    const values =
        [];

    for (
        let i = 0;
        i < all.length;
        i++
    ) {

        const item =
            all[i];

        const high =
            Number(item.high);

        const low =
            Number(item.low);

        const close =
            Number(item.close);

        if (
            high > 0 &&
            low > 0 &&
            close > 0
        ) {

            values.push(
                ((high - low) /
                    close) *
                100
            );

        } else if (
            i > 0
        ) {

            const previous =
                Number(
                    all[i - 1].close
                );

            if (
                previous > 0 &&
                close > 0
            ) {

                values.push(
                    Math.abs(
                        ((close -
                            previous) /
                            previous) *
                        100
                    )
                );
            }
        }
    }

    if (!values.length) {
        return null;
    }

    const averageVol =
        average(values);

    /*
     * Lower volatility is treated
     * as stronger confidence.
     *
     * 0%   → 100
     * 5%   → 50
     * 10%+ → 0
     */
    return clamp(
        100 -
        averageVol * 10
    );
}

/*
 * VOLUME
 *
 * Compare post-add volume against
 * the 7-day pre-add average.
 */
function calculateVolume(
    pre,
    post
) {

    const preVolumes =
        pre
            .map(
                item =>
                    Number(item.volume)
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    const postVolumes =
        post
            .map(
                item =>
                    Number(item.volume)
            )
            .filter(
                value =>
                    Number.isFinite(value) &&
                    value > 0
            );

    /*
     * If the provider doesn't supply volume,
     * do not invent it.
     */
    if (
        preVolumes.length < 3 ||
        postVolumes.length < 1
    ) {
        return null;
    }

    const baseline =
        average(preVolumes);

    const observed =
        average(postVolumes);

    if (
        !Number.isFinite(baseline) ||
        baseline <= 0
    ) {
        return null;
    }

    const ratio =
        observed /
        baseline;

    /*
     * Normal volume ≈ 70
     * Stronger confirmation ≈ higher
     * Very weak volume ≈ lower
     */
    return clamp(
        70 +
        ((ratio - 1) * 50)
    );
}

/*
 * SECTOR
 *
 * Sector relevance is intentionally conservative.
 *
 * If a sector exists, the factor is included.
 * If it doesn't, we don't fabricate a score.
 */
function calculateSector(
    sector
) {

    if (
        !sector ||
        !String(sector).trim()
    ) {
        return null;
    }

    /*
     * The current version treats a known sector
     * as valid contextual data rather than pretending
     * to know whether that sector is currently strong.
     */
    return 70;
}

/*
 * Calculate complete confidence.
 */
function calculateConfidence({
    preHistory,
    postHistory,
    sector
}) {

    const pre =
        Array.isArray(preHistory)
            ? preHistory
            : [];

    const post =
        Array.isArray(postHistory)
            ? postHistory
            : [];

    /*
     * We MUST have all 7 pre-add trading days.
     */
    if (
        pre.length <
        PRE_ADD_DAYS
    ) {

        return {
            available: false,

            reason:
                `Need ${PRE_ADD_DAYS} real ` +
                `trading days before the stock ` +
                `was added.`,

            preAddDays:
                pre.length,

            postAddDays:
                post.length,

            score:
                null,

            isFinal:
                false
        };
    }

    /*
     * We need at least one real post-add
     * trading day before producing a score.
     */
    if (
        post.length < 1
    ) {

        return {
            available: false,

            reason:
                'Waiting for the first real ' +
                'post-add trading day.',

            preAddDays:
                pre.length,

            postAddDays:
                0,

            score:
                null,

            isFinal:
                false
        };
    }

    /*
     * Never use more than 7 post-add days.
     */
    const observedPost =
        post.slice(
            0,
            POST_ADD_DAYS
        );

    const momentum =
        calculateMomentum(
            pre,
            observedPost
        );

    const stability =
        calculateStability(
            pre,
            observedPost
        );

    const volatility =
        calculateVolatility(
            pre,
            observedPost
        );

    const volume =
        calculateVolume(
            pre,
            observedPost
        );

    const sectorScore =
        calculateSector(
            sector
        );

    const components = [];

    if (
        Number.isFinite(momentum)
    ) {
        components.push({
            value: momentum,
            weight: WEIGHTS.momentum
        });
    }

    if (
        Number.isFinite(stability)
    ) {
        components.push({
            value: stability,
            weight: WEIGHTS.stability
        });
    }

    if (
        Number.isFinite(volatility)
    ) {
        components.push({
            value: volatility,
            weight: WEIGHTS.volatility
        });
    }

    if (
        Number.isFinite(volume)
    ) {
        components.push({
            value: volume,
            weight: WEIGHTS.volume
        });
    }

    if (
        Number.isFinite(sectorScore)
    ) {
        components.push({
            value: sectorScore,
            weight: WEIGHTS.sector
        });
    }

    /*
     * Never silently pretend missing data exists.
     *
     * We normalize using only available
     * real components.
     */
    if (!components.length) {

        return {
            available: false,

            reason:
                'Not enough real market data ' +
                'to calculate confidence.',

            preAddDays:
                pre.length,

            postAddDays:
                observedPost.length,

            score:
                null,

            isFinal:
                false
        };
    }

    const totalWeight =
        components.reduce(
            (sum, item) =>
                sum + item.weight,
            0
        );

    const weightedScore =
        components.reduce(
            (sum, item) =>
                sum +
                item.value *
                item.weight,
            0
        ) /
        totalWeight;

    const firstPostPrice =
        Number(
            observedPost[0]?.close
        );

    const latestPostPrice =
        Number(
            observedPost[
                observedPost.length - 1
            ]?.close
        );

    let stockGainPercent = null;

    if (
        firstPostPrice > 0 &&
        latestPostPrice > 0
    ) {

        stockGainPercent =
            ((latestPostPrice -
                firstPostPrice) /
                firstPostPrice) *
            100;
    }

    const score =
        Math.round(
            clamp(
                weightedScore
            )
        );

    let signal;

    if (score >= 80) {
        signal = 'Strong Confidence';
    } else if (score >= 65) {
        signal = 'Good Confidence';
    } else if (score >= 50) {
        signal = 'Neutral';
    } else if (score >= 35) {
        signal = 'Low Confidence';
    } else {
        signal = 'Very Low Confidence';
    }

    const isFinal =
        observedPost.length >=
        POST_ADD_DAYS;

    return {

        available: true,

        score,

        signal,

        dataDays:
            observedPost.length,

        preAddDays:
            pre.length,

        postAddDays:
            observedPost.length,

        stockGainPercent:
            round(
                stockGainPercent
            ),

        isFinal,

        breakdown: {

            momentum:
                Number.isFinite(momentum)
                    ? Math.round(
                        clamp(momentum)
                    )
                    : null,

            stability:
                Number.isFinite(stability)
                    ? Math.round(
                        clamp(stability)
                    )
                    : null,

            volatility:
                Number.isFinite(volatility)
                    ? Math.round(
                        clamp(volatility)
                    )
                    : null,

            volume:
                Number.isFinite(volume)
                    ? Math.round(
                        clamp(volume)
                    )
                    : null,

            sector:
                Number.isFinite(sectorScore)
                    ? Math.round(
                        clamp(sectorScore)
                    )
                    : null

        },

        sectorIncluded:
            Number.isFinite(
                sectorScore
            ),

        reason:
            isFinal
                ? 'Final confidence score'
                : `Progressive confidence — ` +
                  `${observedPost.length}/${POST_ADD_DAYS} ` +
                  `post-add trading days observed.`
    };
}

module.exports = {
    calculateConfidence,
    PRE_ADD_DAYS,
    POST_ADD_DAYS,
    WEIGHTS
};