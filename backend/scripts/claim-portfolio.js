'use strict';

/*
 * One-time script: moves the old shared "user-1" portfolio (plus its confidence
 * history) onto your real account.
 *
 * Run from the backend folder:
 *   node scripts/claim-portfolio.js user-1 <YOUR_USER_ID>                 preview only, changes nothing
 *   node scripts/claim-portfolio.js user-1 <YOUR_USER_ID> --apply         moves it (stops if your account already has data)
 *   node scripts/claim-portfolio.js user-1 <YOUR_USER_ID> --apply --replace-target
 *                                                                          ALSO deletes whatever your account already has, then moves it
 *
 * Safe to re-run: if the connection drops half way, run the same command again and it finishes the job.
 *
 * Get YOUR_USER_ID: log in on the site, open the browser console and run:
 *   GazeAuth.getUser().id
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Portfolio = require('../models/portfolio');
const ConfidenceSnapshot = require('../models/ConfidenceSnapshot');

const [from, to] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const apply = process.argv.includes('--apply');
const replaceTarget = process.argv.includes('--replace-target');
const RETRY_DELAY_MS = Number(process.env.CLAIM_RETRY_DELAY_MS ?? 3000);

const counts = (p) =>
  p
    ? `stocks=${p.stocks.length}, watchlist=${p.watchlist.length}, sold=${p.sold.length}, activity=${p.activity.length}`
    : 'none';

const isEmpty = (p) =>
  p.stocks.length + p.watchlist.length + p.sold.length + p.activity.length === 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Your internet to Atlas drops now and then, so try a few times before giving up
async function connectWithRetry() {
  const attempts = 4;
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 2,
        family: 4,
        serverSelectionTimeoutMS: 15000
      });
      return;
    } catch (err) {
      console.log(`Connection attempt ${i}/${attempts} failed.`);
      if (i === attempts) throw err;
      await sleep(RETRY_DELAY_MS);
    }
  }
}

async function showResult(label) {
  const p = await Portfolio.findOne({ userId: to });
  const s = await ConfidenceSnapshot.countDocuments({ userId: to });
  console.log(`${label} "${to}": ${counts(p)}, confidence snapshots=${s}`);
}

(async () => {
  if (!from || !to) {
    console.log('Usage: node scripts/claim-portfolio.js user-1 <YOUR_USER_ID> [--apply] [--replace-target]');
    process.exit(1);
  }
  if (!/^[a-f0-9]{24}$/i.test(to)) {
    console.log(`"${to}" does not look like a user id (expected 24 hex characters).`);
    process.exit(1);
  }

  await connectWithRetry();

  const source = await Portfolio.findOne({ userId: from });
  const target = await Portfolio.findOne({ userId: to });
  const sourceSnaps = await ConfidenceSnapshot.countDocuments({ userId: from });
  const targetSnaps = await ConfidenceSnapshot.countDocuments({ userId: to });

  console.log(`Source "${from}": ${counts(source)}, confidence snapshots=${sourceSnaps}`);
  console.log(`Target "${to}":   ${counts(target)}, confidence snapshots=${targetSnaps}`);

  // A previous run moved the portfolio but the connection dropped before the history moved
  if (!source && sourceSnaps > 0) {
    console.log('\nA previous run moved the portfolio but not the confidence history.');
    if (!apply) {
      console.log('Preview only. Re-run with --apply to finish moving the history.');
      process.exit(0);
    }
    const s = await ConfidenceSnapshot.updateMany({ userId: from }, { $set: { userId: to } });
    console.log(`Finished. Snapshots moved: ${s.modifiedCount}`);
    await showResult('Now');
    await mongoose.disconnect();
    process.exit(0);
  }

  if (!source) { console.log('Nothing to move: the source portfolio does not exist.'); process.exit(1); }

  const targetHasData = (target && !isEmpty(target)) || targetSnaps > 0;

  if (targetHasData && !replaceTarget) {
    console.log('\nSTOP: your account already has portfolio data (probably stocks you added while testing).');
    console.log('Nothing was changed. If that data is only test data, re-run with:  --apply --replace-target');
    console.log('That DELETES your account\'s current portfolio and moves the "' + from + '" data in.');
    process.exit(1);
  }
  if (!apply) {
    console.log('\nPreview only. Re-run with --apply to move the data' +
      (targetHasData ? ' (add --replace-target to discard the data your account already has).' : '.'));
    process.exit(0);
  }

  if (targetHasData) {
    console.log('Deleting the data your account already had...');
    await Portfolio.deleteMany({ userId: to });
    await ConfidenceSnapshot.deleteMany({ userId: to });
  } else if (target) {
    await Portfolio.deleteOne({ _id: target._id }); // empty portfolio auto-created on first load
  }

  const p = await Portfolio.updateOne({ userId: from }, { $set: { userId: to } });
  console.log(`Portfolio moved: ${p.modifiedCount}`);
  const s = await ConfidenceSnapshot.updateMany({ userId: from }, { $set: { userId: to } });
  console.log(`Snapshots moved: ${s.modifiedCount}`);

  await showResult('Done. Your account now has');
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('\nFailed:', err.message);
  console.error('Nothing is lost. Run the same command again: it picks up where it stopped.');
  process.exit(1);
});