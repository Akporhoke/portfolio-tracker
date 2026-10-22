const mongoose = require('mongoose');

/*
 * Persistent history-sync state for one stock, kept separately from the
 * Stock directory so it also works for stocks that have no directory record
 * (for example GBTC, ARGT, SPOT).
 *
 *   status           ok | no_data | failed | unknown
 *   lastCheckedFor   the "expected completed trading date" at the last check
 *   lastCheckedAt    when the provider was last asked
 *   lastSuccessAt    last time the provider returned usable rows
 *   failCount        consecutive failed checks
 *   behindCount      consecutive checks where the provider's newest row was
 *                    older than expected (late, or the stock stopped trading)
 *   nextRetryAt      do not ask the provider again before this time
 */

const historySyncStateSchema = new mongoose.Schema(
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

        status: {
            type: String,
            enum: ['unknown', 'ok', 'no_data', 'failed'],
            default: 'unknown'
        },

        lastCheckedFor: {
            type: String,
            default: null
        },

        lastCheckedAt: {
            type: Date,
            default: null
        },

        lastSuccessAt: {
            type: Date,
            default: null
        },

        failCount: {
            type: Number,
            default: 0
        },

        behindCount: {
            type: Number,
            default: 0
        },

        nextRetryAt: {
            type: Date,
            default: null
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

historySyncStateSchema.index(
    { ticker: 1, market: 1 },
    { unique: true }
);

module.exports =
    mongoose.model(
        'HistorySyncState',
        historySyncStateSchema
    );