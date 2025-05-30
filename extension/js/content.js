// Content script for Discord Summarizer extension

// Function declarations - Define all functions at the top level for hoisting

// Load TTS settings from storage
function getTTSSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(
            ["ttsRate", "ttsPitch", "ttsVoice"],
            (result) => {
                const settings = {
                    rate: result.ttsRate ? parseFloat(result.ttsRate) : 1.0,
                    pitch: result.ttsPitch ? parseFloat(result.ttsPitch) : 1.0,
                    voiceName: result.ttsVoice || null,
                };
                resolve(settings);
            }
        );
    });
}

// Dynamically load the TTS script
function loadTTSScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.ttsController) {
            resolve();
            return;
        }

        // Create script element
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("js/tts.js");
        script.onload = () => {
            console.log("TTS script loaded");
            resolve();
        };
        script.onerror = (error) => {
            console.error("Error loading TTS script:", error);
            reject(error);
        };

        // Add to document
        (document.head || document.documentElement).appendChild(script);
    });
}

// Get Discord user ID from the page
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

// Get Discord server and channel IDs from the URL
function getDiscordIds() {
    const url = window.location.href;
    const match = url.match(/channels\/(\d+)\/(\d+)/);

    if (match && match.length === 3) {
        return {
            serverId: match[1],
            channelId: match[2],
        };
    }

    return {
        serverId: null,
        channelId: null,
    };
}

// Show notification
function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "discord-summarizer-notification";
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// These history-related functions have been removed

// Initialize the extension immediately and also when the page is fully loaded
try {
    initDiscordSummarizer();
    console.log("Discord Summarizer initialized on first load");
} catch (error) {
    console.error("Error initializing Discord Summarizer:", error);
}

// Also listen for DOMContentLoaded in case the script runs before the page is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        try {
            initDiscordSummarizer();
            console.log("Discord Summarizer initialized on DOMContentLoaded");
        } catch (error) {
            console.error(
                "Error initializing Discord Summarizer on DOMContentLoaded:",
                error
            );
        }
    });
}

// Also listen for load event as a fallback
window.addEventListener("load", () => {
    try {
        initDiscordSummarizer();
        console.log("Discord Summarizer initialized on window load");
    } catch (error) {
        console.error(
            "Error initializing Discord Summarizer on window load:",
            error
        );
    }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    // Handle ping request to check if content script is ready
    if (request.action === "ping") {
        sendResponse({ status: "ready" });
        return false;
    }

    // Handle summarize request
    if (request.action === "summarizeFromPopup") {
        const options = {
            messageSelection: request.messageSelection,
            messageCount: request.messageCount,
        };
        handleSummarizeFromPopup(sendResponse, options);
        return true; // Required for async sendResponse
    }
});

// Main initialization function
function initDiscordSummarizer() {
    console.log("Discord Summarizer initialized");

    // Add the summarize button to Discord UI
    addSummarizeButton();

    // Listen for navigation changes (Discord is a SPA)
    observeDiscordNavigation();
}

// Add the summarize button to Discord UI if unread messages exist
function addSummarizeButton() {
    // Look for the Discord chat input area
    const chatInput = document.querySelector('[class*="channelTextArea"]');
    // Check for the unread messages divider
    const unreadDivider = document.querySelector(
        'div[class*="divider"][class*="isUnread"]'
    );
    // Check if button already exists
    const existingButton = document.getElementById("discord-summarizer-btn");

    // Only add if chat input and unread divider exist, and button doesn't exist
    if (chatInput && unreadDivider && !existingButton) {
        console.log("Adding Summarize button (unread messages found).");
        // Create the summarize button
        const summarizeBtn = document.createElement("button");
        summarizeBtn.id = "discord-summarizer-btn";
        summarizeBtn.className = "discord-summarizer-btn";
        summarizeBtn.innerHTML = "<span>Summarize</span>";
        summarizeBtn.title = "Summarize unread messages";

        // Add click event listener
        summarizeBtn.addEventListener("click", handleSummarizeClick);

        // Add the button to the UI
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "discord-summarizer-container";
        buttonContainer.id = "discord-summarizer-container"; // Add ID for easier removal
        buttonContainer.appendChild(summarizeBtn);

        // Insert before the chat input
        chatInput.parentNode.insertBefore(buttonContainer, chatInput);
    } else if (!unreadDivider && existingButton) {
        // If no unread divider but button exists, remove it (handled by observer now, but good practice)
        removeSummarizeButton();
    }
}

