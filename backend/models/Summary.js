const mongoose = require('mongoose');

// Define the schema for a message
const messageSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Define the schema for a summary
const summarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  serverId: {
    type: String,
    required: false
  },
  channelId: {
    type: String,
    required: false
  },
  summary: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ['brief', 'detailed', 'key_takeaways'],
    default: 'detailed'
  },
  style: {
    type: String,
    enum: ['bullets', 'paragraphs'],
    default: 'bullets'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
summarySchema.index({ userId: 1, createdAt: -1 });
summarySchema.index({ serverId: 1, channelId: 1, createdAt: -1 });

// Create the model
const Summary = mongoose.model('Summary', summarySchema);

module.exports = Summary;
