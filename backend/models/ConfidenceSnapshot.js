const mongoose = require('mongoose');

const confidenceSnapshotSchema =
    new mongoose.Schema(
        {
            userId: {
                type: String,
                required: true,
                index: true
            },

            ticker: {
                type: String,
                required: true,
                uppercase: true,
                trim: true
            },

            market: {
                type: String,
                required: true,
                enum: ['NGX', 'US']
            },

            /*
             * Trading date represented as YYYY-MM-DD.
             *
             * A snapshot is tied to a trading date,
             * not the exact time the scheduler ran.
             */
            date: {
                type: String,
                required: true
            },

            score: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },

            signal: {
                type: String,
                default: null
            },

            dataDays: {
                type: Number,
                default: 0,
                min: 0,
                max: 7
            },

            preAddDataDays: {
                type: Number,
                default: 0,
                min: 0
            },

            postAddDays: {
                type: Number,
                default: 0,
                min: 0,
                max: 7
            },

            stockGainPercent: {
                type: Number,
                default: null
            },

            breakdown: {
                momentum: {
                    type: Number,
                    default: null,
                    min: 0,
                    max: 100
                },

                stability: {
                    type: Number,
                    default: null,
                    min: 0,
                    max: 100
                },

                volatility: {
                    type: Number,
                    default: null,
                    min: 0,
                    max: 100
                },

                volume: {
                    type: Number,
                    default: null,
                    min: 0,
                    max: 100
                },

                sector: {
                    type: Number,
                    default: null,
                    min: 0,
                    max: 100
                }
            },

            sectorIncluded: {
                type: Boolean,
                default: false
            },

            isFinal: {
                type: Boolean,
                default: false
            },

            calculatedAt: {
                type: Date,
                default: Date.now
            }
        },

        {
            timestamps: true
        }
    );

/*
 * One confidence snapshot per user,
 * stock, market and trading date.
 *
 * If the scheduler runs multiple times
 * on the same day, the existing snapshot
 * can be updated instead of creating
 * duplicates.
 */
confidenceSnapshotSchema.index(
    {
        userId: 1,
        ticker: 1,
        market: 1,
        date: 1
    },
    {
        unique: true
    }
);

/*
 * Optimized for confidence-history queries.
 */
confidenceSnapshotSchema.index(
    {
        userId: 1,
        ticker: 1,
        market: 1,
        date: -1
    }
);

module.exports =
    mongoose.model(
        'ConfidenceSnapshot',
        confidenceSnapshotSchema
    );