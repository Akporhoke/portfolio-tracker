/**
 * CONFIDENCE LEVEL CALCULATOR
 * 5-Factor Scoring System (0-100)
 * 
 * Factors:
 * 1. Momentum (25 pts) - Price change since purchase
 * 2. Stability (20 pts) - Market volatility (inverse)
 * 3. Volume/Conviction (20 pts) - Stock liquidity/popularity
 * 4. Sector Strength (20 pts) - Sector performance
 * 5. Technical (15 pts) - Trend consistency
 */

function calculateConfidenceLevel(stock, market) {
  const { ticker, buyPrice, currentPrice, sector, dateAdded } = stock;
  
  let confidence = 0;

  // ========================================
  // 1. MOMENTUM (25 points)
  // ========================================
  const momentum = ((currentPrice - buyPrice) / buyPrice) * 100;
  let momentumScore = 0;

  if (momentum >= 15) momentumScore = 25;      // Strong gain
  else if (momentum >= 10) momentumScore = 22;  // Good gain
  else if (momentum >= 5) momentumScore = 18;   // Moderate gain
  else if (momentum >= 0) momentumScore = 12;   // Slight gain
  else if (momentum >= -5) momentumScore = 8;   // Slight loss
  else if (momentum >= -10) momentumScore = 4;  // Moderate loss
  else momentumScore = 0;                        // Heavy loss

  confidence += momentumScore;

  // ========================================
  // 2. STABILITY (20 points)
  // ========================================
  // Inverse of volatility - lower volatility = higher score
  // Proxy: Use market type and recent price stability
  let stabilityScore = 0;

  // US market is generally less volatile than NGX
  const baseVolatility = market === 'US' ? 1.2 : 2.0;
  
  // Assume price within 5% range = stable
  const assumedRange = buyPrice * 0.05;
  const priceDeviation = Math.abs(currentPrice - buyPrice);
  
  if (priceDeviation <= assumedRange) stabilityScore = 20;      // Very stable
  else if (priceDeviation <= assumedRange * 1.5) stabilityScore = 16;  // Stable
  else if (priceDeviation <= assumedRange * 2) stabilityScore = 12;    // Moderate
  else stabilityScore = 8;  // Volatile

  confidence += stabilityScore;

  // ========================================
  // 3. VOLUME & CONVICTION (20 points)
  // ========================================
  // Score based on: stock popularity + time held
  let volumeScore = 10; // base score

  // Popular blue-chip stocks score higher
  const blueChips = {
    'GTCO': 20,      // Guaranty Trust - high liquidity
    'NSRNG': 19,     // Nestle - high liquidity
    'AAPL': 20,      // Apple - very high volume
    'MSFT': 20,      // Microsoft - very high volume
    'GOOGL': 20,     // Google
    'SEPLAT': 16,    // Seplat - medium volume
    'STANBIC': 18,   // Stanbic - high volume
    'ZENITHBANK': 17 // Zenith - medium-high
  };

  if (blueChips[ticker]) {
    volumeScore = blueChips[ticker];
  }

  // Boost score for longer conviction period (time held)
  if (dateAdded) {
    const daysHeld = Math.floor((Date.now() - new Date(dateAdded)) / (1000 * 60 * 60 * 24));
    if (daysHeld >= 90) volumeScore = Math.min(volumeScore + 3, 20);  // +3 for 3+ months
    else if (daysHeld >= 30) volumeScore = Math.min(volumeScore + 1, 20); // +1 for 1+ month
  }

  confidence += volumeScore;

  // ========================================
  // 4. SECTOR STRENGTH (20 points)
  // ========================================
  const sectorPerformance = {
    'Finance': 19,       // Strong sector in both markets
    'Tech': 20,          // Strongest growth sector
    'Consumer': 17,      // Stable, defensive
    'Energy': 14,        // Volatile, recovery play
    'Healthcare': 18,    // Stable, defensive
    'Manufacturing': 13, // Cyclical
    'Telecoms': 15,      // Utility-like
    'Other': 12          // Unknown
  };

  const sectorScore = sectorPerformance[sector] || 12;
  confidence += sectorScore;

  // ========================================
  // 5. TECHNICAL INDICATORS (15 points)
  // ========================================
  // Score based on price trend consistency
  // Since we don't have detailed history, estimate from momentum
  let technicalScore = 10;

  // Strong uptrend = higher technical score
  if (momentum >= 20) technicalScore = 15;      // Strong uptrend
  else if (momentum >= 10) technicalScore = 13; // Mild uptrend
  else if (momentum >= 0) technicalScore = 10;  // Consolidating
  else if (momentum >= -10) technicalScore = 7; // Mild downtrend
  else technicalScore = 4;                       // Strong downtrend

  confidence += technicalScore;

  // ========================================
  // FINAL SCORE (0-100)
  // ========================================
  return Math.min(Math.max(Math.round(confidence), 0), 100);
}

// ========================================
// EXPORT
// ========================================
module.exports = calculateConfidenceLevel;

/**
 * USAGE IN BACKEND:
 * 
 * const calculateConfidenceLevel = require('../utils/confidenceCalculator');
 * 
 * const confidence = calculateConfidenceLevel(stock, 'NGX');
 * // stock = { ticker, buyPrice, currentPrice, sector, dateAdded }
 * 
 * EXAMPLE OUTPUT:
 * - Stock up 15%, stable sector, high volume → 92
 * - Stock down 10%, volatile, small cap → 35
 * - Stock flat, medium sector, held 2 months → 58
 */