const mongoose = require('mongoose');

/*
 * An in-app notification for one user.
 *
 * dedupeKey makes creating one idempotent: the same alert for the same
 * price observation can never produce two notifications, even if the
 * observation is processed twice.
 *
 * Notifications are deleted automatically after 90 days.
 */

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },

        type: {
            type: String,
            enum: ['price_alert'],
            default: 'price_alert'
        },

        title: {
            type: String,
            required: true
        },

        message: {
            type: String,
            default: ''
        },

        ticker: {
            type: String,
            default: ''
        },

        market: {
            type: String,
            enum: ['NGX', 'US'],
            default: 'NGX'
        },

        alertId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        price: {
            type: Number,
            default: null
        },

        threshold: {
            type: Number,
            default: null
        },

        direction: {
            type: String,
            default: ''
        },

        // When the market price that triggered this was observed
        observedAt: {
            type: Date,
            default: null
        },

        read: {
            type: Boolean,
            default: false
        },

        dedupeKey: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index(
    { dedupeKey: 1 },
    { unique: true }
);

notificationSchema.index(
    { userId: 1, read: 1, createdAt: -1 }
);

notificationSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports =
    mongoose.model(
        'Notification',
        notificationSchema
    );