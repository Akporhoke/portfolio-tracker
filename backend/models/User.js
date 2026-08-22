const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);