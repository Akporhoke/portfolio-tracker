'use strict';

// STORE CONTRACT (any database can be plugged in by implementing these four):
//
//   init()                         -> prepare the store
//   upsertMany(items)              -> insert new items; never overwrite an
//                                     existing ID; return count added
//   list({ tickers, limit, before }) -> newest first, ties broken by ID DESC
//                                     tickers: string[] (any match)
//                                     limit: number
//                                     before: { publishedAt, id } | null
//
// Item shape going IN:
// {
//   id,
//   title,
//   url,
//   source,
//   publishedAt,
//   expiresAt,
//   tickers,
//   image,
//   description,
//   category
// }
//
// Item shape returned by list():
// {
//   id,
//   title,
//   url,
//   source,
//   publishedAt,
//   tickers,
//   image,
//   description,
//   category
// }
//
// Times are epoch milliseconds.
// Expired rows are removed after expiresAt.

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

      // Preserve existing records. New RSS data must not overwrite
      // an article that has already been stored.
      if (!this.items.has(item.id)) {
        this.items.set(item.id, {
          id: item.id,
          title: item.title || '',
          url: item.url || '',
          source: item.source || '',
          publishedAt: Number(item.publishedAt) || 0,
          expiresAt: Number(item.expiresAt) || 0,
          tickers: Array.isArray(item.tickers) ? [...item.tickers] : [],
          image: item.image || null,
          description: item.description || '',
          category: item.category || 'Global',
        });

        added += 1;
      }
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

    // Return articles matching at least one requested ticker.
    if (requestedTickers.length) {
      rows = rows.filter((item) =>
        item.tickers.some((ticker) =>
          requestedTickers.includes(String(ticker).toUpperCase())
        )
      );
    }

    // Cursor pagination.
    if (
      before &&
      Number.isFinite(Number(before.publishedAt)) &&
      typeof before.id === 'string'
    ) {
      const cursorTime = Number(before.publishedAt);

      rows = rows.filter(
        (item) =>
          item.publishedAt < cursorTime ||
          (item.publishedAt === cursorTime && item.id < before.id)
      );
    }

    rows.sort(compare);

    return rows.slice(0, safeLimit).map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      tickers: [...item.tickers],
      image: item.image || null,
      description: item.description || '',
      category: item.category || 'Global',
    }));
  }

  async close() {}
}

// Newest first.
// Equal timestamps are ordered by ID descending so pagination
// does not skip or repeat articles.
function compare(a, b) {
  if (b.publishedAt !== a.publishedAt) {
    return b.publishedAt - a.publishedAt;
  }

  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

module.exports = { MemoryStore };