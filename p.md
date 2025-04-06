=

# **Product Requirements Document (PRD)**
## **Discord Summarizer Chrome Extension**

### **1. Overview**
The Discord Summarizer Chrome Extension provides users with a manual way to summarize unread messages in any Discord server or channel. It identifies messages after the last read divider and uses **Google Gemini-2.0 Flash** for summarization. Summaries are displayed directly inside Discord, with multiple summarization modes and customization options.

---

### **2. Features**
#### **2.1 Core Features**
- **Manual Summarization:** Users trigger summarization manually.
- **Works Across All Servers/Channels:** No restriction on specific servers or channels.
- **Unread Message Detection:**
  - Identifies messages appearing after the detect the <div class="divider__5126c hasContent__5126c divider__908e2 isUnread__908e2 hasContent__908e2" id="---new-messages-bar" role="separator" aria-label="March 31, 2025"><span class="content__908e2">March 31, 2025</span><span class="unreadPill__908e2 endCap__908e2"><svg class="unreadPillCap__908e2" aria-hidden="true" role="img" width="8" height="13" viewBox="0 0 8 13"><path class="unreadPillCapStroke__908e2" stroke="currentColor" fill="transparent" d="M8.16639 0.5H9C10.933 0.5 12.5 2.067 12.5 4V9C12.5 10.933 10.933 12.5 9 12.5H8.16639C7.23921 12.5 6.34992 12.1321 5.69373 11.4771L0.707739 6.5L5.69373 1.52292C6.34992 0.86789 7.23921 0.5 8.16639 0.5Z"></path></svg>new</span></div>
to determine the "last read message" element.
- **Text-Only Summarization:**
  - Only text messages are included; media (images, links, embeds) are ignored.
- **Summary Display:**
  - Summaries are injected directly inside Discord.
  - Multiple summarization modes available: **Brief, Detailed, Key Takeaways.**
- **User Customization:**
  - Users can select their preferred summarization style (e.g., bullet points vs. paragraphs).

---

### **3. Technical Specifications**
#### **3.1 Frontend (Chrome Extension)**
- **Technology:** JavaScript (Manifest V3)
- **Structure:**
  - `extension/` folder contains all Chrome extension-related code.
  - **Event-based architecture**: Listens for user-triggered summarization.
  - **DOM Parsing:** Detects `<div class="divider__5126c...">` to locate unread messages.
  - **API Communication:** Sends extracted messages to the backend for summarization.
  - **UI Injection:** Inserts summaries directly into Discord chat.
  - **Configuration Management:** Uses an `env.js` file for development and production settings.

#### **3.2 Backend (Summarization API)**
- **Technology:** Node.js, Express.js
- **Hosting:** Render
- **Endpoints:**
  - `POST /summarize` – Receives text messages, processes with `gemini-2.0-flash`, and returns the summary.
  - `GET /summaries/:userId` – Retrieves past summaries for a user.
- **Data Storage:**
  - Stores past summaries for user reference.
- **AI Model:**
  - Uses **Google Generative AI (Gemini-2.0 Flash)** for text summarization.

##### google api

```javascript
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
```

---

### **4. User Experience (UX)**
#### **4.1 Workflow**
1. User clicks the **Summarize** button in the extension UI.
2. The extension detects unread messages **after the "New Messages" divider**.
3. Extracted text is sent to the **backend API** for summarization.
4. Summary is received and injected **directly into Discord chat**.
5. Users can **switch between summary modes** for different levels of detail.

#### **4.2 UI/UX Considerations**
- **Minimal UI:** No popup; actions happen within Discord.
- **Customization:** Users select their preferred summary format.
- **Fast Processing:** Response time optimized for real-time summarization.

---

### **5. Deployment & Configuration**
#### **5.1 Development & Production Configurations**
- Uses `env.js` for **separate development and production settings**.

#### **5.2 Folder Structure**
```
/discord-summarizer
│── /extension       # Chrome extension code
│── /backend         # Node.js backend for summarization
│── README.md
│── .gitignore
│── package.json
```

---

### **6. Future Enhancements**
- **Multi-language support** (if needed).
- **Support for media-based summaries** (images, embeds).
- **Automated summarization on new messages**.
- **User feedback mechanism** to improve summarization accuracy.
- **Integration with other platforms** (e.g., Slack, Teams).

### **7. Conclusion**
The Discord Summarizer Chrome Extension aims to enhance user experience by providing a seamless way to summarize unread messages. By leveraging the power of **Google Gemini-2.0 Flash**, it ensures that users can stay updated without being overwhelmed by information overload.

the user prefers that you do not wait for the user to confirm the detailed plan. My github username is chirag127. Use the web search if any help is needed in the implementation of this browser extension. Also use the web search extensively. Also use the sequential thinking mcp server wherever possible. The code should be written in a modular way and should be easy to understand. The code should be well documented and should follow the best practices of coding. The code should be written in a way that it can be easily extended in the future. The code should be written in a way that it can be easily tested. The code should be written in a way that it can be easily debugged. The code should be written in a way that it can be easily maintained. The code should be written in a way that it can be easily deployed. The code should be written in a way that it can be easily integrated with other systems. use web search if you think you don't know anything.
