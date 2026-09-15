const mongoose = require('mongoose');
require('dotenv').config();

// ============================================================
// MONGODB CONNECTION
// ============================================================

const MONGODB_URI =
process.env.MONGODB_URI ||
process.env.MONGO_URI ||
process.env.MONGODB_URL;

if (!MONGODB_URI) {
console.error('❌ MongoDB connection string is missing from .env');
console.error(
'Expected one of: MONGODB_URI, MONGO_URI, or MONGODB_URL'
);
process.exit(1);
}

// ============================================================
// EMPTY CONFIDENCE OBJECT
// ============================================================

function createEmptyConfidence() {
return {
score: null,
signal: null,


    dataDays: 0,
    preAddDataDays: 0,
    postAddDays: 0,

    stockGainPercent: null,

    status: 'waiting_for_baseline',

    isFinal: false,

    completedAt: null,
    finalDate: null,

    breakdown: {
        momentum: null,
        stability: null,
        volatility: null,
        volume: null,
        sector: null
    },

    sectorIncluded: false
};


}

// ============================================================
// CHECK WHETHER VALUE IS A VALID CONFIDENCE OBJECT
// ============================================================

function isConfidenceObject(value) {
return (
value &&
typeof value === 'object' &&
!Array.isArray(value)
);
}

// ============================================================
// MAIN MIGRATION
// ============================================================

