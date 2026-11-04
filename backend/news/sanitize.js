'use strict';

const crypto = require('node:crypto');

const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const TAGS = /<[^>]*>/g;
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_eid$)/i;

const MAX_IMAGE_URL = 2048;
const MAX_DESCRIPTION = 500;

function cleanText(value, max = 400) {
    if (typeof value !== 'string') return '';

    let text = value
        .normalize('NFC')
        .replace(TAGS, ' ')
        .replace(INVISIBLE, '')
        .replace(CONTROL, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Decode common HTML entities.
    text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');

    // Normalize whitespace again after decoding.
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length > max) {
        text = Array.from(text).slice(0, max).join('').trim();
    }

    return text;
}

function cleanUrl(value, maxLength = 2048) {
  if (typeof value !== 'string' || value.length > maxLength) {
    return null;
  }

  let url;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) {
      url.searchParams.delete(key);
    }
  }

  url.hash = '';

  return url.toString();
}

function titleKey(title) {
  return title
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function makeId(key) {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex')
    .slice(0, 24);
}

function getFirst(value) {
  return Array.isArray(value) ? value[0] : value;
}

function extractImage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const candidates = [];

  // Standard RSS enclosure.
  const enclosure = getFirst(raw.enclosure);

  if (enclosure && typeof enclosure === 'object') {
    candidates.push(enclosure.url);
  }

  // RSS media:content.
  const mediaContent = getFirst(
    raw.mediaContent || raw['media:content']
  );

  if (mediaContent && typeof mediaContent === 'object') {
    candidates.push(
      mediaContent.url,
      mediaContent.$?.url
    );
  }

  // RSS media:thumbnail.
  const thumbnail = getFirst(
    raw.mediaThumbnail || raw['media:thumbnail']
  );

  if (thumbnail && typeof thumbnail === 'object') {
    candidates.push(
      thumbnail.url,
      thumbnail.$?.url
    );
  }

  // Check all candidates and accept only safe HTTPS URLs.
  for (const candidate of candidates) {
    const url = cleanUrl(candidate, MAX_IMAGE_URL);

    if (url) return url;
  }

  return null;
}

function extractDescription(raw) {
  if (!raw || typeof raw !== 'object') return '';

  const candidates = [
    raw.contentSnippet,
    raw.summary,
    raw.description,
    raw.contentEncoded,
    raw['content:encoded'],
    raw.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    const description = cleanText(candidate, MAX_DESCRIPTION);

    if (description) return description;
  }

  return '';
}

function classifyCategory(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();

  if (
    /\b(dividend|ex-dividend|payout|cash dividend)\b/.test(text)
  ) {
    return 'Dividends';
  }

  if (
    /\b(ngx|nigerian exchange|stock market|shares|equities|listed stock)\b/.test(text)
  ) {
    return 'NGX';
  }

  if (
    /\b(earnings|financial results|quarterly results|results|profit|revenue|bank|company|companies|corporate|acquisition|merger)\b/.test(text)
  ) {
    return 'Companies';
  }

  if (
    /\b(inflation|interest rate|cbn|naira|exchange rate|gdp|economy|economic|monetary policy)\b/.test(text)
  ) {
    return 'Economy';
  }

  return 'Global';
}

function normalizeItem(raw, source, {
  now = Date.now(),
  retentionMs = 14 * 24 * 60 * 60 * 1000,
  matchTickers = () => [],
} = {}) {
  if (!raw || typeof raw !== 'object') return null;

  if (!source || typeof source.name !== 'string') {
    return null;
  }

  let title = cleanText(raw.title, 400);
  let publisher = source.name;

  // Google News often appends the publisher to the headline:
  // "GTCO announces results - Nairametrics"
  if (source.splitPublisher) {
    const separator = title.lastIndexOf(' - ');

    if (separator > 0) {
      publisher =
        cleanText(title.slice(separator + 3), 60) || source.name;

      title = title.slice(0, separator);
    }
  }

  title = cleanText(title, 240);

  const url = cleanUrl(raw.link);
  const key = titleKey(title);

  if (title.length < 8 || !key || !url) {
    return null;
  }

  let published = Date.parse(raw.isoDate || raw.pubDate || '');

  if (!Number.isFinite(published)) {
    published = now;
  }

  // Do not allow future publication timestamps.
  if (published > now) {
    published = now;
  }

  // Ignore articles outside the retention window.
  if (published < now - retentionMs) {
    return null;
  }

  const description = extractDescription(raw);

  return {
    id: makeId(key),
    title,
    url,
    source: publisher,
    publishedAt: published,
    expiresAt: published + retentionMs,
    tickers: matchTickers(title),
    image: extractImage(raw),
    description,
    category: classifyCategory(title, description),
  };
}

module.exports = {
  cleanText,
  cleanUrl,
  extractImage,
  extractDescription,
  classifyCategory,
  normalizeItem,
};