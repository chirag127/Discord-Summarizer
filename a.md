1 detect messages in real time and on user request
- yes
2. just suggest them for user approval
- multiple
- yes
3 -browser extension
- click to send
- yes
4. - yes
- yes, additional features like message scheduling, auto-translate, or keyword-based triggers

It looks like you're working on a Smart Auto-Reply system for web-based chats, leveraging the Gemini 2.0 Flash model from Google Generative AI for reply suggestions. Your code snippet provides a solid starting point, and I’d love to help you flesh this out further! To make sure I’m aligned with your vision, I have a few questions to fill in the gaps and refine the app’s functionality:

### Clarify my Requirements:
1. **Chat Platforms**: I mentioned WhatsApp Web and Discord. Telegram Web. How do you plan to detect incoming messages (e.g., browser extensions,)?

2. **Conversation Context**:  AI should consider the full chat history for context,

3. **Response Styles**: I mentioned casual, professional, and humorous styles. Users should be able to switch styles dynamically during a conversation, or set a default style beforehand.

4. **Frontend Integration**: You mentioned an `env.js` file for frontend config (dev vs. prod). How do you envision the UI—e.g., a floating suggestion box and inline reply options. Should suggestions appear in real-time as the user types and after a message is received?

5. **Customization**: Beyond response styles, I want users to customize the tone further (e.g., “short and snappy” vs. “detailed and polite”) or train the AI with personal examples?

6. **Backend Setup**: my code ia to be Node.js-based. Are you planning to host this as a server-side app (e.g., Express.js) that the frontend calls via API,

7. **Output Handling**: The code includes logic for handling inline data (e.g., images). i expect the AI to generate media-based replies?  the app should support sending images/PDFs as replies?

use mongodb as the database for storing user preferences and chat history.
use gemini-2.0-flash-exp-image-generation model for image generation and google 2.0 flash for text generation.

Additionally, the extension code should be written in the `extension/` folder and backend code in the `backend/` folder.
Write this in the format of a very detailed PRD.  name for the browser extension, is  "ChatAssist"
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [
  ],
  responseMimeType: "text/plain",
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  // TODO: Following code needs to be updated for client-side apps.
  const candidates = result.response.candidates;
  for(let candidate_index = 0; candidate_index < candidates.length; candidate_index++) {
    for(let part_index = 0; part_index < candidates[candidate_index].content.parts.length; part_index++) {
      const part = candidates[candidate_index].content.parts[part_index];
      if(part.inlineData) {
        try {
          const filename = `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData.mimeType)}`;
          fs.writeFileSync(filename, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`Output written to: ${filename}`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  console.log(result.response.text());
}

run();

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp-image-generation",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [
    "image",
    "text",
  ],
  responseMimeType: "text/plain",
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  // TODO: Following code needs to be updated for client-side apps.
  const candidates = result.response.candidates;
  for(let candidate_index = 0; candidate_index < candidates.length; candidate_index++) {
    for(let part_index = 0; part_index < candidates[candidate_index].content.parts.length; part_index++) {
      const part = candidates[candidate_index].content.parts[part_index];
      if(part.inlineData) {
        try {
          const filename = `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData.mimeType)}`;
          fs.writeFileSync(filename, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`Output written to: ${filename}`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  console.log(result.response.text());
}

run();