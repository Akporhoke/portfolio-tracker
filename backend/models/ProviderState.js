const mongoose = require('mongoose');

const providerStateSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                'available',
                'quota_exceeded'
            ],
            default: 'available'
        },

        cooldownUntil: {
            type: Date,
            default: null
        },

        lastError: {
            type: String,
            default: ''
        },

                reportedUsed: {
            type: Number,
            default: null
        },

        reportedRemaining: {
            type: Number,
            default: null
        },

        reportedAt: {
            type: Date,
            default: null
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }
    }
);

module.exports =
    mongoose.model(
        'ProviderState',
        providerStateSchema
    );