require('dotenv').config();
const mongoose = require('mongoose');
const DividendSyncState = require('../models/DividendSyncState');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const r = await DividendSyncState.collection.updateMany(
    { market: { $exists: false } }, { $set: { market: 'NGX' } });
  console.log('Tagged existing NGX states:', r.modifiedCount);
  console.log('Dropped old indexes:', await DividendSyncState.syncIndexes());
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });