# Discord Summarizer

![Discord Summarizer Logo](extension/images/icon128.png)

A Chrome extension that summarizes unread Discord messages using Google Gemini-2.0 Flash with MongoDB for data storage.

## Overview

The Discord Summarizer Chrome Extension provides users with a manual way to summarize unread messages in any Discord server or channel. It identifies messages after the last read divider and uses Google Gemini-2.0 Flash for summarization. Summaries are displayed directly inside Discord, with multiple summarization modes and customization options. All summaries are stored in MongoDB for future reference.

## Features

-   **Manual Summarization:** Users trigger summarization manually
-   **Works Across All Servers/Channels:** No restriction on specific servers or channels
-   **Unread Message Detection:** Identifies messages appearing after the "New Messages" divider
-   **Text-Only Summarization:** Only text messages are included; media (images, links, embeds) are ignored
-   **Multiple Summarization Modes:** Brief, Detailed, Key Takeaways
-   **User Customization:** Users can select their preferred summarization style (bullets or paragraphs)
-   **Summary History:** View past summaries with the History button
-   **MongoDB Storage:** All summaries are stored in MongoDB for future reference

## Technical Architecture

### Frontend (Chrome Extension)

-   **Technology:** JavaScript (Manifest V3)
-   **Key Components:**
    -   **content.js:** Interacts with Discord's DOM to extract messages and display summaries
    -   **background.js:** Manages extension state and user preferences
    -   **env.js:** Handles environment configuration (development/production)

### Backend (Node.js API)

-   **Technology:** Express.js, MongoDB, Google Generative AI
-   **Key Components:**
    -   **server.js:** Main Express server with API endpoints
    -   **summarizer.js:** Handles interaction with Google Gemini-2.0 Flash
    -   **db/connection.js:** Manages MongoDB connection
    -   **models/Summary.js:** MongoDB schema for storing summaries
    -   **services/summaryService.js:** Business logic for summary operations

## Project Structure

```
/discord-summarizer
│── /extension                # Chrome extension code
│   │── /js                   # JavaScript files
│   │   │── background.js     # Background script
│   │   │── content.js        # Content script for Discord interaction
│   │   │── env.js            # Environment configuration
│   │── /css                  # Stylesheets
│   │   │── styles.css        # Extension styles
│   │── /images               # Extension icons
│   │── manifest.json         # Extension manifest
│   │── README.md             # Extension-specific documentation
│
│── /backend                  # Node.js backend for summarization
│   │── /db                   # Database modules
│   │   │── connection.js     # MongoDB connection
│   │── /models               # MongoDB models
│   │   │── Summary.js        # Summary schema and model
│   │── /services             # Business logic
│   │   │── summaryService.js # Summary operations
│   │── server.js             # Express server
│   │── summarizer.js         # Gemini integration
│   │── .env.example          # Example environment variables
│
│── README.md                 # Project documentation
│── .gitignore                # Git ignore file
│── package.json              # Project metadata
```

## Setup

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn
-   MongoDB (local installation or MongoDB Atlas account)
-   Google Generative AI API key

### Backend

1. Navigate to the `backend` directory
2. Copy `.env.example` to `.env` and add your Google Gemini API key
    - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
    - Sign in with your Google account
    - Click on "Get API key" or "Create API key"
    - Copy the API key and paste it in your `.env` file
3. Set up MongoDB:
    - For local development: Install MongoDB and set `MONGODB_URI` in `.env`
    - For production: Create a MongoDB Atlas account and set the connection string in `.env`
4. Install dependencies: `npm install`
5. Start the server: `npm start`

### Chrome Extension

1. Navigate to the `extension` directory
2. Add your own icons in the `images` folder (icon16.png, icon48.png, icon128.png)
3. Edit `js/env.js` to point to your backend API URL
4. Load the extension in Chrome:
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the `extension` folder

## Usage

### Summarizing Messages

1. Navigate to Discord in your browser
2. When you see unread messages (indicated by the "New Messages" divider), click the "Summarize" button
3. Choose your preferred summarization mode from the dropdown (Brief, Detailed, or Key Takeaways)
4. The summary will appear directly in the Discord chat

### Viewing Summary History

1. Click the "History" button in the Discord interface
2. A list of your past summaries will appear
3. Click on any summary to expand and view its content

## API Endpoints

-   **POST /summarize** - Generate a summary from Discord messages

    -   Request body: `{ messages, mode, style, userId, serverId, channelId }`
    -   Response: `{ summary, summaryId }`

-   **GET /summaries/:userId** - Get summaries for a specific user

    -   Response: `{ summaries: [...] }`

-   **GET /summaries/channel/:serverId/:channelId** - Get summaries for a specific channel

    -   Response: `{ summaries: [...] }`

-   **DELETE /summaries/:summaryId** - Delete a specific summary
    -   Response: `{ success, message }`

## MongoDB Schema

```javascript
// Summary Schema
{
  userId: String,       // Discord user ID
  serverId: String,     // Discord server ID (optional)
  channelId: String,    // Discord channel ID (optional)
  summary: String,      // Generated summary text
  mode: String,         // Summary mode (brief, detailed, key_takeaways)
  style: String,        // Summary style (bullets, paragraphs)
  messages: [{          // Array of original messages
    author: String,     // Message author
    text: String,       // Message content
    timestamp: Date     // Message timestamp
  }],
  createdAt: Date       // Summary creation timestamp
}
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

-   [Google Generative AI](https://ai.google.dev/) for the Gemini-2.0 Flash model
-   [Discord](https://discord.com/) for the messaging platform
-   [MongoDB](https://www.mongodb.com/) for the database
