const DEFAULT_WEIGHTS = {
  momentum: 0.25,
  stability: 0.20,
  volatility: 0.15,
  volume: 0.20,
  sector: 0.20
};

function calculateMomentum(ohlcv) {
  const first = ohlcv[0].close;
  const last = ohlcv[ohlcv.length - 1].close;
  const pctChange = ((last - first) / first) * 100;
  // Map -10%..+10% to 0..100, clamped
  return Math.max(0, Math.min(100, 50 + pctChange * 5));
}

function calculateStability(ohlcv) {
  const closes = ohlcv.map(d => d.close);
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance = closes.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / closes.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;
  // Lower variation = higher stability score
  return Math.max(0, Math.min(100, 100 - coeffOfVariation * 10));
}

function calculateVolatility(ohlcv) {
  const ranges = ohlcv.map(d => ((d.high - d.low) / d.low) * 100);
  const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
  // Score is inverted: lower daily range = higher score (less risky)
  return Math.max(0, Math.min(100, 100 - avgRange * 8));
}

function calculateVolumeTrend(ohlcv) {
  const firstHalf = ohlcv.slice(0, Math.floor(ohlcv.length / 2));
  const secondHalf = ohlcv.slice(Math.floor(ohlcv.length / 2));
  const avgFirst = firstHalf.reduce((sum, d) => sum + d.volume, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, d) => sum + d.volume, 0) / secondHalf.length;
  const pctChange = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;
  // Rising volume = higher score
  return Math.max(0, Math.min(100, 50 + pctChange * 2));
}

function calculateSectorRelativeStrength(stockGainPercent, sectorAvgGainPercent) {
  const outperformance = stockGainPercent - sectorAvgGainPercent;
  if (outperformance > 5) return 85;
  if (outperformance > 0) return 70;
  if (outperformance > -5) return 50;
  return 35;
}

function getSignal(score) {
  if (score >= 80) return 'STRONG_SIGNAL';
  if (score >= 70) return 'GOOD_SIGNAL';
  if (score >= 60) return 'MODERATE_SIGNAL';
  if (score >= 40) return 'WEAK_SIGNAL';
  return 'STRONG_NEGATIVE_SIGNAL';
}

/**
 * @param {Array} ohlcv - 7 days of {date, open, high, low, close, volume}, oldest first
 * @param {number} sectorAvgGainPercent - average % gain of the stock's sector over same window
 * @param {object} weights - optional override, defaults to equal Phase-A weights
 */
function calculateConfidenceScore(ohlcv, sectorAvgGainPercent = 0, weights = DEFAULT_WEIGHTS) {
  if (!ohlcv || ohlcv.length < 7) {
    return null; // not enough data yet — caller should show "collecting data"
  }

  const stockGainPercent = ((ohlcv[ohlcv.length - 1].close - ohlcv[0].close) / ohlcv[0].close) * 100;

  const momentum = calculateMomentum(ohlcv);
  const stability = calculateStability(ohlcv);
  const volatility = calculateVolatility(ohlcv);
  const volume = calculateVolumeTrend(ohlcv);
  const sector = calculateSectorRelativeStrength(stockGainPercent, sectorAvgGainPercent);

  const score = Math.round(
    momentum * weights.momentum +
    stability * weights.stability +
    volatility * weights.volatility +
    volume * weights.volume +
    sector * weights.sector
  );

  return {
    score,
    signal: getSignal(score),
    breakdown: { momentum, stability, volatility, volume, sector },
    calibrated: weights !== DEFAULT_WEIGHTS
  };
}

module.exports = { calculateConfidenceScore, DEFAULT_WEIGHTS };