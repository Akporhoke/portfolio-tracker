// migrate-market-field.js
require('dotenv').config();
const mongoose = require('mongoose');
const Portfolio = require('./models/Portfolio');

const DEFAULT_MARKET = 'NGX';

const MONGO_URI = process.env.MONGODB_URI; // matches your .env variable name

async function migrate() {
  if (!MONGO_URI) {
    console.error('MONGODB_URI is undefined — check that .env is in the backend folder and dotenv is loaded.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ...rest of the script stays exactly the same as before
  const portfolios = await Portfolio.find({});
  console.log(`Found ${portfolios.length} portfolio document(s)`);

  let totalFixed = 0;

  for (const p of portfolios) {
    let changed = false;

    for (const s of p.stocks) {
      if (!s.market) {
        s.market = DEFAULT_MARKET;
        changed = true;
      }
    }
    for (const w of p.watchlist) {
      if (!w.market) {
        w.market = DEFAULT_MARKET;
        changed = true;
      }
    }
    for (const sd of p.sold) {
      if (!sd.market) {
        sd.market = DEFAULT_MARKET;
        changed = true;
      }
    }

    if (changed) {
      await p.save();
      totalFixed++;
      console.log(`✓ Fixed portfolio for userId: ${p.userId}`);
    }
  }

  console.log(`\nMigration complete. Fixed ${totalFixed} document(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});