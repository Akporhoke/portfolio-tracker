const axios = require('axios');

// Cache exchange rates in memory + expiry time
let exchangeRateCache = {
  rate: null,
  lastFetch: null,
  cacheDuration: 3600000 // 1 hour
};

async function getExchangeRate() {
  const now = Date.now();

  if (exchangeRateCache.rate &&
      (now - exchangeRateCache.lastFetch) < exchangeRateCache.cacheDuration) {
    console.log('✓ Exchange rate from cache:', exchangeRateCache.rate);
    return exchangeRateCache.rate;
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD');
    const rate = response.data.rates.NGN;
    exchangeRateCache.rate = rate;
    exchangeRateCache.lastFetch = now;

    console.log('✓ Exchange rate fetched:', rate);
    return rate;
  } catch (err) {
    console.error('⚠️ Failed to fetch exchange rate:', err.message);

    if (exchangeRateCache.rate) {
      console.log('⚠️ Using cached rate:', exchangeRateCache.rate);
      return exchangeRateCache.rate;
    }

    console.log('⚠️ Using fallback rate: 1650');
    return 1650;
  }
}

async function convertCurrency(amount, from = 'USD', to = 'NGN') {
  if (!amount || amount === 0) return 0;
  if (from === to) return amount;

  const rate = await getExchangeRate();

  if (from === 'USD' && to === 'NGN') {
    return amount * rate;
  } else if (from === 'NGN' && to === 'USD') {
    return amount / rate;
  }

  return amount;
}

// ---- FX card: USD→NGN + GBP→USD ----
let fxCache = { data: null, lastFetch: 0 };

const FX_CACHE_MS = 60 * 60 * 1000;      // normal cache: 1 hour
const FX_MIN_FORCE_MS = 10 * 60 * 1000;  // manual refresh: at most every 10 min

async function getFxRates(force = false) {
  const now = Date.now();
  const age = now - fxCache.lastFetch;

  if (fxCache.data && age < (force ? FX_MIN_FORCE_MS : FX_CACHE_MS)) {
    return fxCache.data;
  }

  try {
    const { data } = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 8000 });

    fxCache = {
      data: {
        usdToNgn: data.rates.NGN,
        gbpToUsd: 1 / data.rates.GBP,
        updatedAt: new Date().toISOString(),
        providerUpdatedAt: data.time_last_update_utc
          ? new Date(data.time_last_update_utc).toISOString()
          : null
      },
      lastFetch: now
    };

    return fxCache.data;
  } catch (err) {
    if (fxCache.data) return fxCache.data; // stale beats nothing
    throw err;
  }
}

module.exports = {
  getExchangeRate,
  convertCurrency,
  getFxRates
};