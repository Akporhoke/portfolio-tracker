const mongoose = require('mongoose');
require('dotenv').config();

const Stock = require('./models/stock');

const API_BASE =
    'https://top-us-stock-tickers.zyhe.me/api/v2/tickers';

const PAGE_SIZE = 500;

const HEADERS = {
    'User-Agent': 'Gaze-Stock-Directory/1.0'
};


/* ============================================
   FETCH ONE PAGE
   ============================================ */

async function fetchPage(offset) {
    const url =
        `${API_BASE}?collection=us&limit=${PAGE_SIZE}&offset=${offset}`;

    const response = await fetch(url, {
        headers: HEADERS
    });

    if (!response.ok) {
        throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}


/* ============================================
   FETCH ENTIRE US DIRECTORY
   ============================================ */

async function fetchAllStocks() {
    const allStocks = [];

    let offset = 0;

    while (true) {
        console.log(
            `→ Fetching US stocks ${offset + 1}...`
        );

        const data = await fetchPage(offset);

        const items = Array.isArray(data.items)
            ? data.items
            : [];

        if (items.length === 0) {
            break;
        }

        allStocks.push(...items);

        console.log(
            `  ✓ Received ${items.length} stocks`
        );

        console.log(
            `  Total collected: ${allStocks.length}`
        );

        if (
            data.next_offset === null ||
            data.next_offset === undefined
        ) {
            break;
        }

        offset = data.next_offset;
    }

    return allStocks;
}


/* ============================================
   CLEAN / NORMALIZE STOCK
   ============================================ */

function normalizeStock(stock) {
    const ticker =
        String(stock.symbol || '')
            .trim()
            .toUpperCase();

    const name =
        String(stock.name || '')
            .trim();

    if (!ticker || !name) {
        return null;
    }

    return {
        ticker,
        name,

        market: 'US',

        exchange: 'US',

        country:
            stock.country || 'United States',

        sector:
            stock.sector || '',

        industry:
            stock.industry || '',

        marketCap:
            typeof stock.market_cap === 'number'
                ? stock.market_cap
                : null,

        isSP500:
            stock.is_sp500 === true,

        active: true,

        source:
            'top-us-stock-tickers',

        lastUpdated: new Date()
    };
}


/* ============================================
   MAIN SYNC
   ============================================ */

async function syncUSDirectory() {
    try {
        console.log('');
        console.log('================================');
        console.log('GAZE US STOCK DIRECTORY SYNC');
        console.log('================================');
        console.log('');

        /* ----------------------------------------
           FETCH SOURCE
        ---------------------------------------- */

        const sourceStocks =
            await fetchAllStocks();

        console.log('');
        console.log(
            `✓ Source returned ${sourceStocks.length} entries`
        );


        /* ----------------------------------------
           NORMALIZE + DEDUPE
        ---------------------------------------- */

        const sourceMap = new Map();

        for (const stock of sourceStocks) {
            const normalized =
                normalizeStock(stock);

            if (!normalized) {
                continue;
            }

            /*
             * If the API ever contains duplicate
             * symbols, the last valid record wins.
             */
            sourceMap.set(
                normalized.ticker,
                normalized
            );
        }

        const allStocks =
            Array.from(sourceMap.values());

        console.log(
            `✓ Valid unique stocks: ${allStocks.length}`
        );


        /* ----------------------------------------
           CONNECT MONGODB
        ---------------------------------------- */

        console.log('');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log('✓ MongoDB connected');


        /* ----------------------------------------
           LOAD EXISTING US STOCKS
        ---------------------------------------- */

        const currentStocks =
            await Stock.find(
                { market: 'US' },
                {
                    ticker: 1,
                    name: 1,
                    exchange: 1,
                    country: 1,
                    sector: 1,
                    industry: 1,
                    marketCap: 1,
                    isSP500: 1,
                    active: 1
                }
            ).lean();

        console.log(
            `✓ Existing US records: ${currentStocks.length}`
        );


        /* ----------------------------------------
           CREATE LOOKUP MAP
        ---------------------------------------- */

        const currentMap = new Map();

        for (const stock of currentStocks) {
            currentMap.set(
                stock.ticker,
                stock
            );
        }


        /* ----------------------------------------
           PREPARE OPERATIONS
        ---------------------------------------- */

        const operations = [];

        let inserted = 0;
        let changed = 0;
        let unchanged = 0;
        let deactivated = 0;


        /* ----------------------------------------
           INSERT / UPDATE SOURCE STOCKS
        ---------------------------------------- */

        for (const stock of allStocks) {
            const existing =
                currentMap.get(stock.ticker);

            /*
             * NEW STOCK
             */

            if (!existing) {
                operations.push({
                    updateOne: {
                        filter: {
                            ticker: stock.ticker,
                            market: 'US'
                        },

                        update: {
                            $set: {
                                name: stock.name,
                                exchange: stock.exchange,
                                country: stock.country,
                                sector: stock.sector,
                                industry: stock.industry,
                                marketCap: stock.marketCap,
                                isSP500: stock.isSP500,
                                active: true,
                                source: stock.source,
                                lastUpdated: stock.lastUpdated
                            },

                            $setOnInsert: {
                                ticker: stock.ticker,
                                market: 'US'
                            }
                        },

                        upsert: true
                    }
                });

                inserted++;

                continue;
            }


            /*
             * EXISTING STOCK
             */

            const hasChanged =
                existing.name !== stock.name ||
                existing.exchange !== stock.exchange ||
                existing.country !== stock.country ||
                existing.sector !== stock.sector ||
                existing.industry !== stock.industry ||
                existing.marketCap !== stock.marketCap ||
                existing.isSP500 !== stock.isSP500 ||
                existing.active !== true;


            if (hasChanged) {
                operations.push({
                    updateOne: {
                        filter: {
                            ticker: stock.ticker,
                            market: 'US'
                        },

                        update: {
                            $set: {
                                name: stock.name,
                                exchange: stock.exchange,
                                country: stock.country,
                                sector: stock.sector,
                                industry: stock.industry,
                                marketCap: stock.marketCap,
                                isSP500: stock.isSP500,
                                active: true,
                                source: stock.source,
                                lastUpdated: stock.lastUpdated
                            }
                        }
                    }
                });

                changed++;
            } else {
                unchanged++;
            }
        }


        /* ----------------------------------------
           DEACTIVATE MISSING STOCKS
           ----------------------------------------

           We DO NOT delete records.

           If a ticker disappears from the source,
           mark it inactive so historical portfolio
           data is preserved.
        */

        for (const existing of currentStocks) {
            if (!sourceMap.has(existing.ticker)) {

                if (existing.active !== false) {
                    operations.push({
                        updateOne: {
                            filter: {
                                ticker: existing.ticker,
                                market: 'US'
                            },

                            update: {
                                $set: {
                                    active: false,
                                    lastUpdated: new Date()
                                }
                            }
                        }
                    });

                    deactivated++;
                }
            }
        }


        /* ----------------------------------------
           EXECUTE OPERATIONS
        */

        console.log('');
        console.log(
            `Preparing ${operations.length} database operations...`
        );

        if (operations.length > 0) {
            await Stock.bulkWrite(
                operations,
                {
                    ordered: false
                }
            );

            console.log(
                '✓ Database operations completed'
            );
        } else {
            console.log(
                '✓ No database changes required'
            );
        }


        /* ----------------------------------------
           SUMMARY
        */

        console.log('');
        console.log('================================');
        console.log('US DIRECTORY SYNC COMPLETE');
        console.log('================================');

        console.log(
            `Source entries:    ${sourceStocks.length}`
        );

        console.log(
            `Valid unique:      ${allStocks.length}`
        );

        console.log(
            `Inserted:           ${inserted}`
        );

        console.log(
            `Changed:            ${changed}`
        );

        console.log(
            `Unchanged:          ${unchanged}`
        );

        console.log(
            `Deactivated:        ${deactivated}`
        );

        console.log('');


    } catch (error) {

        console.error('');
        console.error(
            '❌ US DIRECTORY SYNC FAILED'
        );

        console.error(
            error.message
        );

        if (error.stack) {
            console.error(error.stack);
        }

        process.exitCode = 1;

    } finally {

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();

            console.log(
                'MongoDB connection closed.'
            );
        }
    }
}


/* ============================================
   START
   ============================================ */

syncUSDirectory();
