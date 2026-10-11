'use strict';

const { Schema } = require('mongoose');
const { usersConn } = require('../db');

// One-time links sent by email (verify your email / reset your password).
// Only a HASH of the token is stored, so a database leak cannot be used to take over accounts.
const emailTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['verify', 'reset'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },   // the link stops working here
    usedAt: { type: Date, default: null },       // set when used or replaced: single use
    purgeAt: { type: Date, required: true }      // Mongo deletes the document here (kept a while to count recent sends)
  },
  { timestamps: true }
);

emailTokenSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
emailTokenSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = usersConn.model('EmailToken', emailTokenSchema);
