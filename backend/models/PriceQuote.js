const mongoose = require('mongoose');

/*
 * The last price Gaze obtained for a stock, kept in MongoDB so it
 * survives Render restarts.
 *
 *   price            last successfully fetched price
 *   source           which provider supplied it
 *   sourceTimestamp  when the market traded at that price, ONLY if the
 *                    provider says so (otherwise null: never invented)
 *   fetchedAt        when Gaze received it
 *   lastAttemptAt    last time Gaze tried to refresh it (success or not)
 *   failCount        failed refreshes since the last success
 */

const priceQuoteSchema = new mongoose.Schema(
    {
        ticker: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        market: {
            type: String,
            enum: ['NGX', 'US'],
            required: true
        },

        price: {
            type: Number,
            default: null
        },

        currency: {
            type: String,
            default: ''
        },

        source: {
            type: String,
            default: ''
        },

        sourceTimestamp: {
            type: Date,
            default: null
        },

        fetchedAt: {
            type: Date,
            default: null
        },

        lastAttemptAt: {
            type: Date,
            default: null
        },

        failCount: {
            type: Number,
            default: 0
        },

        lastError: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

priceQuoteSchema.index(
    { ticker: 1, market: 1 },
    { unique: true }
);

module.exports =
    mongoose.model(
        'PriceQuote',
        priceQuoteSchema
    );