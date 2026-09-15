const mongoose = require('mongoose');

const priceSnapshotSchema = new mongoose.Schema(
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

        price: {
            type: Number,
            required: true
        },

        source: {
            type: String,
            default: 'recorded'
        }

    },
    {
        timestamps: true
    }
);

/*
 * Only one real snapshot per stock/market/trading day.
 *
 * This prevents:
 *
 * GTCO - 2026-09-05
 * GTCO - 2026-09-05
 * GTCO - 2026-09-05
 *
 * from becoming three observations.
 */

priceSnapshotSchema.index(
    {
        ticker: 1,
        market: 1,
        date: 1
    },
    {
        unique: true
    }
);

module.exports =
    mongoose.model(
        'PriceSnapshot',
        priceSnapshotSchema
    );