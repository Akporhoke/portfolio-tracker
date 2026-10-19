const mongoose = require('mongoose');

/*
 * One row per outbound request to a market-data provider.
 * Written BEFORE the request is sent, so a crash still counts.
 * Rows older than 40 days are deleted automatically
 * (the longest window we need is one calendar month).
 */

const providerRequestLogSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true
    },

    endpoint: {
        type: String,
        default: ''
    },

    at: {
        type: Date,
        default: Date.now
    }
});

providerRequestLogSchema.index({ provider: 1, at: -1 });

providerRequestLogSchema.index(
    { at: 1 },
    { expireAfterSeconds: 40 * 24 * 60 * 60 }
);

module.exports =
    mongoose.model(
        'ProviderRequestLog',
        providerRequestLogSchema
    );