// Remove the summarize button from Discord UI
function removeSummarizeButton() {
    const buttonContainer = document.getElementById(
        "discord-summarizer-container"
    );
    if (buttonContainer) {
        console.log("Removing Summarize button (no unread messages).");
        buttonContainer.remove();
    }
}

// These functions have been removed as they are no longer needed

// Handle summarize button click
async function handleSummarizeClick() {
    try {
        // Show loading state
        const summarizeBtn = document.getElementById("discord-summarizer-btn");
        const originalText = summarizeBtn.innerHTML;
        summarizeBtn.innerHTML = "<span>Summarizing...</span>";
        summarizeBtn.disabled = true;

        try {
            // Use fixed defaults: "brief" mode and "unread" messages
            const summaryTitle = "Unread Messages Summary";

            // Get unread messages
            const messages = getUnreadMessages();

            if (messages.length === 0) {
                showNotification("No unread messages found");
                summarizeBtn.innerHTML = originalText;
                summarizeBtn.disabled = false;
                return;
            }

            // Set fixed preferences
            const preferences = {
                summaryMode: "detailed",
                summaryStyle: "paragraphs",
            };

            // Send to backend for summarization
            const summary = await getSummary(messages, preferences);

            // Display the summary
            displaySummary(summary, preferences, {
                title: summaryTitle,
            });

            // Reset button
            summarizeBtn.innerHTML = originalText;
            summarizeBtn.disabled = false;
        } catch (error) {
            console.error("Error in message selection:", error);
            showNotification("Error summarizing messages");
            summarizeBtn.innerHTML = originalText;
            summarizeBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error summarizing messages:", error);
        showNotification("Error summarizing messages");

        // Reset button
        const summarizeBtn = document.getElementById("discord-summarizer-btn");
        summarizeBtn.innerHTML = "<span>Summarize</span>";
        summarizeBtn.disabled = false;
    }
}

// This function has been moved to the top of the file

// Get unread messages from Discord
function getUnreadMessages() {
    const messages = [];

    // Find the "New Messages" divider
    const newMessagesDivider = document.querySelector(
        'div[class*="divider"][class*="isUnread"]'
    );

    if (!newMessagesDivider) {
        return messages;
    }

    // Get all message containers after the divider
    let currentElement = newMessagesDivider.nextElementSibling;

    while (currentElement) {
        // Check if it's a message container
        const messageContent = currentElement.querySelector(
            '[class*="messageContent"]'
        );

        if (messageContent) {
            // Get the author
            const authorElement = currentElement.querySelector(
                '[class*="username"]'
            );
            const author = authorElement
                ? authorElement.textContent
                : "Unknown User";

            // Get the message text
            const text = messageContent.textContent;

            // Add to messages array
            messages.push({
                author,
                text,
                timestamp: new Date().toISOString(), // We don't parse the timestamp for simplicity
            });
        }

        currentElement = currentElement.nextElementSibling;
    }

    return messages;
}

// Get recent messages from Discord
function getRecentMessages(count = 20) {
    const messages = [];

    // Find all message containers in the current channel
    const messageContainers = document.querySelectorAll('[class*="message"]');

    // Get the most recent messages up to the count
    const recentMessages = Array.from(messageContainers).slice(-count);

    for (const container of recentMessages) {
        // Check if it's a valid message container
        const messageContent = container.querySelector(
            '[class*="messageContent"]'
        );

        if (messageContent) {
            // Get the author
            const authorElement = container.querySelector(
                '[class*="username"]'
            );
            const author = authorElement
                ? authorElement.textContent
                : "Unknown User";

            // Get the message text
            const text = messageContent.textContent;

            // Add to messages array
            messages.push({
                author,
                text,
                timestamp: new Date().toISOString(), // We don't parse the timestamp for simplicity
            });
        }
    }

    return messages;
}

// Get summary preferences from storage
function getSummaryPreferences() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { action: "getSummaryPreferences" },
            (response) => {
                resolve(
                    response || {
                        summaryMode: "detailed",
                        summaryStyle: "paragraphs",
                    }
                );
            }
        );
    });
}

