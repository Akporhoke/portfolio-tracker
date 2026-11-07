'use strict';

// STORE CONTRACT (any database can be plugged in by implementing these):
//
//   init()                           -> prepare the store
//   upsertMany(items)                -> insert new items; return count added.
//                                       Existing items keep their core fields,
//                                       but image, description and category
//                                       may be improved by newer data.
//   list({ tickers, limit, before }) -> newest first, ties broken by ID DESC
//   close()                          -> release resources
//
// Times are epoch milliseconds. Expired rows are removed after expiresAt.

class MemoryStore {
  constructor({ maxItems = 500 } = {}) {
    this.items = new Map();
    this.maxItems = Math.max(1, Number(maxItems) || 500);
  }

  async init() {}

  async upsertMany(items) {
    let added = 0;

    for (const item of items) {
      if (!item || !item.id) continue;

      const existing = this.items.get(item.id);

      if (existing) {
        // Improve an existing record without replacing it:
        // fill in a missing image, refresh cleaned text and category.
        if (item.image) existing.image = item.image;
        if (item.description) existing.description = item.description;
        if (item.category) existing.category = item.category;
        if (item.rankAt) existing.rankAt = Number(item.rankAt) || existing.rankAt;
        continue;
      }

      this.items.set(item.id, {
        id: item.id,
        title: item.title || '',
        url: item.url || '',
        source: item.source || '',
        publishedAt: Number(item.publishedAt) || 0,
        expiresAt: Number(item.expiresAt) || 0,
        rankAt: Number(item.rankAt) || Number(item.publishedAt) || 0,
        tickers: Array.isArray(item.tickers) ? [...item.tickers] : [],
        image: item.image || null,
        description: item.description || '',
        category: item.category || 'Global',
      });

      added += 1;
    }

    this.prune(Date.now());

    return added;
  }

  prune(now) {
    // Remove expired articles.
    for (const [id, item] of this.items) {
      if (item.expiresAt <= now) {
        this.items.delete(id);
      }
    }

    // Keep only the newest maxItems records.
    if (this.items.size > this.maxItems) {
      const newestFirst = [...this.items.values()].sort(compare);

      for (const item of newestFirst.slice(this.maxItems)) {
        this.items.delete(item.id);
      }
    }
  }

  async list({ tickers = [], limit = 30, before = null } = {}) {
    this.prune(Date.now());

    const safeLimit = Math.max(
      1,
      Math.min(50, Math.floor(Number(limit) || 30))
    );

    const requestedTickers = Array.isArray(tickers)
      ? tickers.map((ticker) => String(ticker).toUpperCase())
      : [];

    let rows = [...this.items.values()];

    if (requestedTickers.length) {
      rows = rows.filter((item) =>
        item.tickers.some((ticker) =>
          requestedTickers.includes(String(ticker).toUpperCase())
        )
      );
    }

    if (
      before &&
      Number.isFinite(Number(before.publishedAt)) &&
      typeof before.id === 'string'
    ) {
      // "publishedAt" in the cursor is really the article's rankAt.
      const cursorTime = Number(before.publishedAt);

      rows = rows.filter(
        (item) =>
          item.rankAt < cursorTime ||
          (item.rankAt === cursorTime && item.id < before.id)
      );
    }

    rows.sort(compare);

    return rows.slice(0, safeLimit).map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      rankAt: item.rankAt,
      tickers: [...item.tickers],
      image: item.image || null,
      description: item.description || '',
      category: item.category || 'Global',
    }));
  }

  async close() {}
}

// Newest first; equal timestamps ordered by ID descending so
// pagination never skips or repeats articles.
function compare(a, b) {
  if (b.rankAt !== a.rankAt) {
    return b.rankAt - a.rankAt;
  }

  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

module.exports = { MemoryStore };
