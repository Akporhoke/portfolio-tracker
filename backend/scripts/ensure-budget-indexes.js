// Makes sure the quota log has the indexes the budget checker needs.
//
// Put this file in:  backend/scripts/ensure-budget-indexes.js
// Run from the backend folder:  node scripts/ensure-budget-indexes.js
//
// Why: every provider request asks "how many requests did this provider
// get since <start of window>?". Without an index on (provider, at) that
// query reads the whole log. And without an expiry, the log grows forever.
//
//   1. index on provider + at   makes the count fast
//   2. expiry on at (35 days)   old rows delete themselves. The longest
//                               window is a month (31 days), so nothing
//                               the budget needs is ever removed.
//
// Safe to run more than once: it only adds what is missing and tells you
// what it found.

require('dotenv').config();

const mongoose = require('mongoose');

const ProviderRequestLog =
    require('../models/ProviderRequestLog');

const EXPIRE_SECONDS =
    35 * 24 * 60 * 60;

(async () => {
    try {
        await mongoose.connect(
            process.env.MONGODB_URI,
            { family: 4 }
        );

        const collection =
            ProviderRequestLog.collection;

        const indexes =
            await collection.indexes();

        console.log('Existing indexes:');

        for (const index of indexes) {
            console.log(
                `  ${index.name}  ${JSON.stringify(index.key)}` +
                (index.expireAfterSeconds !== undefined
                    ? `  (rows expire after ${index.expireAfterSeconds}s)`
                    : '')
            );
        }

        console.log('');

        // 1. provider + at
        const hasCompound =
            indexes.some(
                index =>
                    index.key &&
                    index.key.provider !== undefined &&
                    index.key.at !== undefined
            );

        if (hasCompound) {
            console.log('OK: an index on provider + at already exists.');

        } else {
            await collection.createIndex({ provider: 1, at: -1 });

            console.log('ADDED: index on provider + at.');
        }

        // 2. expiry on "at"
        const atOnly =
            indexes.find(
                index =>
                    index.key &&
                    Object.keys(index.key).length === 1 &&
                    index.key.at !== undefined
            );

        if (atOnly && atOnly.expireAfterSeconds !== undefined) {
            console.log(
                `OK: rows already expire after ${atOnly.expireAfterSeconds}s.`
            );

            if (atOnly.expireAfterSeconds < 32 * 24 * 60 * 60) {
                console.log(
                    'WARNING: that is shorter than a month. The monthly ' +
                    'NGN Market budget needs about 31 days of rows to count ' +
                    'correctly. Change it to 35 days (3024000 seconds).'
                );
            }

        } else if (atOnly) {
            // An index on "at" exists without expiry: turn it into one
            await mongoose.connection.db.command({
                collMod: collection.collectionName,
                index: {
                    keyPattern: atOnly.key,
                    expireAfterSeconds: EXPIRE_SECONDS
                }
            });

            console.log('CHANGED: the index on at now expires rows after 35 days.');

        } else {
            await collection.createIndex(
                { at: 1 },
                { expireAfterSeconds: EXPIRE_SECONDS }
            );

            console.log('ADDED: rows now expire after 35 days.');
        }

    } catch (error) {
        console.error('Failed:', error.message);

    } finally {
        await mongoose.disconnect();
    }
})();
