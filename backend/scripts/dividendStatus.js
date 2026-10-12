require('dotenv').config();
const mongoose = require('mongoose');
const { getDividendStatus } = require('../services/dividendScheduler');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(JSON.stringify(await getDividendStatus(), null, 2));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });