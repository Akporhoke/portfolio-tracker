const mongoose = require('mongoose');

/*
 * A price alert: "tell me when TICKER rises above / falls below THRESHOLD".
 *
 * The alert remembers the last price it saw (lastObservedPrice and the time
 * of that observation). A crossing is a move from one side of the threshold
 * to the other BETWEEN two observations, so:
 *
 *   - a price that stays above the threshold does not fire again
 *   - an alert created while the price is already beyond the threshold
 *     waits for the price to come back and cross
 *   - the same observation seen twice is ignored
 *
 * Only crossings between prices Gaze actually receives can be detected.
 * A price that crosses and comes back between two refreshes is not seen.
 */

const alertSchema = new mongoose.Schema(
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
            enum: ['NGX', 'US'],
            required: true
        },

        direction: {
            type: String,
            enum: ['above', 'below'],
            required: true
        },

        // In the stock's own currency (NGN for NGX, USD for US)
        threshold: {
            type: Number,
            required: true,
            min: 0
        },

        // active: being watched | triggered: fired once and finished
        // paused: switched off by the user
        status: {
            type: String,
            enum: ['active', 'triggered', 'paused'],
            default: 'active'
        },

        // false: fire once, then finish. true: stay active after firing,
        // but not again until the cooldown has passed AND the price has
        // crossed again.
        repeat: {
            type: Boolean,
            default: false
        },

        cooldownMinutes: {
            type: Number,
            default: 60,
            min: 1
        },

        cooldownUntil: {
            type: Date,
            default: null
        },

        lastObservedPrice: {
            type: Number,
            default: null
        },

        lastObservedFetchedAt: {
            type: Date,
            default: null
        },

        lastTriggeredAt: {
            type: Date,
            default: null
        },

        triggeredPrice: {
            type: Number,
            default: null
        },

        triggerCount: {
            type: Number,
            default: 0
        },

        note: {
            type: String,
            default: '',
            maxlength: 200
        }
    },
    {
        timestamps: true
    }
);

alertSchema.index({ status: 1, ticker: 1, market: 1 });
alertSchema.index({ userId: 1, status: 1 });

module.exports =
    mongoose.model(
        'Alert',
        alertSchema
    );