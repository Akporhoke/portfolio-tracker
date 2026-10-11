const mongoose = require('mongoose');

const dividendSchema = new mongoose.Schema({
  rowHash:          { type: String, required: true, unique: true },
  market:           { type: String, default: 'NGX' },
  symbol:           { type: String, required: true, uppercase: true, index: true },
  companyName:      { type: String, default: null },
  dividendPerShare: { type: Number, default: null },
  currency:         { type: String, default: 'NGN' },
  dividendType:     { type: String, enum: ['interim', 'final', 'unknown'], default: 'unknown' },
  financialPeriod:  { type: String, default: null },
  exDividendDate:   { type: String, default: null, index: true },
  recordDate:       { type: String, default: null },
  paymentDate:      { type: String, default: null, index: true },
  rawDeclaredText:  { type: String, default: null },
  rawAmountText:    { type: String, default: null },
  source:           { type: String, default: 'Kobo Terminal' },
  providerSourceName: { type: String, default: null },
  providerUpdatedAt:  { type: Date, default: null },
  lastCheckedAt:      { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Dividend', dividendSchema);