# Discord Summarizer Chrome Extension

This Chrome extension allows you to summarize unread Discord messages using Google Gemini-2.0 Flash.

## Features

- Manual summarization of unread messages
- Works across all Discord servers and channels
- Multiple summarization modes: Brief, Detailed, Key Takeaways
- Customizable summary style

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `extension` folder from this repository
5. The extension should now be installed and ready to use

## Usage

1. Navigate to Discord in your browser
2. When you see unread messages (indicated by the "New Messages" divider), click the "Summarize" button
3. Choose your preferred summarization mode from the dropdown
4. The summary will appear directly in the Discord chat

## Development

- Edit `js/env.js` to switch between development and production environments
- The extension communicates with a backend API for summarization

## Icons

You need to add your own icons in the `images` folder:
- icon16.png (16x16)
- icon48.png (48x48)
- icon128.png (128x128)
