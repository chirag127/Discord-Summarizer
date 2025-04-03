# Discord Summarizer - Summary Display Update

This update changes how summaries are displayed in Discord based on the message selection type.

## Changes Made

### 1. Different Display for Recent Messages

- **Before**: All summaries (unread and recent) were displayed in a semi-transparent popup
- **After**: Recent message summaries now appear at the bottom of the chat with an opaque background

### 2. Visual Differentiation

- **Unread Messages**: Blue left border, slightly transparent background
- **Recent Messages**: Green left border, fully opaque background

### 3. Improved Positioning

- **Unread Messages**: Still appear after the "New Messages" divider
- **Recent Messages**: Always appear at the bottom of the chat

### 4. Title Customization

- Titles now reflect the message selection type:
  - "Unread Messages Summary" for unread messages
  - "Last X Messages Summary" for recent messages (where X is the number of messages)

## Technical Implementation

1. Added message selection type tracking in the `displaySummary` function
2. Created different CSS classes for unread vs. recent summaries
3. Implemented different insertion logic based on the message selection type
4. Updated both `handleSummarizeClick` and `handleSummarizeFromPopup` functions to pass the message selection type

## Benefits

- **Better Visibility**: Recent message summaries are now more visible with an opaque background
- **Logical Placement**: Summaries appear in more intuitive locations based on what they're summarizing
- **Visual Distinction**: Users can easily tell what type of summary they're looking at
- **Consistent Experience**: Works the same way whether triggered from the button or the popup

## How to Test

1. **For Unread Messages**:
   - Find a Discord channel with unread messages
   - Click the "Summarize" button in the chat
   - The summary should appear after the "New Messages" divider with a blue border

2. **For Recent Messages**:
   - Open the extension popup
   - Select "Recent Messages" from the dropdown
   - Enter the number of messages to summarize
   - Click "Summarize Messages"
   - The summary should appear at the bottom of the chat with a green border
