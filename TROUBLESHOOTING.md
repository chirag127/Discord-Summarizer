# Discord Summarizer - Troubleshooting Guide

## Common Issues and Solutions

### "Could not establish connection. Receiving end does not exist."

This error typically occurs when the popup tries to communicate with a content script that isn't loaded or ready.

**Solutions:**

1. **Refresh the Discord tab**
   - The most common fix is to simply refresh the Discord tab
   - Make sure Discord is fully loaded before trying to use the extension

2. **Check if you're on Discord**
   - The extension only works on Discord websites (discord.com)
   - Make sure you have Discord open in the active tab

3. **Restart Chrome**
   - Sometimes Chrome's extension system needs a restart
   - Close and reopen Chrome, then try again

4. **Reinstall the extension**
   - If the issue persists, try reinstalling the extension:
     1. Go to `chrome://extensions/`
     2. Remove the Discord Summarizer extension
     3. Load it again using "Load unpacked"

5. **Check the console for errors**
   - Open Chrome DevTools in the Discord tab (F12 or right-click > Inspect)
   - Look for any errors in the Console tab that might indicate what's wrong

### Extension not working on Discord

If the extension doesn't appear to be working on Discord:

1. **Check permissions**
   - Make sure the extension has permission to access Discord
   - You might need to click "Allow" if prompted

2. **Verify Discord URL**
   - The extension is configured to work on URLs matching `*://*.discord.com/*`
   - Make sure you're on a URL that matches this pattern

3. **Check for conflicts**
   - Other Discord-related extensions might conflict with Discord Summarizer
   - Try temporarily disabling other Discord extensions

### Summary not appearing

If you click the Summarize button but no summary appears:

1. **Check for unread messages**
   - The extension needs unread messages to summarize
   - If there are no unread messages, try using the "Recent Messages" option in the popup

2. **Verify backend connection**
   - Make sure the backend server is running
   - Check that the API URL in `env.js` is correct

3. **Look for errors in the console**
   - Open Chrome DevTools (F12) and check the Console tab for any error messages

## Still having issues?

If you're still experiencing problems after trying these solutions, please:

1. Take a screenshot of any error messages
2. Note the steps you took when the error occurred
3. Check the browser console for any additional error information
4. Contact the developer with this information
