require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../gaze-auth/src/models/User');

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) throw new Error('Usage: node scripts/makeAdmin.js you@example.com');

  await mongoose.connect(process.env.MONGODB_URI);
const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { returnDocument: 'after' });
  console.log(user ? `${user.email} is now ${user.role}` : `No user found with email ${email}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });