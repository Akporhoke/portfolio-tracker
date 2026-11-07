'use strict';

// Relevance ranking for Gaze news.
//
// Every article gets a score. Each point moves it up the feed by one hour
// (BOOST_PER_POINT_MS), so a strong economy or company story can outrank a
// weak story that is newer. The time shown on the card stays the real
// publish time; only the ORDER changes.
//
// TO ADD WORDS: just add them to the lists below. Matching is
// case-insensitive and whole-word, so "ipo" will not match "recipe".

const BOOST_PER_POINT_MS = 60 * 60 * 1000; // 1 hour per point
const MAX_POINTS = 10;                      // best possible lift: 10 hours
const MIN_POINTS = -4;                      // worst possible drop: 4 hours

// Starting points by category (set in sanitize.js classifyCategory).
const CATEGORY_POINTS = {
  Economy: 3,
  Dividends: 3,
  Companies: 2,
  NGX: 2,
  Global: 0,
};

// Strong money words. +3 each in the headline (max 2 hits), +1 in the
// description (max 2 hits).
const STRONG_TERMS = [
  'earnings', 'profit', 'profits', 'loss', 'dividend', 'dividends',
  'financial results', 'half-year', 'full-year', 'audited results',
  'inflation', 'interest rate', 'interest rates', 'monetary policy', 'mpc',
  'cbn', 'naira', 'gdp', 'budget', 'forex', 'fx', 'exchange rate',
  'external reserves', 'eurobond', 'debt', 'tax', 'tariff', 'subsidy',
  'buyback', 'share buyback', 'acquisition', 'acquires', 'merger', 'takeover', 'ipo', 'rights issue',
  'bonus issue', 'public offer', 'recapitalisation', 'recapitalization',
  'capital raise', 'market cap', 'market capitalisation',
  'market capitalization', 'ngx', 'nigerian exchange', 'all-share index',
  'crude oil', 'oil price', 'brent', 'opec',
];

// Softer finance words. +1 each in the headline (max 2 hits).
const MEDIUM_TERMS = [
  'stock', 'stocks', 'shares', 'equities', 'investors', 'investor',
  'revenue', 'bank', 'banks', 'banking', 'company', 'companies', 'firm',
  'listing', 'delisting', 'board', 'ceo', 'shareholders', 'sec',
  'economy', 'economic', 'growth', 'rate', 'rates',
];

// Company names. +3 in the headline, +1 in the description (once each).
// Tickers matched by matchTickers() are scored separately (+4).
const COMPANY_NAMES = [
  'gtco', 'gtbank', 'guaranty trust', 'zenith bank', 'access bank',
  'access holdings', 'uba', 'united bank for africa', 'first bank',
  'firstholdco', 'fbn holdings', 'fidelity bank', 'stanbic', 'wema bank',
  'sterling bank', 'fcmb', 'ecobank', 'union bank', 'unity bank',
  'mtn nigeria', 'mtn', 'airtel africa', 'dangote', 'dangote cement',
  'dangote sugar', 'dangote refinery', 'bua cement', 'buafoods', 'bua foods',
  'seplat', 'aradel', 'oando', 'conoil', 'totalenergies', 'geregu',
  'transcorp', 'nestle nigeria', 'nestle', 'nigerian breweries',
  'guinness nigeria', 'international breweries', 'champion breweries',
  'flour mills', 'unilever nigeria', 'cadbury', 'presco', 'okomu oil',
  'lafarge', 'wapco', 'julius berger', 'nahco', 'ngx group', 'custodian',
  'aiico', 'mansard', 'axa mansard', 'africa prudential', 'fidson',
  'neimeth', 'may & baker', 'academy press', 'skyway aviation',
];

// Topics that rarely matter to investors. -4 once.
const PENALTY_TERMS = [
  'football', 'super eagles', 'premier league', 'champions league',
  'la liga', 'celebrity', 'big brother', 'bbnaija', 'nollywood', 'movie',
  'music', 'wedding', 'horoscope', 'gist', 'fashion', 'concert',
];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One regex per list. Whole-word match; spaces in a term match any spacing.
function buildMatcher(terms) {
  const body = terms
    .map((term) => escapeRegex(term.toLowerCase()).replace(/\s+/g, '\\s+'))
    .join('|');

  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${body})(?![\\p{L}\\p{N}])`, 'giu');
}

const strongRx = buildMatcher(STRONG_TERMS);
const mediumRx = buildMatcher(MEDIUM_TERMS);
const companyRx = buildMatcher(COMPANY_NAMES);
const penaltyRx = buildMatcher(PENALTY_TERMS);

// Number of DISTINCT terms found in the text.
function distinctHits(regex, text) {
  const found = new Set();

  for (const match of text.matchAll(regex)) {
    found.add(match[0].toLowerCase().replace(/\s+/g, ' '));
  }

  return found.size;
}

function scoreItem({ title = '', description = '', category = 'Global', tickers = [] }) {
  let points = CATEGORY_POINTS[category] || 0;

  points += Math.min(distinctHits(strongRx, title), 2) * 3;
  points += Math.min(distinctHits(mediumRx, title), 2);
  points += Math.min(distinctHits(strongRx, description), 2);

  if (distinctHits(companyRx, title) > 0) points += 3;
  else if (distinctHits(companyRx, description) > 0) points += 1;

  if (Array.isArray(tickers) && tickers.length > 0) points += 4;

  if (distinctHits(penaltyRx, `${title} ${description}`) > 0) points -= 4;

  return Math.max(MIN_POINTS, Math.min(MAX_POINTS, points));
}

// The timestamp the feed is sorted by: publish time plus the relevance boost.
function rankAtFor(publishedAt, score) {
  return publishedAt + score * BOOST_PER_POINT_MS;
}

module.exports = { scoreItem, rankAtFor };