async function migrateConfidence() {


let connected = false;

try {

    console.log('');
    console.log('============================================');
    console.log(' CONFIDENCE LEVEL DATABASE MIGRATION');
    console.log('============================================');
    console.log('');

    // --------------------------------------------------------
    // CONNECT
    // --------------------------------------------------------

    console.log('→ Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI);

    connected = true;

    console.log('✓ MongoDB connected');
    console.log('');

    // --------------------------------------------------------
    // RAW COLLECTION
    // --------------------------------------------------------

    const db = mongoose.connection.db;
    const collection = db.collection('portfolios');

    console.log('→ Reading portfolio collection...');

    const portfolios = await collection.find({}).toArray();

    console.log(
        `✓ Found ${portfolios.length} portfolio document(s)`
    );

    console.log('');

    // --------------------------------------------------------
    // COUNTERS
    // --------------------------------------------------------

    let portfoliosChanged = 0;

    let stocksMigrated = 0;

    let watchlistMigrated = 0;

    let legacyNumbersFound = 0;

    let missingConfidenceCreated = 0;

    let alreadyCorrect = 0;

    // ========================================================
    // PROCESS PORTFOLIOS
    // ========================================================

    for (const portfolio of portfolios) {

        let changed = false;

        // ====================================================
        // STOCKS
        // ====================================================

        if (Array.isArray(portfolio.stocks)) {

            for (let i = 0; i < portfolio.stocks.length; i++) {

                const stock = portfolio.stocks[i];

                if (!stock) continue;

                const confidence = stock.confidenceLevel;

                // ------------------------------------------------
                // LEGACY NUMBER
                // ------------------------------------------------

                if (typeof confidence === 'number') {

                    console.log(
                        `→ Migrating stocks[${i}] ${stock.ticker || 'UNKNOWN'}`
                    );

                    console.log(
                        `   Old value: ${confidence}`
                    );

                    stock.confidenceLevel =
                        createEmptyConfidence();

                    stocksMigrated++;
                    legacyNumbersFound++;
                    changed = true;

                    console.log(
                        '   New value: empty confidence object'
                    );

                    continue;
                }

                // ------------------------------------------------
                // NULL / MISSING
                // ------------------------------------------------

                if (
                    confidence === null ||
                    confidence === undefined
                ) {

                    console.log(
                        `→ Creating confidence object for stocks[${i}] ${stock.ticker || 'UNKNOWN'}`
                    );

                    stock.confidenceLevel =
                        createEmptyConfidence();

                    stocksMigrated++;
                    missingConfidenceCreated++;
                    changed = true;

                    continue;
                }

                // ------------------------------------------------
                // OBJECT
                // ------------------------------------------------

                if (isConfidenceObject(confidence)) {

                    alreadyCorrect++;

                }

            }

        }


        // ====================================================
        // WATCHLIST
        // ====================================================

        if (Array.isArray(portfolio.watchlist)) {

            for (let i = 0; i < portfolio.watchlist.length; i++) {

                const item = portfolio.watchlist[i];

                if (!item) continue;

                const confidence =
                    item.confidenceLevel;

                // ------------------------------------------------
                // LEGACY NUMBER
                // ------------------------------------------------

                if (typeof confidence === 'number') {

                    console.log(
                        `→ Migrating watchlist[${i}] ${item.ticker || 'UNKNOWN'}`
                    );

                    console.log(
                        `   Old value: ${confidence}`
                    );

                    item.confidenceLevel =
                        createEmptyConfidence();

                    watchlistMigrated++;
                    legacyNumbersFound++;
                    changed = true;

                    console.log(
                        '   New value: empty confidence object'
                    );

                    continue;
                }

                // ------------------------------------------------
                // NULL / MISSING
                // ------------------------------------------------

                if (
                    confidence === null ||
                    confidence === undefined
                ) {

                    console.log(
                        `→ Creating confidence object for watchlist[${i}] ${item.ticker || 'UNKNOWN'}`
                    );

                    item.confidenceLevel =
                        createEmptyConfidence();

                    watchlistMigrated++;
                    missingConfidenceCreated++;
                    changed = true;

                    continue;
                }

                // ------------------------------------------------
                // OBJECT
                // ------------------------------------------------

                if (isConfidenceObject(confidence)) {

                    alreadyCorrect++;

                }

            }

        }


        // ====================================================
        // WRITE PORTFOLIO
        // ====================================================

        if (changed) {

            await collection.replaceOne(
                {
                    _id: portfolio._id
                },
                portfolio
            );

            portfoliosChanged++;

            console.log(
                `✓ Portfolio ${portfolio._id} updated`
            );

            console.log('');

        }

    }


    // ========================================================
    // VERIFICATION
    // ========================================================

    console.log('');
    console.log('============================================');
    console.log(' VERIFYING DATABASE');
    console.log('============================================');
    console.log('');

    const verification =
        await collection.find({}).toArray();

    let remainingNumericValues = 0;

    let remainingMissingValues = 0;

    for (const portfolio of verification) {

        if (Array.isArray(portfolio.stocks)) {

            for (const stock of portfolio.stocks) {

                if (!stock) continue;

                if (
                    typeof stock.confidenceLevel === 'number'
                ) {

                    remainingNumericValues++;

                    console.error(
                        `❌ Numeric stock confidence remains: ${stock.ticker || 'UNKNOWN'}`
                    );

                }

                if (
                    stock.confidenceLevel === null ||
                    stock.confidenceLevel === undefined
                ) {

                    remainingMissingValues++;

                    console.error(
                        `❌ Missing stock confidence remains: ${stock.ticker || 'UNKNOWN'}`
                    );

                }

            }

        }


        if (Array.isArray(portfolio.watchlist)) {

            for (const item of portfolio.watchlist) {

                if (!item) continue;

                if (
                    typeof item.confidenceLevel === 'number'
                ) {

                    remainingNumericValues++;

                    console.error(
                        `❌ Numeric watchlist confidence remains: ${item.ticker || 'UNKNOWN'}`
                    );

                }

                if (
                    item.confidenceLevel === null ||
                    item.confidenceLevel === undefined
                ) {

                    remainingMissingValues++;

                    console.error(
                        `❌ Missing watchlist confidence remains: ${item.ticker || 'UNKNOWN'}`
                    );

                }

            }

        }

    }


    // ========================================================
    // SUMMARY
    // ========================================================

    console.log('');
    console.log('============================================');
    console.log(' MIGRATION SUMMARY');
    console.log('============================================');

    console.log(
        `Portfolio documents changed:       ${portfoliosChanged}`
    );

    console.log(
        `Stock confidence values migrated:   ${stocksMigrated}`
    );

    console.log(
        `Watchlist confidence values migrated: ${watchlistMigrated}`
    );

    console.log(
        `Legacy numeric values found:        ${legacyNumbersFound}`
    );

    console.log(
        `Missing confidence objects created:  ${missingConfidenceCreated}`
    );

    console.log(
        `Already-correct objects:             ${alreadyCorrect}`
    );

    console.log('');

    console.log(
        `Remaining numeric values:            ${remainingNumericValues}`
    );

    console.log(
        `Remaining missing values:            ${remainingMissingValues}`
    );

    console.log('');

    if (
        remainingNumericValues === 0 &&
        remainingMissingValues === 0
    ) {

        console.log(
            '✅ DATABASE VERIFICATION PASSED'
        );

        console.log(
            '✓ No numeric confidenceLevel values remain.'
        );

        console.log(
            '✓ No missing confidenceLevel values remain.'
        );

        console.log(
            '✓ Portfolio documents are ready for the new confidence system.'
        );

    } else {

        console.error(
            '❌ DATABASE VERIFICATION FAILED'
        );

        console.error(
            'Some confidenceLevel values still need migration.'
        );

        process.exitCode = 1;

    }

    console.log('');

} catch (error) {

    console.error('');
    console.error('============================================');
    console.error(' ❌ MIGRATION FAILED');
    console.error('============================================');

    console.error(error);

    process.exitCode = 1;

} finally {

    if (connected) {

        try {

            await mongoose.connection.close();

            console.log(
                '✓ MongoDB connection closed'
            );

        } catch (error) {

            console.error(
                '⚠️ Error closing MongoDB connection:',
                error.message
            );

        }

    }

}


}

// ============================================================
// RUN
// ============================================================

migrateConfidence();
