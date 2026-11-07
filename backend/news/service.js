'use strict';

const Parser = require('rss-parser');
const { fetchFeedText } = require('./fetcher');
const { normalizeItem, cleanUrl } = require('./sanitize');

const MIN_ATTEMPT_GAP_MS = 60 * 1000;
const MAX_BACKOFF_MS = 60 * 60 * 1000;

// og:image fallback settings
const OG_TIMEOUT_MS = 8000;              // give up on a slow article page
const OG_MAX_BYTES = 300 * 1024;         // only the <head> matters
const OG_CONCURRENCY = 5;                // pages fetched at once
const OG_MAX_PER_REFRESH = 40;           // cap work per refresh cycle
const OG_CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // keep a found image
const OG_MISS_TTL_MS = 15 * 60 * 1000;        // retry misses/failures sooner
const OG_CACHE_MAX = 500;

// Blocks obvious internal hosts (basic SSRF guard).
const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?$)/i;

function isGoogleNewsLink(value) {
  try {
    return new URL(value).hostname === 'news.google.com';
  } catch (error) {
    return false;
  }
}

class NewsService {
  constructor({
    store,
    config,
    matchTickers,
    logger = console,
    fetchText = fetchFeedText,
    now = Date.now,
  }) {
    this.store = store;
    this.config = config;
    this.matchTickers = matchTickers;
    this.log = logger;
    this.fetchText = fetchText;
    this.now = now;

    // Capture standard RSS fields and common media extensions.
    this.parser = new Parser({
      timeout: config.fetchTimeoutMs,

      customFields: {
        item: [
          ['media:content', 'mediaContent', { keepArray: true }],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
          ['content:encoded', 'contentEncoded'],
        ],
      },
    });

    // Remembers og:image lookups (including misses) so each page is fetched once.
    this.ogCache = new Map();

    // Source health is kept in memory.
    this.health = new Map(
      config.sources.map((source) => [
        source.id,
        {
          failures: 0,
          nextAttemptAt: 0,
          lastSuccessAt: null,
          lastError: null,
          lastCount: 0,
        },
      ])
    );

    this.lastSuccessAt = null;
    this.lastAttemptAt = 0;
    this.running = null;
    this.timer = null;
  }

  async start() {
    await this.store.init();

    // Do not delay server startup while feeds are downloading.
    this.refresh().catch(() => {});

    this.timer = setInterval(
      () => this.refresh().catch(() => {}),
      this.config.refreshIntervalMs
    );

    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.running) {
      await this.running.catch(() => {});
    }

