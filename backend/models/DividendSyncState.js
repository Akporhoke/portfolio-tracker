const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  symbol:         { type: String, required: true, uppercase: true, trim: true },
  market:         { type: String, enum: ['NGX', 'US'], default: 'NGX' },
  providerSymbol: { type: String, default: null },
  status:         { type: String, enum: ['pending', 'ok', 'empty', 'not_found', 'error'], default: 'pending' },
  lastAttemptAt:  { type: Date, default: null },
  lastSuccessAt:  { type: Date, default: null },
  lastRecordCount:{ type: Number, default: null },
  lastError:      { type: String, default: null },
  failCount:      { type: Number, default: 0 },
  nextCheckAt:    { type: Date, default: () => new Date(0), index: true }
}, { timestamps: true });

schema.index({ market: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('DividendSyncState', schema);