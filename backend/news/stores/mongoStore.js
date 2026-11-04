'use strict';

// MongoDB implementation of the store contract (see memoryStore.js).
// It receives the app's existing mongoose instance, so it opens no second
// connection and this module has no hard dependency on mongoose itself.
//
// Footprint: roughly 0.5 KB per story, at most about 150 stories per feed
// refresh window, auto-deleted after expiresAt. Expect well under 1 MB total.

function createMongoStore(mongoose, { collection = 'news_items' } = {}) {
  const schema = new mongoose.Schema(
    {
      _id: { type: String }, // 24-hex hash of the title, so duplicates cannot exist
      title: String,
      url: String,
      source: String,
      publishedAt: Date,
      expiresAt: Date,
      tickers: [String],
    },
    { versionKey: false, collection, autoIndex: false }
  );

  schema.index({ publishedAt: -1, _id: -1 });                // latest news
  schema.index({ tickers: 1, publishedAt: -1, _id: -1 });    // news for chosen stocks
  // TTL on a per-document expiry time (expireAfterSeconds: 0). Changing the
  // retention setting later never needs an index change, so no migration.
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  const Model = mongoose.models.GazeNewsItem || mongoose.model('GazeNewsItem', schema);

  return {
    async init() {
      await Model.createIndexes();
    },

    async upsertMany(items) {
      if (!items.length) return 0;
      // $setOnInsert: an existing story is never rewritten, so repeated
      // refreshes cost almost no writes and cannot change stored data.
      const ops = items.map((it) => ({
        updateOne: {
          filter: { _id: String(it.id) },
          update: {
            $setOnInsert: {
              title: it.title,
              url: it.url,
              source: it.source,
              publishedAt: new Date(it.publishedAt),
              expiresAt: new Date(it.expiresAt),
              tickers: it.tickers,
            },
          },
          upsert: true,
        },
      }));
      const res = await Model.bulkWrite(ops, { ordered: false });
      return res.upsertedCount || 0;
    },

    async list({ tickers = [], limit = 30, before = null } = {}) {
      const filter = {};
      // Values are coerced to strings and numbers here as a second line of
      // defence against NoSQL operator injection (the route validates first).
      if (tickers.length) filter.tickers = { $in: tickers.map(String) };
      if (before) {
        const d = new Date(Number(before.publishedAt));
        const id = String(before.id);
        filter.$or = [{ publishedAt: { $lt: d } }, { publishedAt: d, _id: { $lt: id } }];
      }
      const rows = await Model.find(filter)
        .sort({ publishedAt: -1, _id: -1 })
        .limit(Math.min(Math.max(Number(limit) || 30, 1), 50))
        .select('title url source publishedAt tickers')
        .maxTimeMS(3000) // a slow query fails fast instead of piling up
        .lean();

      return rows.map((r) => ({
        id: r._id,
        title: r.title,
        url: r.url,
        source: r.source,
        publishedAt: r.publishedAt.getTime(),
        tickers: r.tickers || [],
      }));
    },

    async close() {
      // The mongoose connection belongs to the app, not to this module.
    },
  };
}

module.exports = { createMongoStore };
