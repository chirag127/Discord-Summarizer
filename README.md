# Discord Summarizer

A Chrome extension that summarizes unread Discord messages using Google Gemini-2.0 Flash.

## Overview

The Discord Summarizer Chrome Extension provides users with a manual way to summarize unread messages in any Discord server or channel. It identifies messages after the last read divider and uses Google Gemini-2.0 Flash for summarization. Summaries are displayed directly inside Discord, with multiple summarization modes and customization options.

## Features

-   **Manual Summarization:** Users trigger summarization manually
-   **Works Across All Servers/Channels:** No restriction on specific servers or channels
-   **Unread Message Detection:** Identifies messages appearing after the "New Messages" divider
-   **Text-Only Summarization:** Only text messages are included; media (images, links, embeds) are ignored
-   **Multiple Summarization Modes:** Brief, Detailed, Key Takeaways
-   **User Customization:** Users can select their preferred summarization style

## Project Structure

```
/discord-summarizer
│── /extension       # Chrome extension code
│── /backend         # Node.js backend for summarization
│── README.md
│── .gitignore
│── package.json
```

## Setup

### Backend

1. Navigate to the `backend` directory
2. Copy `.env.example` to `.env` and add your Google Gemini API key
3. Set up MongoDB:
    - For local development: Install MongoDB and set `MONGODB_URI` in `.env`
    - For production: Create a MongoDB Atlas account and set the connection string in `.env`
4. Install dependencies: `npm install`
5. Start the server: `npm start`

### Chrome Extension

1. Navigate to the `extension` directory
2. Add your own icons in the `images` folder (icon16.png, icon48.png, icon128.png)
3. Load the extension in Chrome:
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the `extension` folder

## Usage

1. Navigate to Discord in your browser
2. When you see unread messages (indicated by the "New Messages" divider), click the "Summarize" button
3. Choose your preferred summarization mode from the dropdown
4. The summary will appear directly in the Discord chat
