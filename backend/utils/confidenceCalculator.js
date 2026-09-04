// backend/utils/confidenceCalculator.js

/**
 * Calculate a confidence score for a stock.
 *
 * Works with both:
 * - Portfolio stocks: buyPrice
 * - Watchlist stocks: priceAtAdd
 *
 * Returns a safe number between 0 and 100.
 */

function calculateConfidenceLevel(stock, market = {}) {
    const {
        ticker,
        buyPrice,
        priceAtAdd,
        currentPrice,
        sector,
        dateAdded
    } = stock;

    // Use buyPrice for portfolio stocks,
    // priceAtAdd for watchlist stocks,
    // and currentPrice as a final fallback.
    const referencePrice =
        Number(buyPrice) ||
        Number(priceAtAdd) ||
        Number(currentPrice) ||
        0;

    const price = Number(currentPrice) || referencePrice;

    /*
     * If we don't have a valid price, return a neutral
     * confidence score instead of allowing NaN into MongoDB.
     */
    if (!referencePrice || !price) {
        return 50;
    }

    // --------------------------------------------------
    // 1. MOMENTUM — 30%
    // --------------------------------------------------

    const momentumPercent =
        ((price - referencePrice) / referencePrice) * 100;

    // Convert momentum into a 0–100 score.
    // Positive movement increases confidence,
    // negative movement decreases it.
    const momentum = Math.max(
        0,
        Math.min(100, 50 + momentumPercent * 5)
    );

    // --------------------------------------------------
    // 2. STABILITY — 25%
    // --------------------------------------------------

    /*
     * We don't necessarily have enough historical data
     * when a stock is first added.
     *
     * Until proper historical data is available,
     * use a neutral stability score.
     */
    let stability = 50;

    if (market.stability !== undefined) {
        const marketStability = Number(market.stability);

        if (Number.isFinite(marketStability)) {
            stability = Math.max(
                0,
                Math.min(100, marketStability)
            );
        }
    }

    // --------------------------------------------------
    // 3. VOLATILITY — 20%
    // --------------------------------------------------

    let volatility = 50;

    if (market.volatility !== undefined) {
        const marketVolatility = Number(market.volatility);

        if (Number.isFinite(marketVolatility)) {
            // Higher volatility = lower confidence.
            volatility = Math.max(
                0,
                Math.min(100, 100 - marketVolatility)
            );
        }
    }

    // --------------------------------------------------
    // 4. VOLUME — 15%
    // --------------------------------------------------

    let volume = 50;

    if (market.volume !== undefined) {
        const marketVolume = Number(market.volume);

        if (Number.isFinite(marketVolume)) {
            volume = Math.max(
                0,
                Math.min(100, marketVolume)
            );
        }
    }

    // --------------------------------------------------
    // 5. SECTOR — 10%
    // --------------------------------------------------

    /*
     * Keep sector neutral for now.
     *
     * You can replace this later with your actual
     * sector-allocation logic.
     */
    let sectorScore = 50;

    if (sector) {
        sectorScore = 50;
    }

    // --------------------------------------------------
    // FINAL CONFIDENCE
    // --------------------------------------------------

    let confidence =
        (momentum * 0.30) +
        (stability * 0.25) +
        (volatility * 0.20) +
        (volume * 0.15) +
        (sectorScore * 0.10);

    // Protect MongoDB from NaN / Infinity.
    if (!Number.isFinite(confidence)) {
        confidence = 50;
    }

    // Always keep the result between 0 and 100.
    confidence = Math.max(
        0,
        Math.min(100, confidence)
    );

    return Math.round(confidence);
}

module.exports = {
    calculateConfidenceLevel
};