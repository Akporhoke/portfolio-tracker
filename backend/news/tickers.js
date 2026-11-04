'use strict';

// Starter list: NGX ticker -> names that appear in headlines.
// VERIFY each ticker against the NGX listing before relying on it, and add the
// stocks your users actually hold. Rules:
//  - Symbols of 4+ characters are matched automatically; you only list names.
//  - Aliases of 3 characters or fewer are matched case-sensitively, so "UBA"
//    does not match "Cuba". Short symbols must be listed explicitly.
const TICKER_ALIASES = {
  GTCO: ['GTCO', 'Guaranty Trust'],
  ZENITHBANK: ['Zenith Bank'],
  ACCESSCORP: ['Access Holdings', 'Access Bank'],
  UBA: ['UBA', 'United Bank for Africa'],
  FBNH: ['FBN Holdings'],
  FIDELITYBK: ['Fidelity Bank'],
  FCMB: [],
  STANBIC: ['Stanbic IBTC'],
  WEMABANK: ['Wema Bank'],
  DANGCEM: ['Dangote Cement'],
  BUACEMENT: ['BUA Cement'],
  BUAFOODS: ['BUA Foods'],
  MTNN: ['MTN Nigeria'],
  AIRTELAFRI: ['Airtel Africa'],
  SEPLAT: [],
  TRANSCORP: [],
  NESTLE: ['Nestle Nigeria'],
  NB: ['Nigerian Breweries'],
  GUINNESS: ['Guinness Nigeria'],
  GEREGU: ['Geregu Power'],
  OANDO: [],
  PRESCO: [],
  OKOMUOIL: ['Okomu Oil'],
  WAPCO: ['Lafarge Africa'],
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compile every alias to a regex ONCE at startup. Matching runs at ingest, so
// the database stores a small "tickers" array per story and queries become an
// index lookup instead of a slow regex scan on every request.
function createMatcher(aliasMap) {
  const rules = [];
  for (const [ticker, aliases] of Object.entries(aliasMap)) {
    const names = new Set(aliases);
    if (ticker.length >= 4) names.add(ticker);
    for (const name of names) {
      const flags = name.length <= 3 ? '' : 'i';
      // Lookarounds act as word boundaries and also work for names with spaces.
      rules.push({
        ticker,
        re: new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(name)}(?![A-Za-z0-9])`, flags),
      });
    }
  }
  return function matchTickers(text) {
    const found = new Set();
    for (const rule of rules) {
      if (!found.has(rule.ticker) && rule.re.test(text)) found.add(rule.ticker);
    }
    return [...found];
  };
}

module.exports = { TICKER_ALIASES, createMatcher };
