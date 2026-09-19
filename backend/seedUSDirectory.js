const mongoose = require('mongoose');
require('dotenv').config();

const Stock = require('./models/stock');

const usStocks = [
    {
        ticker: 'AAPL',
        name: 'Apple',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Apple Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'MSFT',
        name: 'Microsoft',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Microsoft Corporation'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'AMZN',
        name: 'Amazon',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Amazon.com', 'Amazon Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'GOOGL',
        name: 'Alphabet',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Google', 'Alphabet Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'META',
        name: 'Meta Platforms',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Meta', 'Facebook'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'TSLA',
        name: 'Tesla',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Tesla Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'NFLX',
        name: 'Netflix',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Netflix Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'NVDA',
        name: 'NVIDIA',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['NVIDIA Corporation'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'AMD',
        name: 'Advanced Micro Devices',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['AMD', 'Advanced Micro Devices Inc'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'INTC',
        name: 'Intel',
        market: 'US',
        exchange: 'NASDAQ',
        country: 'United States',
        aliases: ['Intel Corporation'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'ORCL',
        name: 'Oracle',
        market: 'US',
        exchange: 'NYSE',
        country: 'United States',
        aliases: ['Oracle Corporation'],
        active: true,
        source: 'local-directory'
    },

    {
        ticker: 'IBM',
        name: 'IBM',
        market: 'US',
        exchange: 'NYSE',
        country: 'United States',
        aliases: ['International Business Machines'],
        active: true,
        source: 'local-directory'
    }
];

async function seedUSDirectory() {
    try {
        console.log('Connecting to MongoDB...');

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log('✓ MongoDB connected');

        let inserted = 0;
        let updated = 0;

        for (const stock of usStocks) {
            const result =
                await Stock.updateOne(
                    {
                        ticker: stock.ticker,
                        market: stock.market
                    },
                    {
                        $set: stock
                    },
                    {
                        upsert: true
                    }
                );

            if (result.upsertedCount > 0) {
                inserted++;
            } else if (result.modifiedCount > 0) {
                updated++;
            }
        }

        console.log('');
        console.log('================================');
        console.log('US DIRECTORY SEED COMPLETE');
        console.log('================================');
        console.log(`Inserted: ${inserted}`);
        console.log(`Updated:  ${updated}`);
        console.log(`Total:    ${usStocks.length}`);

    } catch (err) {
        console.error(
            '❌ Directory seed failed:',
            err.message
        );

    } finally {
        await mongoose.disconnect();

        console.log(
            'MongoDB connection closed.'
        );
    }
}

seedUSDirectory();