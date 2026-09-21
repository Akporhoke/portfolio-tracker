const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
    {
        // ========================================================
        // BASIC STOCK IDENTITY
        // ========================================================

        ticker: {
            type: String,
            required: true,
            uppercase: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ========================================================
        // MARKET INFORMATION
        // ========================================================

        market: {
            type: String,
            enum: ['NGX', 'US'],
            required: true
        },

        exchange: {
            type: String,
            default: ''
        },

        country: {
            type: String,
            default: ''
        },


        // ========================================================
        // COMPANY INFORMATION
        // ========================================================

        sector: {
            type: String,
            default: ''
        },

        industry: {
            type: String,
            default: ''
        },

        marketCap: {
    type: Number,
    default: null
},

isSP500: {
    type: Boolean,
    default: false
},


        // ========================================================
        // SEARCH ALIASES
        // ========================================================

        aliases: {
            type: [String],
            default: []
        },


        // ========================================================
        // DIRECTORY STATUS
        // ========================================================

        active: {
    type: Boolean,
    default: true
},

lastStatusCheck: {
    type: Date,
    default: null
},

historyStatus: {
    type: String,
    enum: [
        'available',
        'unavailable',
        'unknown'
    ],
    default: 'unknown'
},



        // ========================================================
        // DATA SOURCE
        // ========================================================

        source: {
            type: String,
            default: ''
        },


        // ========================================================
        // TIMESTAMPS
        // ========================================================

        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    {
        timestamps: true
    }
);


// ============================================================
// UNIQUE STOCK IDENTITY
//
// A ticker can exist in different markets.
// Example:
// AAPL + US
// SomeTicker + NGX
// ============================================================

stockSchema.index(
    {
        ticker: 1,
        market: 1
    },
    {
        unique: true
    }
);


// ============================================================
// SEARCH INDEXES
// ============================================================

stockSchema.index({
    ticker: 1
});

stockSchema.index({
    name: 1
});

stockSchema.index({
    market: 1
});


// ============================================================
// MODEL
// ============================================================

module.exports =
    mongoose.model(
        'Stock',
        stockSchema
    );