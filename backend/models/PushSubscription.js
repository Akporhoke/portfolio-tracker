const mongoose = require('mongoose');

/*
 * One browser/device that agreed to receive push notifications.
 * A user can have several (phone + laptop).
 *
 * Put this file in:  backend/models/PushSubscription.js
 *
 * "endpoint" is a private web address the browser's push service gave
 * us (Google, Mozilla, Apple, Microsoft). Sending a message to it
 * delivers a notification to that one device. It is unique per device,
 * so it is also our key.
 */

const SIX_MONTHS_SECONDS =
    180 * 24 * 60 * 60;

const pushSubscriptionSchema = new mongoose.Schema(
    {
        // Same type as Alert.userId (a string)
        userId: {
            type: String,
            required: true,
            index: true
        },

        endpoint: {
            type: String,
            required: true,
            unique: true
        },

        // Needed to encrypt the message for this device
        keys: {
            p256dh: {
                type: String,
                required: true
            },

            auth: {
                type: String,
                required: true
            }
        },

        userAgent: {
            type: String,
            default: '',
            maxlength: 300
        },

        // Updated when the device re-registers or a push succeeds
        lastSeenAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

// Devices not seen for 6 months are deleted automatically
pushSubscriptionSchema.index(
    { lastSeenAt: 1 },
    { expireAfterSeconds: SIX_MONTHS_SECONDS }
);

module.exports =
    mongoose.model(
        'PushSubscription',
        pushSubscriptionSchema
    );