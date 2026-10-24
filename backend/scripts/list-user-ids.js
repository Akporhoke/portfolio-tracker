// Prints the user id of every portfolio in the database.
//
// Run from the backend folder:  node scripts/list-user-ids.js

require('dotenv').config();

const mongoose = require('mongoose');

const Portfolio =
    require('../models/portfolio');

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const portfolios =
            await Portfolio.find({}).lean();

        if (portfolios.length === 0) {
            console.log('No portfolios found.');
            return;
        }

        for (const portfolio of portfolios) {
            console.log(
                `userId: ${portfolio.userId}  ` +
                `(watchlist ${(portfolio.watchlist || []).length}, ` +
                `holdings ${(portfolio.stocks || []).length})`
            );
        }

        // If the field isn't called userId, this shows what it is called
        if (!portfolios[0].userId) {
            console.log('');
            console.log(
                'No userId field. Fields found:',
                Object.keys(portfolios[0]).join(', ')
            );
        }

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();