// This function has been moved to the top of the file

// This function has been moved to the top of the file

// Send messages to backend for summarization
async function getSummary(messages, preferences) {
    try {
        // Get user and channel information
        const userId = getDiscordUserId();
        const { serverId, channelId } = getDiscordIds();

        // Debug information
        console.log(
            "Sending request to:",
            CONFIG ? CONFIG.API_URL : "CONFIG not defined"
        );
        console.log("Messages:", messages);
        console.log("Preferences:", preferences);

        // Check if CONFIG is defined
        if (!CONFIG || !CONFIG.API_URL) {
            console.error("CONFIG or CONFIG.API_URL is not defined");
            // Fallback to localhost if CONFIG is not defined
            var apiUrl = "http://localhost:3000";
        } else {
            var apiUrl = CONFIG.API_URL;
        }

        const response = await fetch(`${apiUrl}/summarize`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages,
                mode: preferences.summaryMode,
                style: preferences.summaryStyle,
                userId,
                serverId,
                channelId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response:", data);

        // Store the summaryId in the response for potential future use
        const result = {
            summary: data.summary,
            summaryId: data.summaryId,
        };

        return result.summary;
    } catch (error) {
        console.error("Error getting summary:", error);
        showNotification("Error: " + error.message);
        throw error;
    }
}

// This function has been moved to the top of the file

// Display the summary in Discord
function displaySummary(summary, preferences, options = {}) {
    // Create summary container
    const summaryContainer = document.createElement("div");
    summaryContainer.className = "discord-summarizer-summary";

    // Create header
    const header = document.createElement("div");
    header.className = "discord-summarizer-header";

    const title = document.createElement("h3");
    if (options.title) {
        title.textContent = options.title;
    } else {
        title.textContent = `Summary (${preferences.summaryMode.replace(
            "_",
            " "
        )})`;
    }
    header.appendChild(title);

    // Create buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "discord-summarizer-buttons";

    // Create TTS button
    const ttsBtn = document.createElement("button");
    ttsBtn.className = "discord-summarizer-tts-btn";
    ttsBtn.innerHTML = "🔊";
    ttsBtn.title = "Text to Speech";
    buttonsContainer.appendChild(ttsBtn);

    // Create copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "discord-summarizer-copy-btn";
    copyBtn.textContent = "Copy";
    copyBtn.title = "Copy to Clipboard";
    buttonsContainer.appendChild(copyBtn);

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "discord-summarizer-close";
    closeBtn.innerHTML = "×";
    closeBtn.title = "Close Summary";
    closeBtn.addEventListener("click", () => {
        // Cancel any ongoing speech when closing
        if (window.ttsController && window.ttsController.isPlaying) {
            window.ttsController.cancel();
        }
        summaryContainer.remove();
    });
    buttonsContainer.appendChild(closeBtn);

    header.appendChild(buttonsContainer);
    summaryContainer.appendChild(header);

    // Create content
    const content = document.createElement("div");
    content.className = "discord-summarizer-content";
    content.innerHTML = summary;
    content.setAttribute("tabindex", "0"); // Make focusable for better accessibility
    content.setAttribute("role", "textbox"); // Semantic role for text content
    content.setAttribute("aria-readonly", "true"); // Indicate it's readonly

    // Add TTS functionality
    if (ttsBtn) {
        ttsBtn.addEventListener("click", async () => {
            // Check if Web Speech API is supported
            if (!window.speechSynthesis) {
                showNotification(
                    "Text-to-speech is not supported in your browser"
                );
                return;
            }

            // Load TTS settings from storage
            const ttsSettings = await getTTSSettings();

            // Initialize TTS controller if not already done
            if (!window.ttsController) {
                // Dynamically load the TTS script if not already loaded
                await loadTTSScript();
            }

            // Wait for ttsController to be available
            if (!window.ttsController) {
                showNotification("Error initializing text-to-speech");
                return;
            }

            // Initialize with settings
            await window.ttsController.init(ttsSettings);

            // If already playing, stop it
            if (window.ttsController.isPlaying) {
                window.ttsController.cancel();
                ttsBtn.textContent = "🔊";
                ttsBtn.classList.remove("playing");
                return;
            }

            // Get the text content
            const textContent = content.innerText || content.textContent;

            // Prepare and play the speech
            window.ttsController
                .prepare(textContent, content, () => {
                    // Reset button when speech ends
                    ttsBtn.textContent = "🔊";
                    ttsBtn.classList.remove("playing");
                })
                .play();

            // Update button state
            ttsBtn.textContent = "⏹️";
            ttsBtn.classList.add("playing");
        });
    }

    // Add copy functionality
    if (copyBtn) {
        copyBtn.addEventListener("click", () => {
            // Get the text content
            const textContent = content.innerText || content.textContent;

            // Use the Clipboard API if available
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard
                    .writeText(textContent)
                    .then(() => {
                        // Show feedback
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = "Copied!";
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    })
                    .catch((err) => {
                        console.error("Could not copy text: ", err);
                        showNotification("Error copying to clipboard");
                    });
            } else {
                // Fallback for older browsers
                try {
                    // Create a range and select the content
                    const range = document.createRange();
                    range.selectNodeContents(content);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // Try to copy using document.execCommand as a fallback
                    const successful = document.execCommand("copy");
                    if (successful) {
                        // Show feedback
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = "Copied!";
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    } else {
                        showNotification("Failed to copy to clipboard");
                    }

                    // Deselect
                    selection.removeAllRanges();
                } catch (err) {
                    console.error("Could not copy text: ", err);
                    showNotification("Error copying to clipboard");
                }
            }
        });
    }

    summaryContainer.appendChild(content);

    // Find the messages container
    const messagesContainer = document.querySelector(
        '[class*="messagesWrapper"]'
    );

    if (messagesContainer) {
        // Insert after the "New Messages" divider
        const newMessagesDivider = document.querySelector(
            'div[class*="divider"][class*="isUnread"]'
        );

        if (newMessagesDivider) {
            newMessagesDivider.parentNode.insertBefore(
                summaryContainer,
                newMessagesDivider.nextSibling
            );
        } else {
            // If no divider, insert at the bottom
            messagesContainer.appendChild(summaryContainer);
        }

        // Scroll to the summary
        summaryContainer.scrollIntoView({ behavior: "smooth" });
    }
}

