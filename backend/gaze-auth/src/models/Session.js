'use strict';

const { Schema } = require('mongoose');
const { usersConn } = require('../db');

// One document = one logged-in device/browser.
// We store only HASHES of refresh tokens, never the tokens themselves.
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    prevTokenHash: { type: String, default: null, index: true }, // for reuse detection
    rotatedAt: { type: Date },
    userAgent: { type: String, maxlength: 200, default: '' },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB deletes expired sessions automatically
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = usersConn.model('Session', sessionSchema);
