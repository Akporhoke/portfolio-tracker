const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  at:       { type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 3 },
  symbol:   { type: String, default: null },
  provider: { type: String, default: 'kobo' }   // 'kobo' or 'twelve'
});

module.exports = mongoose.model('DividendRequestLog', schema);