    await this.store.close();
  }

  // Prevent concurrent refreshes.
  refresh() {
    if (this.running) {
      return this.running;
    }

    this.running = this._refresh()
      .catch((error) => {
        this.log.error('[news] refresh crashed:', error.message);
      })
      .finally(() => {
        this.running = null;
      });

    return this.running;
  }

  async _refresh() {
    const now = this.now();

    this.lastAttemptAt = now;

    // Skip sources currently in backoff.
    const due = this.config.sources.filter((source) => {
      const health = this.health.get(source.id);
      return health && health.nextAttemptAt <= now;
    });

    if (!due.length) {
      return;
    }

    const results = await Promise.allSettled(
      due.map((source) => this._pull(source, now))
    );

    const batch = [];
    let anySuccess = false;

    results.forEach((result, index) => {
      const source = due[index];
      const health = this.health.get(source.id);

      if (result.status === 'fulfilled') {
        anySuccess = true;

        health.failures = 0;
        health.nextAttemptAt = 0;
        health.lastSuccessAt = now;
        health.lastError = null;
        health.lastCount = result.value.length;

        batch.push(...result.value);
      } else {
        health.failures += 1;

        health.lastError = String(
          (result.reason && result.reason.message) || result.reason
        ).slice(0, 200);

        // Exponential backoff: 2, 4, 8 ... 60 minutes.
        health.nextAttemptAt =
          now +
          Math.min(
            2 ** health.failures * 60 * 1000,
            MAX_BACKOFF_MS
          );

        this.log.warn(
          `[news] source ${source.id} failed: ${health.lastError}`
        );
      }
    });

    try {
      if (batch.length) {
        await this.store.upsertMany(batch);
      }

      if (anySuccess) {
        this.lastSuccessAt = now;
      }
    } catch (error) {
      this.log.error('[news] store write failed:', error.message);
    }
  }

  async _pull(source, now) {
    const config = this.config;

    const xml = await this.fetchText(source, {
      timeoutMs: config.fetchTimeoutMs,
      maxBytes: config.maxFeedBytes,
      userAgent: config.userAgent,
    });

    const feed = await this.parser.parseString(xml);

    const out = [];

    const feedItems = Array.isArray(feed.items) ? feed.items : [];

    for (const raw of feedItems.slice(0, config.maxItemsPerSource)) {
      const item = normalizeItem(raw, source, {
        now,
        retentionMs: config.retentionMs,
        matchTickers: this.matchTickers,
      });

      if (item) {
        out.push(item);
      }
    }

    // Articles the feed gave no image for: read og:image from the page.
    await this._fillMissingImages(out);

    return out;
  }

  // --------------------------------------------------
  // og:image FALLBACK
  // --------------------------------------------------

  async _fillMissingImages(items) {
    // Google News links are redirect pages with no article image,
    // so looking them up would only waste the per-refresh budget.
    const missing = items
      .filter((item) => !item.image && !isGoogleNewsLink(item.url))
      .slice(0, OG_MAX_PER_REFRESH);

    // Work through the list in small groups to stay polite to publishers.
    for (let i = 0; i < missing.length; i += OG_CONCURRENCY) {
      const group = missing.slice(i, i + OG_CONCURRENCY);

      await Promise.all(
        group.map(async (item) => {
          item.image = await this._ogImage(item.url);
        })
      );
    }

    if (missing.length) {
      const found = missing.filter((item) => item.image).length;

      this.log.info(
        `[news] og:image filled ${found}/${missing.length} missing images`
      );
    }
  }

  async _ogImage(articleUrl) {
    const now = this.now();
    const cached = this.ogCache.get(articleUrl);

    if (cached && cached.expires > now) {
      return cached.image;
    }

    let image = null;

    try {
      image = await this._fetchOgImage(articleUrl);

      if (!image) {
        this.log.warn(`[news] og:image not found: ${articleUrl}`);
      }
    } catch (error) {
      // A failed lookup must never break the refresh, but log why.
      this.log.warn(
        `[news] og:image failed (${error.message}): ${articleUrl}`
      );
    }

    // Keep the cache from growing forever: drop the oldest entry.
    if (this.ogCache.size >= OG_CACHE_MAX) {
      this.ogCache.delete(this.ogCache.keys().next().value);
    }

    this.ogCache.set(articleUrl, {
      image,
      expires: now + (image ? OG_CACHE_TTL_MS : OG_MISS_TTL_MS),
    });

    return image;
  }

  async _fetchOgImage(articleUrl) {
    const url = new URL(articleUrl);

    if (url.protocol !== 'https:' || PRIVATE_HOST.test(url.hostname)) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OG_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': this.config.userAgent || 'Mozilla/5.0 (compatible; GazeBot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('empty body');

      const type = response.headers.get('content-type') || '';
      if (!type.includes('html')) throw new Error(`content-type ${type || 'none'}`);

      // Read only the start of the page, and stop once </head> is seen.
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let html = '';
      let bytes = 0;

      while (bytes < OG_MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;

        bytes += value.length;
        html += decoder.decode(value, { stream: true });

        if (/<\/head>/i.test(html)) break;
      }

      reader.cancel().catch(() => {});

      return this._parseOgImage(html, url);
    } finally {
      clearTimeout(timer);
    }
  }

  _parseOgImage(html, baseUrl) {
    const metas = html.match(/<meta\b[^>]*>/gi) || [];

    for (const wanted of ['og:image:secure_url', 'og:image', 'twitter:image']) {
      for (const tag of metas) {
        const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
        const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);

        if (name && content && name[1].toLowerCase() === wanted) {
          try {
            // Resolve relative paths like /img/a.jpg against the article URL.
            const absolute = new URL(content[1].trim(), baseUrl).toString();
            const clean = cleanUrl(absolute, 2048);

            if (clean) return clean;
          } catch (error) {
            // try the next candidate
          }
        }
      }
    }

    return null;
  }

  // Stale-while-revalidate.
  // Return stored news immediately while refreshing outdated data.
  maybeRefresh() {
    const now = this.now();

    const age =
      this.lastSuccessAt === null
        ? Infinity
        : now - this.lastSuccessAt;

    if (
      !this.running &&
      age >= this.config.refreshIntervalMs &&
      now - this.lastAttemptAt >= MIN_ATTEMPT_GAP_MS
    ) {
      this.refresh().catch(() => {});
    }
  }

  isStale() {
    return (
      this.lastSuccessAt === null ||
      this.now() - this.lastSuccessAt >
        this.config.refreshIntervalMs * 3
    );
  }

  async getNews({
    tickers = [],
    limit = 30,
    before = null,
  } = {}) {
    this.maybeRefresh();

    const items = await this.store.list({
      tickers,
      limit,
      before,
    });

    const last = items[items.length - 1];

    return {
      items,
      updatedAt: this.lastSuccessAt,
      stale: this.isStale(),

      nextCursor:
        items.length === limit && last
          ? `${last.publishedAt}-${last.id}`
          : null,
    };
  }

  getHealth() {
    return {
      lastSuccessAt: this.lastSuccessAt,
      stale: this.isStale(),

      sources: this.config.sources.map((source) => ({
        id: source.id,
        ...this.health.get(source.id),
      })),
    };
  }
}

module.exports = { NewsService };
