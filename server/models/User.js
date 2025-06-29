const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  media: {
    type: Array,
    default: []
  },
  albums: {
    type: Array,
    default: []
  }
});

const User = mongoose.model('User', userSchema, 'users_dbs');

module.exports = User;
