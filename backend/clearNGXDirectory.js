const mongoose = require('mongoose');
require('dotenv').config();

const Stock = require('./models/Stock');

async function clearNGXDirectory() {
    try {
        console.log('');
        console.log('================================');
        console.log('CLEAR NGX DIRECTORY');
        console.log('================================');

        await mongoose.connect(process.env.MONGODB_URI);

        console.log('✓ MongoDB connected');

        const result = await Stock.deleteMany({
            market: 'NGX',
            source: 'NGX Daily Official List'
        });

        console.log(
            `✓ Deleted ${result.deletedCount} NGX directory records`
        );

        console.log('');
        console.log('NGX directory cleanup complete.');
        console.log('');

        await mongoose.disconnect();

        console.log('✓ MongoDB connection closed');
    } catch (error) {
        console.error('');
        console.error('================================');
        console.error('NGX DIRECTORY CLEANUP FAILED');
        console.error('================================');
        console.error(error);

        process.exit(1);
    }
}

clearNGXDirectory();
