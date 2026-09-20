const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
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

        date: {
            type: String,
            required: true
        },

        open: {
            type: Number,
            default: null
        },

        high: {
            type: Number,
            default: null
        },

        low: {
            type: Number,
            default: null
        },

        close: {
            type: Number,
            required: true
        },

        volume: {
            type: Number,
            default: null
        },

        source: {
            type: String,
            default: 'unknown'
        }
    },
    {
        timestamps: true
    }
);

priceHistorySchema.index(
    {
        ticker: 1,
        market: 1,
        date: 1
    },
    {
        unique: true
    }
);

priceHistorySchema.index({
    ticker: 1,
    market: 1,
    date: -1
});

module.exports =
    mongoose.model(
        'PriceHistory',
        priceHistorySchema
    );