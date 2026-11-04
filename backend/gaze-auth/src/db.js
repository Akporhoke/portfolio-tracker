'use strict';

const mongoose = require('mongoose');
const config = require('./config');

// Dedicated connection for user accounts.
// The main stock-data MongoDB connection remains separate.

const usersConn = mongoose.createConnection(config.usersUri, {
  maxPoolSize: 10,
  minPoolSize: 1,
  family: 4,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

usersConn.on('connected', () => {
  console.log('[users-db] connected');
});

usersConn.on('error', (err) => {
  console.error('[users-db] error:', err.message);
});

usersConn.on('disconnected', () => {
  console.warn('[users-db] disconnected');
});

module.exports = { usersConn };