# Discord Summarizer - Simplified Version

This version of the Discord Summarizer has been simplified to focus on the core functionality:

## Changes Made

### Frontend (Extension)

1. **Removed UI Elements**:
   - Removed the mode selector dropdown (brief/detailed/key takeaways)
   - Removed the message selection dropdown (unread/recent)
   - Removed the history button
   - Only the "Summarize" button remains in the chat

2. **Fixed Default Settings**:
   - Always uses "brief" mode for summaries
   - Always summarizes "unread" messages
   - No user preferences are stored

3. **Simplified Code**:
   - Removed all preference-related code
   - Removed all history-related functions
   - Simplified message handling

### Backend

1. **Removed Database**:
   - Removed MongoDB connection and related code
   - Removed all database-related endpoints
   - Removed summary storage functionality

2. **Simplified API**:
   - Only the `/summarize` endpoint remains
   - No user data or summaries are stored

3. **Dependencies**:
   - Removed MongoDB dependency

## How It Works Now

1. User clicks the "Summarize" button in Discord
2. Extension collects unread messages
3. Messages are sent to the backend
4. Backend uses Google Gemini to generate a brief summary
5. Summary is displayed in Discord
6. No data is stored or saved

## Installation and Setup

### Backend

1. Navigate to the `backend` directory
2. Copy `.env.example` to `.env` and add your Google Gemini API key
3. Install dependencies: `npm install`
4. Start the server: `npm start`

### Chrome Extension

1. Navigate to the `extension` directory
2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

## Usage

1. Navigate to Discord in your browser
2. When you see unread messages, click the "Summarize" button
3. The summary will appear directly in the Discord chat
