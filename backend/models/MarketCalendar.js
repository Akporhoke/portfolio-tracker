const mongoose = require('mongoose');

/*
 * One record per market per date.
 *
 * Stored once globally. October 6 is the same trading day
 * for every Gaze user, so nothing here is per-user.
 *
 * This model only stores data. It does not fetch anything.
 */

const reasonSchema = new mongoose.Schema(
    {
        type: {
            type: String
        },

        name: {
            type: String
        }
    },
    {
        _id: false
    }
);


const marketCalendarSchema = new mongoose.Schema(
    {
        market: {
            type: String,
            enum: ['NGX', 'US'],
            required: true
        },

        // "2026-10-01"
        date: {
            type: String,
            required: true
        },

        // "2026-10" (makes month queries and cleanup simple)
        month: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: ['trading', 'closed', 'early_close'],
            required: true
        },

        reason: {
            type: reasonSchema,
            default: null
        },

        session: {
            open: {
                type: String,
                default: null
            },

            close: {
                type: String,
                default: null
            },

            timeZone: {
                type: String,
                default: null
            }
        },

        verification: {
            primaryStatus: {
                type: String,
                default: null
            },

            secondaryStatus: {
                type: String,
                default: null
            },

            status: {
                type: String,
                enum: ['matched', 'mismatch', 'unverified'],
                default: 'unverified'
            },

            checkedAt: {
                type: Date,
                default: null
            }
        },

        source: {
            primary: {
                type: String,
                default: null
            },

            secondary: {
                type: String,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

marketCalendarSchema.index(
    {
        market: 1,
        date: 1
    },
    {
        unique: true
    }
);

marketCalendarSchema.index({
    month: 1,
    market: 1
});

module.exports =
    mongoose.model(
        'MarketCalendar',
        marketCalendarSchema
    );