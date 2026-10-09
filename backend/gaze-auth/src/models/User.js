'use strict';

const { Schema } = require('mongoose');
const { usersConn } = require('../db');

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    name: { type: String, trim: true, maxlength: 60, default: '' },
    passwordHash: { type: String, select: false },          // absent for Google-only accounts
    googleId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Payments (Paystack later) - server-side source of truth
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    planExpiresAt: { type: Date, default: null },

    // Brute-force protection per account
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.activePlan = function () {
  const active = this.plan === 'pro' && (!this.planExpiresAt || this.planExpiresAt > new Date());
  return active ? 'pro' : 'free';
};

userSchema.methods.toPublic = function () {
  return {
    id: String(this._id),
    email: this.email,
    name: this.name,
    emailVerified: this.emailVerified,
    role: this.role,
    plan: this.activePlan(),
    planExpiresAt: this.planExpiresAt,
  };
};

module.exports = usersConn.model('User', userSchema);
