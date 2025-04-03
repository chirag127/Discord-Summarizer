# Discord Summarizer - Recent Messages Display Update

This update changes how summaries are displayed when using the "Recent Messages" selection option.

## Changes Made

1. **Different Display for Recent Messages**:
   - Recent message summaries now appear at the end of the chat with an opaque background
   - Unread message summaries still use the semi-transparent overlay style

2. **Visual Distinctions**:
   - Recent message summaries have a green accent color (instead of blue)
   - Different header styling to distinguish between summary types
   - Added shadow effect for better visibility

3. **Implementation Details**:
   - Modified the `displaySummary` function to handle different message selection types
   - Added new CSS classes for recent message summaries
   - Updated the summary title to reflect the message selection type

## How It Works

The extension now:

1. Checks the `messageSelection` parameter passed to `displaySummary`
2. For "recent" messages:
   - Applies the `discord-summarizer-recent` class
   - Always appends the summary to the end of the chat
   - Uses a fully opaque background with green accent
   
3. For "unread" messages (default):
   - Continues to use the semi-transparent overlay
   - Places the summary after the "New Messages" divider
   - Uses the original blue accent color

## Benefits

- **Better Readability**: Opaque background ensures text is always readable
- **Contextual Placement**: Recent message summaries appear at the end of the chat where they make more sense
- **Visual Distinction**: Different styling helps users understand which type of summary they're viewing
- **Improved User Experience**: Summaries are now more integrated with Discord's UI

## Testing

To test this feature:

1. Open the extension popup
2. Select "Recent Messages" from the dropdown
3. Enter the number of messages to summarize
4. Click "Summarize Messages"
5. Verify the summary appears at the end of the chat with an opaque background and green accent
