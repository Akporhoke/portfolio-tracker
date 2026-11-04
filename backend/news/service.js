'use strict';

const Parser = require('rss-parser');
const { fetchFeedText } = require('./fetcher');
const { normalizeItem } = require('./sanitize');

const MIN_ATTEMPT_GAP_MS = 60 * 1000;
const MAX_BACKOFF_MS = 60 * 60 * 1000;

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

    return out;
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