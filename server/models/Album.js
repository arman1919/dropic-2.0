const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  photoId: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  url: {
    type: String,
    required: true
  },
  path: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  description_hidden: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: null
  },
  date_hidden: {
    type: Boolean,
    default: false
  }
});

const albumSchema = new mongoose.Schema({
  albumId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    default: 'Untitled Album'
  },
  deleteToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  photos: [photoSchema],
  options: {
    type: Object,
    default: {}
  },
  theme: {
    type: String,
    default: 'default'
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  password: {
    type: String,
    default: null
  },
  allowDownload: {
    type: Boolean,
    default: true
  }
});

const Album = mongoose.model('Album', albumSchema, 'album_dbs');

module.exports = Album;
