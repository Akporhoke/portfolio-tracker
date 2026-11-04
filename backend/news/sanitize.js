'use strict';

const crypto = require('node:crypto');

// Everything arriving from a feed is untrusted. This module is the single gate:
// nothing reaches the database or the browser without passing through here.

// Invisible and bidirectional-override characters are used to spoof text
// (for example making a link or headline read differently than it is).
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const TAGS = /<[^>]*>/g;
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_eid$)/i;

function cleanText(value, max) {
  if (typeof value !== 'string') return '';
  let s = value
    .normalize('NFC')
    .replace(TAGS, ' ')        // headlines are plain text; drop any markup
    .replace(INVISIBLE, '')
    .replace(CONTROL, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Array.from counts whole characters, so we never cut an emoji or symbol in half.
  if (s.length > max) s = Array.from(s).slice(0, max).join('').trim();
  return s;
}

// Only https links with no embedded credentials are accepted. This blocks
// javascript:, data: and file: links outright, which is the main XSS vector
// for a news list that renders links.
function cleanUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  let u;
  try {
    u = new URL(value.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  for (const key of [...u.searchParams.keys()]) {
    if (TRACKING_PARAM.test(key)) u.searchParams.delete(key);
  }
  u.hash = '';
  return u.toString();
}

// Stable id from the normalised title, so the same story arriving from two
// feeds collapses into one row. 24 hex characters is plenty for a 14-day window.
function titleKey(title) {
  return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function makeId(key) {
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 24);
}

// Returns the internal item shape, or null if the item should be dropped.
function normalizeItem(raw, source, { now, retentionMs, matchTickers }) {
  if (!raw || typeof raw !== 'object') return null;

  let title = cleanText(raw.title, 400);
  let publisher = source.name;

  if (source.splitPublisher) {
    const i = title.lastIndexOf(' - ');
    if (i > 0) {
      publisher = cleanText(title.slice(i + 3), 60) || source.name;
      title = title.slice(0, i);
    }
  }

  title = cleanText(title, 240);
  const url = cleanUrl(raw.link);
  const key = titleKey(title);
  if (title.length < 8 || !key || !url) return null;

  let published = Date.parse(raw.isoDate || raw.pubDate || '');
  if (!Number.isFinite(published)) published = now;
  // A feed with a wrong clock must not pin a story to the top forever.
  if (published > now) published = now;
  if (published < now - retentionMs) return null;

  return {
    id: makeId(key),
    title,
    url,
    source: publisher,
    publishedAt: published,
    expiresAt: published + retentionMs,
    tickers: matchTickers(title),
  };
}

module.exports = { cleanText, cleanUrl, normalizeItem };
