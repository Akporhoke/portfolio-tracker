/*
 * Market check: catches a stock saved under the wrong market, for example
 * UBA (a Nigerian bank) added as a US stock. A wrong market makes the
 * scheduler ask the wrong provider for a price every minute, forever.
 *
 * Put this file in:  backend/services/marketCheck.js
 *
 * It costs NO provider calls. It uses what Gaze already knows: which
 * tickers have stored price history under NGX and which under US.
 *
 *   - ticker known only on NGX, saved as US  -> rejected, suggest NGX
 *   - ticker known only on US,  saved as NGX -> rejected, suggest US
 *   - US ticker that cannot be a US symbol   -> rejected
 *       (US symbols are 1-5 letters, optionally .A / .B for share classes)
 *   - ticker Gaze has never seen             -> allowed (it may simply be
 *       new; we cannot tell, and we never block on a guess)
 */

const PriceHistory =
    require('../models/PriceHistory');


// The known-ticker lists are rebuilt at most this often
const CACHE_MS =
    10 * 60 * 1000;

let cache = {
    at: 0,
    NGX: new Set(),
    US: new Set()
};


function cleanTicker(value) {
    return String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9.]/g, '');
}


function cleanMarket(value) {
    const market =
        String(value || '').trim().toUpperCase();

    return market === 'NGX' || market === 'US'
        ? market
        : null;
}


async function loadKnown() {
    if (Date.now() - cache.at < CACHE_MS) {
        return cache;
    }

    const [ngx, us] =
        await Promise.all([
            PriceHistory.distinct('ticker', { market: 'NGX' }),
            PriceHistory.distinct('ticker', { market: 'US' })
        ]);

    cache = {
        at: Date.now(),
        NGX: new Set(ngx),
        US: new Set(us)
    };

    return cache;
}


function invalidateCache() {
    cache.at = 0;
}


// Returns { ok, suggestion, message }
//   ok          true = fine (or cannot tell), false = clearly wrong
//   suggestion  the market it probably belongs to, or null
async function checkTickerMarket(tickerInput, marketInput) {
    const ticker = cleanTicker(tickerInput);
    const market = cleanMarket(marketInput);

    // Not our job to judge missing or odd input: other checks handle it
    if (!ticker || !market) {
        return { ok: true, suggestion: null, message: null };
    }

    let known;

    try {
        known = await loadKnown();
    } catch (error) {
        // If the lookup fails, allow it. A check must never block adding
        // a stock because of our own database problem.
        console.error(
            '[MarketCheck] lookup failed:',
            error.message
        );

        return { ok: true, suggestion: null, message: null };
    }

    const onNgx = known.NGX.has(ticker);
    const onUs = known.US.has(ticker);

    if (market === 'US' && onNgx && !onUs) {
        return {
            ok: false,
            suggestion: 'NGX',
            message:
                `${ticker} is listed on the Nigerian exchange (NGX), ` +
                'not the US market. Choose NGX instead.'
        };
    }

    if (market === 'NGX' && onUs && !onNgx) {
        return {
            ok: false,
            suggestion: 'US',
            message:
                `${ticker} is a US stock, not an NGX one. ` +
                'Choose US instead.'
        };
    }

    // US symbols are short. "FIRSTHOLDCO" can never be one.
    if (
        market === 'US' &&
        !onUs &&
        !/^[A-Z]{1,5}(\.[A-Z])?$/.test(ticker)
    ) {
        return {
            ok: false,
            suggestion: onNgx ? 'NGX' : null,
            message:
                `${ticker} does not look like a US stock symbol ` +
                '(US symbols are 1 to 5 letters). ' +
                'If it is a Nigerian stock, choose NGX.'
        };
    }

    return { ok: true, suggestion: null, message: null };
}


// Express middleware: put it in front of any route that ADDS a stock and
// receives { ticker, market } in the request body.
async function guardMarket(req, res, next) {
    try {
        const body = req.body || {};

        if (!body.ticker || !body.market) {
            return next();
        }

        const result =
            await checkTickerMarket(body.ticker, body.market);

        if (!result.ok) {
            return res.status(400).json({
                error: result.message,
                code: 'WRONG_MARKET',
                suggestion: result.suggestion
            });
        }

        return next();

    } catch (error) {
        // Never block a request because of a bug in the check itself
        console.error('[MarketCheck] guard failed:', error.message);

        return next();
    }
}


module.exports = {
    checkTickerMarket,
    guardMarket,
    invalidateCache
};
