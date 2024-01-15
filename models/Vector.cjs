const mongoose = require('mongoose');

const VectorSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  text: {
    type: [String],
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  trash: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Vector = mongoose.model('vector', VectorSchema);
