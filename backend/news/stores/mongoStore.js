'use strict';

// MongoDB implementation of the News store contract.
//
// Uses the application's existing Mongoose instance.
// Does not create another database connection.
//
// Supports:
// - Article storage and retrieval
// - Duplicate prevention
// - Ticker-based filtering
// - Cursor pagination
// - Automatic expiry through MongoDB TTL
// - Article images, descriptions and categories

function createMongoStore(mongoose, { collection = 'news_items' } = {}) {
if (!mongoose || !mongoose.Schema || !mongoose.models) {
throw new TypeError('A valid Mongoose instance is required.');
}

const schema = new mongoose.Schema(
{
_id: {
type: String,
required: true,
},


  title: {
    type: String,
    required: true,
  },

  url: {
    type: String,
    required: true,
  },

  source: {
    type: String,
    default: 'Unknown',
  },

  publishedAt: {
    type: Date,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  tickers: {
    type: [String],
    default: [],
  },

  // Optional publisher-provided article image.
  image: {
    type: String,
    default: null,
  },

  // Sanitised plain-text article summary.
  description: {
    type: String,
    default: '',
  },

  // Gaze-assigned category.
  category: {
    type: String,
    enum: [
      'NGX',
      'Companies',
      'Economy',
      'Dividends',
      'Global',
    ],
    default: 'Global',
  },
},
{
  versionKey: false,
  collection,
  autoIndex: false,
}
 

);

// Latest articles and stable pagination.
schema.index({
publishedAt: -1,
_id: -1,
});

// Efficient filtering for users following particular stocks.
schema.index({
tickers: 1,
publishedAt: -1,
_id: -1,
});

// Automatically delete articles after their expiry time.
schema.index(
{ expiresAt: 1 },
{ expireAfterSeconds: 0 }
);

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

    operations.push({
      updateOne: {
        filter: { _id: id },

        update: {
          $setOnInsert: {
            title: item.title,
            url: item.url,
            source: item.source || 'Unknown',

            publishedAt: new Date(publishedAt),
            expiresAt: new Date(expiresAt),

            tickers: normaliseTickers(item.tickers),

            image:
              typeof item.image === 'string'
                ? item.image
                : null,

            description:
              typeof item.description === 'string'
                ? item.description
                : '',

            category: [
              'NGX',
              'Companies',
              'Economy',
              'Dividends',
              'Global',
            ].includes(item.category)
              ? item.category
              : 'Global',
          },
        },

        upsert: true,
      },
    });
  }

  if (operations.length === 0) return 0;

  const result = await Model.bulkWrite(operations, {
    ordered: false,
  });

  return result.upsertedCount || 0;
},

async list({
  tickers = [],
  limit = 30,
  before = null,
} = {}) {
  const filter = {};

  const safeTickers = normaliseTickers(tickers);

  if (safeTickers.length) {
    filter.tickers = {
      $in: safeTickers,
    };
  }

  // Cursor pagination:
  // newer records are excluded using the last article's
  // timestamp and ID from the previous page.
  if (before && typeof before === 'object') {
    const timestamp = Number(before.publishedAt);
    const id = String(before.id || '');

    if (
      Number.isFinite(timestamp) &&
      /^[a-f0-9]{24}$/i.test(id)
    ) {
      const date = new Date(timestamp);

      filter.$or = [
        {
          publishedAt: {
            $lt: date,
          },
        },
        {
          publishedAt: date,
          _id: {
            $lt: id,
          },
        },
      ];
    }
  }

  const rows = await Model.find(filter)
    .sort({
      publishedAt: -1,
      _id: -1,
    })
    .limit(normaliseLimit(limit))
    .select(
      'title url source publishedAt tickers image description category'
    )
    .maxTimeMS(3000)
    .lean();

  return rows.map((row) => ({
    id: row._id,
    title: row.title,
    url: row.url,
    source: row.source || 'Unknown',

    publishedAt: row.publishedAt
      ? row.publishedAt.getTime()
      : 0,

    tickers: row.tickers || [],

    image: row.image || null,

    description: row.description || '',

    category: row.category || 'Global',
  }));
},

async close() {
  // The application's Mongoose connection belongs to
  // the application, not this store.
},

};
}

module.exports = { createMongoStore };
