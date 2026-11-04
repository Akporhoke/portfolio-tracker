'use strict';

const Parser = require('rss-parser');
const { fetchFeedText } = require('./fetcher');
const { normalizeItem } = require('./sanitize');

const MIN_ATTEMPT_GAP_MS = 60 * 1000;   // never refresh more than once a minute
const MAX_BACKOFF_MS = 60 * 60 * 1000;  // a failing source is retried at least hourly

class NewsService {
  constructor({
    store,
    config,
    matchTickers,
    logger = console,
    fetchText = fetchFeedText, // injectable so tests never touch the network
    now = Date.now,
  }) {
    this.store = store;
    this.config = config;
    this.matchTickers = matchTickers;
    this.log = logger;
    this.fetchText = fetchText;
    this.now = now;
    this.parser = new Parser();

    // Health is kept in memory on purpose: it costs no database space and is
    // rebuilt within one refresh after a restart.
    this.health = new Map(
      config.sources.map((s) => [
        s.id,
        { failures: 0, nextAttemptAt: 0, lastSuccessAt: null, lastError: null, lastCount: 0 },
      ])
    );
    this.lastSuccessAt = null;
    this.lastAttemptAt = 0;
    this.running = null;
    this.timer = null;
  }

  // Prepare the store and start the schedule. The first refresh runs in the
  // background so a slow feed can never delay or block server startup.
  async start() {
    await this.store.init();
    this.refresh().catch(() => {});
    this.timer = setInterval(() => this.refresh().catch(() => {}), this.config.refreshIntervalMs);
    this.timer.unref(); // the timer alone must not keep the process alive
  }

  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.running) await this.running.catch(() => {});
    await this.store.close();
  }

  // Only one refresh runs at a time; concurrent callers share the same promise.
  refresh() {
    if (this.running) return this.running;
    this.running = this._refresh()
      .catch((err) => this.log.error('[news] refresh crashed:', err.message))
      .finally(() => {
        this.running = null;
      });
    return this.running;
  }

  async _refresh() {
    const now = this.now();
    this.lastAttemptAt = now;

    // Sources in backoff are skipped, so one dead feed cannot slow the others.
    const due = this.config.sources.filter((s) => this.health.get(s.id).nextAttemptAt <= now);
    const results = await Promise.allSettled(due.map((s) => this._pull(s, now)));

    const batch = [];
    let anySuccess = false;

    results.forEach((result, i) => {
      const source = due[i];
      const h = this.health.get(source.id);
      if (result.status === 'fulfilled') {
        anySuccess = true;
        h.failures = 0;
        h.nextAttemptAt = 0;
        h.lastSuccessAt = now;
        h.lastError = null;
        h.lastCount = result.value.length;
        batch.push(...result.value);
      } else {
        h.failures += 1;
        h.lastError = String((result.reason && result.reason.message) || result.reason).slice(0, 200);
        // Exponential backoff: 2, 4, 8 ... minutes, capped at one hour.
        h.nextAttemptAt = now + Math.min(2 ** h.failures * 60 * 1000, MAX_BACKOFF_MS);
        this.log.warn(`[news] source ${source.id} failed: ${h.lastError}`);
      }
    });

    try {
      if (batch.length) await this.store.upsertMany(batch);
      if (anySuccess) this.lastSuccessAt = now;
    } catch (err) {
      this.log.error('[news] store write failed:', err.message);
    }
  }

  async _pull(source, now) {
    const cfg = this.config;
    const xml = await this.fetchText(source, {
      timeoutMs: cfg.fetchTimeoutMs,
      maxBytes: cfg.maxFeedBytes,
      userAgent: cfg.userAgent,
    });
    const feed = await this.parser.parseString(xml);
    const out = [];
    for (const raw of (feed.items || []).slice(0, cfg.maxItemsPerSource)) {
      const item = normalizeItem(raw, source, {
        now,
        retentionMs: cfg.retentionMs,
        matchTickers: this.matchTickers,
      });
      if (item) out.push(item);
    }
    return out;
  }

  // Stale-while-revalidate: if data is old (for example the host slept and the
  // timer did not run), start a refresh in the background but answer from the
  // store immediately. Requests never wait on the network.
  maybeRefresh() {
    const now = this.now();
    const age = this.lastSuccessAt === null ? Infinity : now - this.lastSuccessAt;
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
      this.now() - this.lastSuccessAt > this.config.refreshIntervalMs * 3
    );
  }

  async getNews({ tickers = [], limit = 30, before = null } = {}) {
    this.maybeRefresh();
    const items = await this.store.list({ tickers, limit, before });
    const last = items[items.length - 1];
    return {
      items,
      updatedAt: this.lastSuccessAt,
      stale: this.isStale(),
      nextCursor: items.length === limit && last ? `${last.publishedAt}-${last.id}` : null,
    };
  }

  getHealth() {
    return {
      lastSuccessAt: this.lastSuccessAt,
      stale: this.isStale(),
      sources: this.config.sources.map((s) => ({ id: s.id, ...this.health.get(s.id) })),
    };
  }
}

module.exports = { NewsService };
