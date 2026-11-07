'use strict';

const crypto = require('node:crypto');

const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
const TAGS = /<[^>]*>/g;
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|mc_eid$)/i;
// Images we never want (tracking pixels, emoji, avatars, share icons)
const JUNK_IMAGE = /(gravatar\.com|\/emoji\/|s\.w\.org|\/(?:pixel|spacer|blank)\.(?:gif|png)|[-_\/]1x1\.)/i;
// WordPress boilerplate: "The post X appeared first on Y."
const WP_FOOTER = /\s*The post .*? appeared first on .*?\.?\s*$/i;

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

    text = text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');

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
        // Feeds often HTML-escape ampersands inside URLs.
        url = new URL(value.trim().replace(/&amp;/gi, '&'));
    } catch {
        return null;
    }

    // Upgrade http to https instead of rejecting it.
    if (url.protocol === 'http:') url.protocol = 'https:';

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

// Pulls a URL out of a string, or an rss-parser object like { $: { url } }.
function pickUrl(value) {
    const item = getFirst(value);

    if (!item) return null;
    if (typeof item === 'string') return item;
    if (typeof item === 'object') return item.url || item.$?.url || null;

    return null;
}

// Finds the first usable <img> inside an HTML string (also lazy-load attributes).
function imageFromHtml(html) {
    if (typeof html !== 'string' || !html) return null;

    const tagPattern = /<img\b[^>]*>/gi;
    const srcPattern = /\b(?:data-lazy-src|data-src|src)\s*=\s*["']([^"']+)["']/i;

    let tag;

    while ((tag = tagPattern.exec(html)) !== null) {
        const match = tag[0].match(srcPattern);

        if (match && !JUNK_IMAGE.test(match[1]) && !match[1].startsWith('data:')) {
            return match[1];
        }
    }

    return null;
}

function extractImage(raw) {
    if (!raw || typeof raw !== 'object') return null;

    const candidates = [];

    // 1. Standard RSS enclosure (only if it is an image, not audio/video).
    const enclosure = getFirst(raw.enclosure);

    if (enclosure && typeof enclosure === 'object') {
        const type = String(enclosure.type || enclosure.$?.type || '');

        if (!type || type.startsWith('image/')) {
            candidates.push(pickUrl(enclosure));
        }
    }

    // 2. media:content and 3. media:thumbnail.
    candidates.push(pickUrl(raw.mediaContent || raw['media:content']));
    candidates.push(pickUrl(raw.mediaThumbnail || raw['media:thumbnail']));

    // 4. Fallback: first <img> inside the article HTML.
    candidates.push(imageFromHtml(raw['content:encoded']));
    candidates.push(imageFromHtml(raw.contentEncoded));
    candidates.push(imageFromHtml(raw.content));
    candidates.push(imageFromHtml(raw.description));

    for (const candidate of candidates) {
        const url = cleanUrl(candidate, MAX_IMAGE_URL);

        if (url && !JUNK_IMAGE.test(url)) return url;
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

        // Clean first, then strip the WordPress footer, so tags don't hide it.
        const description = cleanText(candidate, 2000)
            .replace(WP_FOOTER, '')
            .trim();

        const short = cleanText(description, MAX_DESCRIPTION);

        if (short) return short;
    }

    return '';
}

function classifyCategory(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();

    if (/\b(dividend|ex-dividend|payout|cash dividend)\b/.test(text)) {
        return 'Dividends';
    }

    if (/\b(ngx|nigerian exchange|stock market|shares|equities|listed stock)\b/.test(text)) {
        return 'NGX';
    }

    if (/\b(earnings|financial results|quarterly results|results|profit|revenue|bank|company|companies|corporate|acquisition|merger)\b/.test(text)) {
        return 'Companies';
    }

    if (/\b(inflation|interest rate|cbn|naira|exchange rate|gdp|economy|economic|monetary policy)\b/.test(text)) {
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

    if (published > now) {
        published = now;
    }

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
