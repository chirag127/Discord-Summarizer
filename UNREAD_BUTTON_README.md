# Discord Summarizer - Unread Messages Button Update

This update modifies the Discord Summarizer extension to only show the "Summarize" button when there are unread messages in the current channel.

## Changes Made

1. **Dynamic Button Display**:
   - The "Summarize" button now only appears when there are unread messages
   - The button automatically disappears when all messages are read
   - The button automatically appears when new unread messages arrive

2. **Implementation Details**:
   - Added detection for the Discord unread messages divider
   - Implemented MutationObservers to watch for changes in the chat area
   - Added logic to add/remove the button based on the presence of unread messages
   - Enhanced channel navigation handling to update button visibility

## How It Works

The extension now:

1. Checks for the presence of the "New Messages" divider in Discord (the red line that separates read and unread messages)
2. Only shows the "Summarize" button when this divider is present
3. Automatically removes the button when all messages are marked as read
4. Automatically adds the button when new messages arrive
5. Updates button visibility when switching between channels

## Technical Implementation

The implementation uses two MutationObservers:

1. **Chat Observer**: Watches for changes within the current chat area, such as new messages or messages being marked as read
2. **Channel Observer**: Watches for navigation between different Discord channels

Both observers check for the presence of the unread messages divider and update the button visibility accordingly.

## Benefits

- **Cleaner UI**: The button only appears when it's actually useful
- **Better UX**: Users can immediately see when summarization is available
- **Reduced Confusion**: Prevents attempting to summarize when there are no unread messages

## Testing

To test this feature:

1. Join a Discord server with unread messages
2. Verify the "Summarize" button appears
3. Read all messages and verify the button disappears
4. Wait for new messages and verify the button reappears
5. Switch between channels with and without unread messages to verify the button appears/disappears appropriately
