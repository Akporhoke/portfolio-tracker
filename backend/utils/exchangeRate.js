const axios = require('axios');

// Cache exchange rates in memory + expiry time
let exchangeRateCache = {
  rate: null,
  lastFetch: null,
  cacheDuration: 3600000 // 1 hour
};

/**
 * Fetch USD to NGN exchange rate
 * Uses free tier API (open-er-api.com - no auth needed)
 * Falls back to cache if API fails
 */
async function getExchangeRate() {
  const now = Date.now();
  
  // Return cached rate if still fresh
  if (exchangeRateCache.rate && 
      (now - exchangeRateCache.lastFetch) < exchangeRateCache.cacheDuration) {
    console.log('✓ Exchange rate from cache:', exchangeRateCache.rate);
    return exchangeRateCache.rate;
  }

  try {
    // Free API - no auth required
    const response = await axios.get(
      'https://open.er-api.com/v6/latest/USD'
    );

    const rate = response.data.rates.NGN;
    exchangeRateCache.rate = rate;
    exchangeRateCache.lastFetch = now;
    
    console.log('✓ Exchange rate fetched:', rate);
    return rate;
  } catch (err) {
    console.error('⚠️ Failed to fetch exchange rate:', err.message);
    
    // If API fails, use fallback rate + return cached if available
    if (exchangeRateCache.rate) {
      console.log('⚠️ Using cached rate:', exchangeRateCache.rate);
      return exchangeRateCache.rate;
    }
    
    // Last resort fallback (approximate recent rate)
    console.log('⚠️ Using fallback rate: 1650');
    return 1650;
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} from - Source currency (USD or NGN)
 * @param {string} to - Target currency (USD or NGN)
 * @returns {Promise<number>} - Converted amount
 */
async function convertCurrency(amount, from = 'USD', to = 'NGN') {
  if (!amount || amount === 0) return 0;
  if (from === to) return amount;

  const rate = await getExchangeRate();

  if (from === 'USD' && to === 'NGN') {
    return amount * rate;
  } else if (from === 'NGN' && to === 'USD') {
    return amount / rate;
  }

  return amount; // Unknown conversion
}

module.exports = {
  getExchangeRate,
  convertCurrency
};