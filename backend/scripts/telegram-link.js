// Prints a one-time Telegram connect link for one user.
// Use it to connect Telegram before the app has a Connect button.
//
// Put this file in:  backend/scripts/telegram-link.js
// Run from the backend folder:
//   node scripts/telegram-link.js YOUR_USER_ID
//
// Then open the link on your phone and press Start. The server (with
// TELEGRAM_POLLING not set to false) must be running to receive it.

require('dotenv').config();

const mongoose = require('mongoose');

const telegram =
    require('../services/telegramService');

const userId =
    String(process.argv[2] || '').trim();

if (!userId) {
    console.log('Usage: node scripts/telegram-link.js YOUR_USER_ID');
    console.log('(find your id with: node scripts/list-user-ids.js)');
    process.exit(1);
}

if (!telegram.isConfigured()) {
    console.log('TELEGRAM_BOT_TOKEN is not set in backend/.env');
    process.exit(1);
}

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const link =
            await telegram.createLinkCode(userId);

        if (!link.url) {
            console.log('Could not reach Telegram to get the bot name. Try again.');
            return;
        }

        console.log('');
        console.log('Open this link on your phone and press Start:');
        console.log('');
        console.log(link.url);
        console.log('');
        console.log(
            `It works once, for ${Math.round(
                (link.expiresAt - Date.now()) / 60000
            )} minutes.`
        );

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();