// This function has been moved to the top of the file

// This function has been moved to the top of the file

// Handle summarize request from popup
async function handleSummarizeFromPopup(sendResponse, options = {}) {
    try {
        console.log("Handling popup request with options:", options);

        // Check if we're on Discord
        if (!window.location.href.includes("discord.com")) {
            console.error("Not on Discord website");
            sendResponse({ success: false, error: "Not on Discord" });
            showNotification("Error: Not on Discord website");
            return;
        }

        // Get messages based on selection type
        let messages = [];
        const messageSelection = options.messageSelection || "unread";
        const messageCount = options.messageCount || 20;

        console.log("Message selection:", messageSelection);
        console.log("Message count:", messageCount);

        if (messageSelection === "unread") {
            messages = getUnreadMessages();
            console.log("Unread messages found:", messages.length);
            if (messages.length === 0) {
                sendResponse({
                    success: false,
                    error: "No unread messages found",
                });
                showNotification("No unread messages found");
                return;
            }
        } else if (messageSelection === "recent") {
            messages = getRecentMessages(messageCount);
            console.log("Recent messages found:", messages.length);
            if (messages.length === 0) {
                sendResponse({
                    success: false,
                    error: "No messages found in this channel",
                });
                showNotification("No messages found in this channel");
                return;
            }
        }

        // Get summary preferences
        const preferences = await getSummaryPreferences();
        console.log("Summary preferences:", preferences);

        try {
            // Send to backend for summarization
            const summary = await getSummary(messages, preferences);
            console.log(
                "Summary received:",
                summary ? summary.substring(0, 50) + "..." : "No summary"
            );

            // For recent messages, send the summary back to the popup instead of displaying it on the page
            if (messageSelection === "recent") {
                // Create a title based on the message selection and preferences
                const title = `Recent Messages Summary (${messageCount} messages, ${preferences.summaryMode.replace(
                    "_",
                    " "
                )} mode)`;

                // Send the summary back to the popup
                sendResponse({
                    success: true,
                    summary: summary,
                    title: title,
                });
            } else {
                // For unread messages, display the summary in Discord as before
                displaySummary(summary, preferences, {
                    title: "Unread Messages Summary",
                });

                sendResponse({ success: true });
            }
        } catch (summaryError) {
            console.error("Error getting summary:", summaryError);
            sendResponse({
                success: false,
                error: summaryError.message || "Error getting summary",
            });
            showNotification(
                "Error: " + (summaryError.message || "Failed to get summary")
            );
        }
    } catch (error) {
        console.error("Error handling popup request:", error);
        sendResponse({
            success: false,
            error: error.message || "Unknown error",
        });
        showNotification("Error: " + (error.message || "Unknown error"));
    }
}

