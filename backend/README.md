# Discord Summarizer Backend

This is the backend API for the Discord Summarizer Chrome Extension. It uses Google Gemini-2.0 Flash for summarizing Discord messages and MongoDB for storing summaries.

## Setup

1. Copy `.env.example` to `.env` and add your Google Gemini API key
2. Set up MongoDB:
   - For local development: Install MongoDB and set `MONGODB_URI` in `.env`
   - For production: Create a MongoDB Atlas account and set the connection string in `.env`
3. Install dependencies: `npm install`
4. Start the server: `npm start`

## Getting a Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click on "Get API key" or "Create API key"
4. Copy the API key and paste it in your `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## API Endpoints

- **POST /summarize** - Generate a summary from Discord messages
  - Request body: `{ messages, mode, style, userId, serverId, channelId }`
  - Response: `{ summary, summaryId }`

- **GET /summaries/:userId** - Get summaries for a specific user
  - Response: `{ summaries: [...] }`

- **GET /summaries/channel/:serverId/:channelId** - Get summaries for a specific channel
  - Response: `{ summaries: [...] }`

- **DELETE /summaries/:summaryId** - Delete a specific summary
  - Response: `{ success, message }`

## Troubleshooting

If you see "Error calling Gemini API" in the server logs, it means your API key is invalid or has expired. Get a new API key from Google AI Studio and update your `.env` file.

If the API key is valid but you still see errors, the server will automatically fall back to using mock summaries instead of real ones.
