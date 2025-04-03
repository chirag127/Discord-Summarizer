const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

// Initialize Google Generative AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Generation config
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
  responseMimeType: "text/plain",
};

/**
 * Summarize Discord messages using Google Gemini-2.0 Flash
 * @param {Array} messages - Array of message objects with author and text
 * @param {string} mode - Summary mode (brief, detailed, key_takeaways)
 * @param {string} style - Summary style (bullets, paragraphs)
 * @returns {Promise<string>} HTML-formatted summary
 */
async function summarizeMessages(messages, mode = 'brief', style = 'bullets') {
  try {
    // Format messages for the prompt
    const formattedMessages = messages.map(msg => 
      `${msg.author}: ${msg.text}`
    ).join('\n');
    
    // Create prompt based on mode and style
    const prompt = createPrompt(formattedMessages, mode, style);
    
    // Start chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    // Send message to Gemini
    const result = await chatSession.sendMessage(prompt);
    const summary = result.response.text();
    
    // Format the summary based on style
    return formatSummary(summary, style);
  } catch (error) {
    console.error('Error in summarizeMessages:', error);
    throw error;
  }
}

/**
 * Create a prompt for Gemini based on mode and style
 * @param {string} messages - Formatted messages
 * @param {string} mode - Summary mode
 * @param {string} style - Summary style
 * @returns {string} Prompt for Gemini
 */
function createPrompt(messages, mode, style) {
  let prompt = `Summarize the following Discord conversation:\n\n${messages}\n\n`;
  
  // Add mode-specific instructions
  switch (mode) {
    case 'brief':
      prompt += 'Provide a brief summary that captures the main points of the conversation. ';
      prompt += 'Keep it concise and to the point. ';
      break;
    case 'detailed':
      prompt += 'Provide a detailed summary of the conversation, including all important points discussed. ';
      prompt += 'Make sure to capture the flow of the conversation and any decisions or conclusions reached. ';
      break;
    case 'key_takeaways':
      prompt += 'Extract the key takeaways from this conversation. ';
      prompt += 'Focus on actionable items, decisions made, and important information shared. ';
      break;
    default:
      prompt += 'Provide a concise summary of the main points. ';
  }
  
  // Add style-specific instructions
  if (style === 'bullets') {
    prompt += 'Format the summary as bullet points.';
  } else {
    prompt += 'Format the summary as paragraphs.';
  }
  
  return prompt;
}

/**
 * Format the summary based on style
 * @param {string} summary - Raw summary from Gemini
 * @param {string} style - Summary style
 * @returns {string} HTML-formatted summary
 */
function formatSummary(summary, style) {
  if (style === 'bullets') {
    // If summary doesn't already have bullet points, add them
    if (!summary.includes('•') && !summary.includes('-') && !summary.includes('*')) {
      // Split by newlines and add bullets
      const lines = summary.split('\n').filter(line => line.trim() !== '');
      return lines.map(line => `• ${line}`).join('<br>');
    }
  }
  
  // Replace newlines with <br> for HTML display
  return summary.replace(/\n/g, '<br>');
}

module.exports = {
  summarizeMessages
};
