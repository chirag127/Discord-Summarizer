const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined in environment variables");
  console.log("Make sure you have created a .env file with your API key");
  process.exit(1);
}

// Initialize Google Generative AI
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Get the model - using the same model as in your code
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro-exp-03-25", // or "gemini-2.0-flash" if you prefer
});

// Generation config - fixed without responseMimeType
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 4096,
  // No responseMimeType parameter
};

async function testGeminiAPI() {
  try {
    console.log("Testing Gemini API connection...");
    
    // Start chat session
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    // Simple test prompt
    const prompt = "Summarize the following conversation:\n\nUser1: Hello everyone!\nUser2: Hi there, how's it going?\nUser1: I'm doing well, just working on a project.\nUser2: Cool, what kind of project?\nUser1: A Discord summarizer extension using Gemini API.";

    console.log("Sending test prompt to Gemini API...");
    
    // Send message to Gemini
    const result = await chatSession.sendMessage(prompt);
    const summary = result.response.text();

    console.log("\nAPI Response:");
    console.log("=============");
    console.log(summary);
    console.log("=============");
    console.log("\nGemini API test successful!");
    
    return true;
  } catch (error) {
    console.error("Error testing Gemini API:", error);
    return false;
  }
}

// Run the test
testGeminiAPI()
  .then(success => {
    if (success) {
      console.log("You can now use the Gemini API in your application.");
    } else {
      console.log("Please check your API key and try again.");
    }
  })
  .catch(err => {
    console.error("Unexpected error:", err);
  });
