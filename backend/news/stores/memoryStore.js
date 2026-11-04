'use strict';

// STORE CONTRACT (any database can be plugged in by implementing these four):
//
//   init()                      -> prepare the store (create indexes, tables)
//   upsertMany(items)           -> insert items that do not exist yet; never
//                                  overwrite an existing id; returns count added
//   list({tickers, limit, before}) -> newest first, ties broken by id descending.
//                                  tickers: string[] (any match), limit: number,
//                                  before: {publishedAt:number, id:string} | null
//                                  returns [{id,title,url,source,publishedAt,tickers}]
//   close()                     -> release resources the store owns
//
// Item shape going IN: {id,title,url,source,publishedAt,expiresAt,tickers}
// (times are epoch milliseconds). Old rows must be removed after expiresAt.
// A SQL store needs one table with these columns, an index on
// (published_at DESC, id DESC) and a join or array column for tickers.

class MemoryStore {
  constructor({ maxItems = 500 } = {}) {
    this.items = new Map();
    this.maxItems = maxItems;
  }

  async init() {}

  async upsertMany(items) {
    let added = 0;
    for (const item of items) {
      if (!this.items.has(item.id)) {
        this.items.set(item.id, item);
        added += 1;
      }
    }
    this.prune(Date.now());
    return added;
  }

  prune(now) {
    for (const [id, item] of this.items) {
      if (item.expiresAt <= now) this.items.delete(id);
    }
    if (this.items.size > this.maxItems) {
      const newestFirst = [...this.items.values()].sort(compare);
      for (const item of newestFirst.slice(this.maxItems)) this.items.delete(item.id);
    }
  }

  async list({ tickers = [], limit = 30, before = null } = {}) {
    this.prune(Date.now());
    let rows = [...this.items.values()];
    if (tickers.length) {
      rows = rows.filter((r) => r.tickers.some((t) => tickers.includes(t)));
    }
    if (before) {
      rows = rows.filter(
        (r) =>
          r.publishedAt < before.publishedAt ||
          (r.publishedAt === before.publishedAt && r.id < before.id)
      );
    }
    rows.sort(compare);
    return rows.slice(0, limit).map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      source: r.source,
      publishedAt: r.publishedAt,
      tickers: r.tickers,
    }));
  }

  async close() {}
}

// Newest first; equal timestamps ordered by id so paging never skips or repeats.
function compare(a, b) {
  if (b.publishedAt !== a.publishedAt) return b.publishedAt - a.publishedAt;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

module.exports = { MemoryStore };
