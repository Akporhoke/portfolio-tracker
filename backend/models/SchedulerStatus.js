const mongoose = require('mongoose');

const schedulerStatusSchema = new mongoose.Schema(
    {
        job: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        status: {
            type: String,
            enum: [
                'idle',
                'running',
                'success',
                'failed'
            ],
            default: 'idle'
        },

        startedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        },

        lastSuccessfulAt: {
            type: Date,
            default: null
        },

        stocksFound: {
            type: Number,
            default: 0
        },

        initialFetches: {
            type: Number,
            default: 0
        },

        incrementalFetches: {
            type: Number,
            default: 0
        },

        alreadyCurrent: {
            type: Number,
            default: 0
        },

        skipped: {
            type: Number,
            default: 0
        },

        failed: {
            type: Number,
            default: 0
        },

        apiFetches: {
            type: Number,
            default: 0
        },

        safetyCapReached: {
            type: Boolean,
            default: false
        },

        error: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        'SchedulerStatus',
        schedulerStatusSchema
    );