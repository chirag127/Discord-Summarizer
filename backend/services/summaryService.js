const Summary = require('../models/Summary');

/**
 * Store a summary in the database
 * @param {string} userId - User ID
 * @param {string} summary - Generated summary text
 * @param {Array} messages - Array of message objects
 * @param {string} mode - Summary mode
 * @param {string} style - Summary style
 * @param {string} serverId - Discord server ID (optional)
 * @param {string} channelId - Discord channel ID (optional)
 * @returns {Promise<Object>} Saved summary object
 */
const storeSummary = async (userId, summary, messages, mode, style, serverId = null, channelId = null) => {
  try {
    const newSummary = new Summary({
      userId,
      serverId,
      channelId,
      summary,
      mode,
      style,
      messages
    });
    
    const savedSummary = await newSummary.save();
    return savedSummary;
  } catch (error) {
    console.error('Error storing summary:', error);
    throw error;
  }
};

/**
 * Get summaries for a user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of summaries to return
 * @returns {Promise<Array>} Array of summary objects
 */
const getSummariesByUser = async (userId, limit = 10) => {
  try {
    const summaries = await Summary.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return summaries;
  } catch (error) {
    console.error('Error getting summaries:', error);
    throw error;
  }
};

/**
 * Get summaries for a specific channel
 * @param {string} serverId - Discord server ID
 * @param {string} channelId - Discord channel ID
 * @param {number} limit - Maximum number of summaries to return
 * @returns {Promise<Array>} Array of summary objects
 */
const getSummariesByChannel = async (serverId, channelId, limit = 10) => {
  try {
    const summaries = await Summary.find({ serverId, channelId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return summaries;
  } catch (error) {
    console.error('Error getting channel summaries:', error);
    throw error;
  }
};

/**
 * Delete a summary by ID
 * @param {string} summaryId - Summary ID
 * @returns {Promise<boolean>} Success status
 */
const deleteSummary = async (summaryId) => {
  try {
    const result = await Summary.findByIdAndDelete(summaryId);
    return !!result;
  } catch (error) {
    console.error('Error deleting summary:', error);
    throw error;
  }
};

module.exports = {
  storeSummary,
  getSummariesByUser,
  getSummariesByChannel,
  deleteSummary
};
