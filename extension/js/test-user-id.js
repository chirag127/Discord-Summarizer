// Test script for getDiscordUserId function
// This can be run in the browser console on Discord.com to test the fix

// Mock the original function from content.js
function getDiscordUserId() {
    // Try to find the user ID in localStorage
    try {
        const localStorageData = localStorage.getItem("token");
        if (localStorageData) {
            // The token is a JWT, we can extract the user ID from it
            const tokenParts = localStorageData.split(".");
            if (tokenParts.length === 3) {
                try {
                    // Decode the base64 payload
                    const base64Payload = tokenParts[1];
                    // Make sure the base64 string is properly padded
                    const paddedBase64 = base64Payload.padEnd(
                        base64Payload.length +
                            ((4 - (base64Payload.length % 4)) % 4),
                        "="
                    );

                    // Replace non-URL safe characters
                    const urlSafeBase64 = paddedBase64
                        .replace(/-/g, "+")
                        .replace(/_/g, "/");

                    // Decode and parse
                    const decodedPayload = atob(urlSafeBase64);

                    // Check if the decoded payload is valid before parsing
                    if (
                        decodedPayload &&
                        decodedPayload.trim().startsWith("{")
                    ) {
                        const payload = JSON.parse(decodedPayload);
                        if (payload && payload.user_id) {
                            return payload.user_id;
                        }
                    }
                } catch (decodeError) {
                    console.error("Error decoding token payload:", decodeError);
                }
            }

            // Fallback: Try to get user ID from other Discord sources
            // This is a backup in case the token parsing fails
            try {
                // Look for user ID in the Discord API endpoint cache
                const userCache = localStorage.getItem("user_id_cache");
                if (userCache) {
                    return JSON.parse(userCache);
                }

                // Try to find it in the window.__DISCORD_STORE__ if available
                if (window.__DISCORD_STORE__ && window.__DISCORD_STORE__.user) {
                    return window.__DISCORD_STORE__.user.id;
                }
            } catch (fallbackError) {
                console.error("Error in user ID fallback:", fallbackError);
            }
        }
    } catch (error) {
        console.error("Error getting Discord user ID:", error);
    }

    // If we can't get the user ID, generate a temporary one
    // This allows the extension to work even without a user ID
    const tempId = localStorage.getItem("discord_summarizer_temp_id");
    if (tempId) {
        return tempId;
    }

    // Generate a random ID if we don't have one yet
    const randomId = "temp_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("discord_summarizer_temp_id", randomId);
    return randomId;
}

// Test the function
console.log("Testing getDiscordUserId function...");
const userId = getDiscordUserId();
console.log("User ID:", userId);

// If we got a temporary ID, log that information
if (userId && userId.startsWith("temp_")) {
    console.log("Using temporary user ID. This is normal if Discord token couldn't be parsed.");
}

console.log("Test complete!");
