'use strict';

// MongoDB implementation of the News store contract.
// Uses the application's existing Mongoose instance (no extra connection).

const CATEGORIES = ['NGX', 'Companies', 'Economy', 'Dividends', 'Global'];

function createMongoStore(mongoose, { collection = 'news_items' } = {}) {
  if (!mongoose || !mongoose.Schema || !mongoose.models) {
    throw new TypeError('A valid Mongoose instance is required.');
  }

  const schema = new mongoose.Schema(
    {
      _id: { type: String, required: true },
      title: { type: String, required: true },
      url: { type: String, required: true },
      source: { type: String, default: 'Unknown' },
      publishedAt: { type: Date, required: true },
      expiresAt: { type: Date, required: true },
      rankAt: { type: Date, default: null }, // publish time + relevance boost
      tickers: { type: [String], default: [] },
      image: { type: String, default: null },
      description: { type: String, default: '' },
      category: { type: String, enum: CATEGORIES, default: 'Global' },
    },
    { versionKey: false, collection, autoIndex: false }
  );

  // Ranked feed and stable pagination.
  schema.index({ rankAt: -1, _id: -1 });

  // Efficient filtering for users following particular stocks.
  schema.index({ tickers: 1, rankAt: -1, _id: -1 });

  // Automatically delete articles after their expiry time.
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  const Model =
    mongoose.models.GazeNewsItem ||
    mongoose.model('GazeNewsItem', schema);

  function normaliseLimit(value) {
    const limit = Number(value);

    if (!Number.isFinite(limit)) return 30;

    return Math.min(Math.max(Math.floor(limit), 1), 50);
  }

  function normaliseTickers(tickers) {
    if (!Array.isArray(tickers)) return [];

    return tickers
      .map((ticker) => String(ticker).toUpperCase())
      .filter((ticker) => /^[A-Z0-9]{1,15}$/.test(ticker))
      .slice(0, 20);
  }

  function toEpoch(value) {
    const date = value instanceof Date ? value : new Date(value);
    const timestamp = date.getTime();

    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return {
    async init() {
      await Model.createIndexes();

      // One-time upgrade: articles saved before ranking existed get
      // rankAt = publishedAt so they still sort correctly.
      try {
        await Model.updateMany(
          { rankAt: null },
          [{ $set: { rankAt: '$publishedAt' } }]
        );
      } catch (error) {
        console.warn('[news] rankAt backfill skipped:', error.message);
      }
    },

    async upsertMany(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return 0;
      }

      const operations = [];

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        const id = String(item.id || '');
        const publishedAt = toEpoch(item.publishedAt);
        const expiresAt = toEpoch(item.expiresAt);

        if (
          !/^[a-f0-9]{24}$/i.test(id) ||
          !publishedAt ||
          !expiresAt ||
          typeof item.title !== 'string' ||
          typeof item.url !== 'string'
        ) {
          continue;
        }

        const category = CATEGORIES.includes(item.category)
          ? item.category
          : 'Global';

        const description =
          typeof item.description === 'string' ? item.description : '';

        const rankAtMs = toEpoch(item.rankAt) || publishedAt;

        // Fields that are fixed once the article exists.
        const update = {
          $setOnInsert: {
            title: item.title,
            url: item.url,
            source: item.source || 'Unknown',
            publishedAt: new Date(publishedAt),
            expiresAt: new Date(expiresAt),
            tickers: normaliseTickers(item.tickers),
          },

          // Fields that may improve later (image found, cleaner text).
          // Always set category; image and description only when we
          // actually have a value, so an empty result never erases
          // good data that is already stored.
          $set: { category, rankAt: new Date(rankAtMs) },
        };

        if (typeof item.image === 'string' && item.image) {
          update.$set.image = item.image;
        } else {
          // Insert-only default; never overwrites an existing image.
          update.$setOnInsert.image = null;
        }

        if (description) {
          update.$set.description = description;
        } else {
          update.$setOnInsert.description = '';
        }

        operations.push({
          updateOne: {
            filter: { _id: id },
            update,
            upsert: true,
          },
        });
      }

      if (operations.length === 0) return 0;

      const result = await Model.bulkWrite(operations, { ordered: false });

      return result.upsertedCount || 0;
    },

    async list({ tickers = [], limit = 30, before = null } = {}) {
      const filter = {};

      const safeTickers = normaliseTickers(tickers);

      if (safeTickers.length) {
        filter.tickers = { $in: safeTickers };
      }

      // Cursor pagination. NOTE: "publishedAt" in the cursor is really the
      // article's rankAt (the route passes it through under this name).
      if (before && typeof before === 'object') {
        const timestamp = Number(before.publishedAt);
        const id = String(before.id || '');

        if (Number.isFinite(timestamp) && /^[a-f0-9]{24}$/i.test(id)) {
          const date = new Date(timestamp);

          filter.$or = [
            { rankAt: { $lt: date } },
            { rankAt: date, _id: { $lt: id } },
          ];
        }
      }

      const rows = await Model.find(filter)
        .sort({ rankAt: -1, _id: -1 })
        .limit(normaliseLimit(limit))
        .select('title url source publishedAt rankAt tickers image description category')
        .maxTimeMS(3000)
        .lean();

      return rows.map((row) => ({
        id: row._id,
        title: row.title,
        url: row.url,
        source: row.source || 'Unknown',
        publishedAt: row.publishedAt ? row.publishedAt.getTime() : 0,
        rankAt: row.rankAt
          ? row.rankAt.getTime()
          : (row.publishedAt ? row.publishedAt.getTime() : 0),
        tickers: row.tickers || [],
        image: row.image || null,
        description: row.description || '',
        category: row.category || 'Global',
      }));
    },

    async close() {
      // The Mongoose connection belongs to the application.
    },
  };
}

module.exports = { createMongoStore };
