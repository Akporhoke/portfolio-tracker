const mongoose = require('mongoose');

const gazeEventSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        symbol: {
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

        type: {
            type: String,
            enum: [
                'price_move'
            ],
            required: true
        },

        importance: {
            type: String,
            enum: [
                'minor',
                'significant',
                'major'
            ],
            required: true
        },

        date: {
            type: String,
            required: true
        },

        data: {
            previousPrice: {
                type: Number,
                default: null
            },

            currentPrice: {
                type: Number,
                default: null
            },

            changePercent: {
                type: Number,
                default: null
            }
        },

        summary: {
            type: String,
            required: true
        },

        explanation: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

/*
 * Prevent the same price event from being
 * recorded more than once for a stock/day.
 */
gazeEventSchema.index(
    {
        userId: 1,
        symbol: 1,
        market: 1,
        type: 1,
        date: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    'GazeEvent',
    gazeEventSchema
);