'use strict';

const mongoose = require('mongoose');
const config = require('./config');

// One dedicated connection (with its own pool) for user accounts.
// Created ONCE at startup and reused by every request.
// Your existing stock-data connection stays separate (see README).
const usersConn = mongoose.createConnection(config.usersUri, {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
});

usersConn.on('connected', () => console.log('[users-db] connected'));
usersConn.on('error', (err) => console.error('[users-db] error:', err.message));
usersConn.on('disconnected', () => console.warn('[users-db] disconnected'));

module.exports = { usersConn };