// Observe Discord navigation changes
// Observe changes in Discord UI for navigation and unread status
function observeDiscordNavigation() {
    const observer = new MutationObserver((mutations) => {
        let unreadStatusPotentiallyChanged = false;

        // Check mutations for changes that might affect the unread divider
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                // Check added nodes for the divider or message list changes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node itself or its descendants match the unread divider or a relevant container
                        if (
                            node.matches &&
                            (node.matches(
                                'div[class*="divider"][class*="isUnread"]'
                            ) ||
                                node.querySelector(
                                    'div[class*="divider"][class*="isUnread"]'
                                ) ||
                                node.matches('[class*="scrollerInner"]') ||
                                node.matches('[class*="messagesWrapper"]'))
                        ) {
                            unreadStatusPotentiallyChanged = true;
                        }
                    }
                });
                // Check removed nodes for the divider
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (
                            node.matches &&
                            node.matches(
                                'div[class*="divider"][class*="isUnread"]'
                            )
                        ) {
                            unreadStatusPotentiallyChanged = true;
                        }
                    }
                });
            }
            // Also consider attribute changes on the divider itself if its class changes
            if (
                mutation.type === "attributes" &&
                mutation.target.matches &&
                mutation.target.matches('div[class*="divider"]')
            ) {
                unreadStatusPotentiallyChanged = true;
            }

            if (unreadStatusPotentiallyChanged) break; // No need to check further mutations if we already know
        }

        // If potential change detected, check current state and update button
        if (unreadStatusPotentiallyChanged) {
            // Use a small timeout to debounce checks and wait for DOM to settle
            setTimeout(() => {
                const unreadDivider = document.querySelector(
                    'div[class*="divider"][class*="isUnread"]'
                );
                if (unreadDivider) {
                    addSummarizeButton(); // Will only add if not already present
                } else {
                    removeSummarizeButton(); // Will only remove if present
                }
            }, 150); // Slightly increased delay for stability
        }
    });

    // Start observing the body for changes relevant to messages and dividers
    // Observe deeper within the chat area if possible for better performance,
    // but observing the body is a robust fallback.
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true, // Observe attribute changes (like class changes on the divider)
        attributeFilter: ["class"], // Only watch class attribute changes
    });
}
