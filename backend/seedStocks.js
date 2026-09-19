const mongoose = require('mongoose');
require('dotenv').config();

const Stock = require('./models/stock');

const {
    getNGNMarketCompanies
} = require('./utils/getPrice');


// ============================================================
// SEED STOCK DIRECTORY
// ============================================================

async function seedStocks() {

    try {

        console.log('Connecting to MongoDB...');

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log('✓ MongoDB connected');


        // ========================================================
        // GET NGX COMPANIES
        // ========================================================

        console.log(
            'Fetching NGX company directory...'
        );

        const companies =
            await getNGNMarketCompanies();


        console.log(
            `✓ Received ${companies.length} companies`
        );


        // ========================================================
        // CONVERT PROVIDER DATA → GAZE STOCK FORMAT
        // ========================================================

        const stocks = [];


        for (const company of companies) {

            const ticker =
                String(
                    company.symbol ||
                    company.ticker ||
                    company.code ||
                    company.securityCode ||
                    company.stockSymbol ||
                    ''
                )
                .trim()
                .toUpperCase();


            const name =
                String(
                    company.name ||
                    company.companyName ||
                    company.securityName ||
                    company.description ||
                    ''
                )
                .trim();


            // ----------------------------------------------------
            // Skip invalid records
            // ----------------------------------------------------

            if (!ticker || !name) {
                continue;
            }


            stocks.push({

                ticker,

                name,

                market: 'NGX',

                exchange: 'NGX',

                country: 'Nigeria',

                sector:
                    company.sector ||
                    '',

                industry:
                    company.industry ||
                    '',

                aliases: [],

                active: true,

                source: 'NGN Market',

                lastUpdated: new Date()

            });

        }


        console.log(
            `✓ Valid stocks prepared: ${stocks.length}`
        );


        // ========================================================
        // SAVE TO MONGODB
        // ========================================================

        let inserted = 0;
        let updated = 0;


        for (const stock of stocks) {

            const result =
                await Stock.updateOne(

                    {
                        ticker:
                            stock.ticker,

                        market:
                            stock.market
                    },

                    {
                        $set:
                            stock
                    },

                    {
                        upsert: true
                    }

                );


            if (result.upsertedCount > 0) {

                inserted++;

            } else if (
                result.modifiedCount > 0
            ) {

                updated++;

            }

        }


        console.log('');
        console.log('================================');
        console.log('STOCK DIRECTORY SEED COMPLETE');
        console.log('================================');

        console.log(
            `Inserted: ${inserted}`
        );

        console.log(
            `Updated:   ${updated}`
        );

        console.log(
            `Total:     ${stocks.length}`
        );


    } catch (err) {

        console.error('');
        console.error(
            '❌ Stock directory seed failed:'
        );

        console.error(
            err.message
        );


    } finally {

        await mongoose.disconnect();

        console.log(
            'MongoDB connection closed.'
        );

    }

}


seedStocks();