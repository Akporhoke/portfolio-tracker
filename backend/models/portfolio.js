const mongoose = require('mongoose');

// ============================================================
// CONFIDENCE SCHEMA
// ============================================================

const confidenceSchema = new mongoose.Schema(
{
score: {
type: Number,
default: null,
min: 0,
max: 100
},


    signal: {
        type: String,
        default: null
    },

    dataDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 7
    },

    preAddDataDays: {
        type: Number,
        default: 0,
        min: 0
    },

    postAddDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 7
    },

    stockGainPercent: {
        type: Number,
        default: null
    },

    status: {
        type: String,
        enum: [
            'waiting_for_baseline',
            'observing',
            'complete'
        ],
        default: 'waiting_for_baseline'
    },

    isFinal: {
        type: Boolean,
        default: false
    },

    completedAt: {
        type: Date,
        default: null
    },

    finalDate: {
        type: Date,
        default: null
    },

    breakdown: {
        momentum: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },

        stability: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },

        volatility: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },

        volume: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        },

        sector: {
            type: Number,
            default: null,
            min: 0,
            max: 100
        }
    },

    sectorIncluded: {
        type: Boolean,
        default: false
    }
},
{
    _id: false
}


);

// ============================================================
// CONFIDENCE CYCLE SCHEMA
// ============================================================

const confidenceCycleSchema = new mongoose.Schema(
{
startedAt: {
type: Date,
default: null
},


    preAddDays: {
        type: Number,
        default: 0,
        min: 0
    },

    postAddDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 7
    },

    finalScore: {
        type: Number,
        default: null,
        min: 0,
        max: 100
    },

    isFinal: {
        type: Boolean,
        default: false
    },

    finalizedAt: {
        type: Date,
        default: null
    }
},
{
    _id: false
}


);

// ============================================================
// PORTFOLIO SCHEMA
// ============================================================

const portfolioSchema = new mongoose.Schema(
{
userId: {
type: String,
required: true,
index: true
},


    // ======================================================
    // PORTFOLIO STOCKS
    // ======================================================

    stocks: [
        {
            ticker: {
                type: String,
                required: true,
                uppercase: true,
                trim: true
            },

            quantity: {
                type: Number,
                required: true,
                min: 0
            },

            buyPrice: {
                type: Number,
                required: true,
                min: 0
            },

            currentPrice: {
                type: Number,
                default: null,
                min: 0
            },

            sector: {
                type: String,
                default: ''
            },

            notes: {
                type: String,
                default: ''
            },

            market: {
                type: String,
                enum: ['NGX', 'US'],
                required: true
            },

            confidenceLevel: {
                type: confidenceSchema,
                default: () => ({})
            },

            dateAdded: {
                type: Date,
                default: Date.now
            }
        }
    ],


    // ======================================================
    // WATCHLIST
    // ======================================================

    watchlist: [
        {
            ticker: {
                type: String,
                required: true,
                uppercase: true,
                trim: true
            },

            currentPrice: {
                type: Number,
                default: null,
                min: 0
            },

            priceAtAdd: {
                type: Number,
                default: null,
                min: 0
            },

            watchingDuration: {
                type: String,
                enum: ['2d', '1w', '2w'],
                default: '1w'
            },

            sector: {
                type: String,
                default: null
            },

            notes: {
                type: String,
                default: ''
            },

            market: {
                type: String,
                enum: ['NGX', 'US'],
                required: true
            },

            confidenceLevel: {
                type: confidenceSchema,
                default: () => ({})
            },

            confidenceCycle: {
                type: confidenceCycleSchema,
                default: () => ({})
            },

            lastProcessedDate: {
              type: String,
              default: null
           },

            dateAdded: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    ],


    // ======================================================
    // SOLD
    // ======================================================

    sold: [
        {
            ticker: {
                type: String,
                required: true,
                uppercase: true,
                trim: true
            },

            quantity: {
                type: Number,
                required: true,
                min: 0
            },

            buyPrice: {
                type: Number,
                required: true,
                min: 0
            },

            sellPrice: {
                type: Number,
                required: true,
                min: 0
            },

            sector: {
                type: String,
                default: ''
            },

            market: {
                type: String,
                enum: ['NGX', 'US'],
                required: true
            },

            dateSold: {
                type: Date,
                default: Date.now
            }
        }
    ],


    // ======================================================
    // ACTIVITY
    // ======================================================

    activity: [
        {
            type: {
                type: String,

                enum: [
                    'invested',
                    'sold',
                    'rejected',
                    'watching',

                    // Current route activity types
                    'stock_added',
                    'watchlist_added',
                    'watchlist_to_portfolio',
                    'watchlist_removed'
                ]
            },

            title: {
                type: String,
                default: ''
            },

            description: {
                type: String,
                default: ''
            },

            date: {
                type: Date,
                default: Date.now
            }
        }
    ],


    // ======================================================
    // SETTINGS
    // ======================================================

    settings: {
        goalAmount: {
            type: Number,
            default: 1000000,
            min: 0
        },

        displayCurrency: {
            type: String,
            default: 'NGN',
            enum: ['NGN', 'USD']
        }
    },


    // ======================================================
    // CREATED AT
    // ======================================================

    createdAt: {
        type: Date,
        default: Date.now
    }
}


);

module.exports = mongoose.model(
'Portfolio',
portfolioSchema
);