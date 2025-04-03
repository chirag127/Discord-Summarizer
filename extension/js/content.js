// Content script for Discord Summarizer extension

// Initialize the extension immediately and also when the page is fully loaded
initDiscordSummarizer();

// Also listen for DOMContentLoaded in case the script runs before the page is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initDiscordSummarizer();
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarizeFromPopup") {
        handleSummarizeFromPopup(sendResponse);
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

// Add the summarize button to Discord UI
function addSummarizeButton() {
    // Wait for Discord to fully load
    const checkInterval = setInterval(() => {
        // Look for the Discord chat input area
        const chatInput = document.querySelector('[class*="channelTextArea"]');

        if (chatInput && !document.getElementById("discord-summarizer-btn")) {
            clearInterval(checkInterval);

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
            buttonContainer.appendChild(summarizeBtn);

            // Add mode selector
            const modeSelector = createModeSelector();
            buttonContainer.appendChild(modeSelector);

            // Add history button
            const historyBtn = document.createElement("button");
            historyBtn.id = "discord-summarizer-history-btn";
            historyBtn.className = "discord-summarizer-history-btn";
            historyBtn.innerHTML = "<span>History</span>";
            historyBtn.title = "View summary history";
            historyBtn.addEventListener("click", handleHistoryClick);
            buttonContainer.appendChild(historyBtn);

            // Insert before the chat input
            chatInput.parentNode.insertBefore(buttonContainer, chatInput);
        }
    }, 1000);
}

// Create mode selector dropdown
function createModeSelector() {
    const modeSelector = document.createElement("select");
    modeSelector.id = "discord-summarizer-mode";
    modeSelector.className = "discord-summarizer-mode";

    const modes = [
        { value: "brief", label: "Brief" },
        { value: "detailed", label: "Detailed" },
        { value: "key_takeaways", label: "Key Takeaways" },
    ];

    modes.forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode.value;
        option.textContent = mode.label;
        modeSelector.appendChild(option);
    });

    // Get saved preference
    chrome.runtime.sendMessage(
        { action: "getSummaryPreferences" },
        (response) => {
            if (response && response.summaryMode) {
                modeSelector.value = response.summaryMode;
            }
        }
    );

    // Save preference when changed
    modeSelector.addEventListener("change", (e) => {
        chrome.storage.sync.set({ summaryMode: e.target.value });
    });

    return modeSelector;
}

// Handle summarize button click
async function handleSummarizeClick() {
    try {
        // Show loading state
        const summarizeBtn = document.getElementById("discord-summarizer-btn");
        const originalText = summarizeBtn.innerHTML;
        summarizeBtn.innerHTML = "<span>Summarizing...</span>";
        summarizeBtn.disabled = true;

        // Get unread messages
        const messages = getUnreadMessages();

        if (messages.length === 0) {
            showNotification("No unread messages found");
            summarizeBtn.innerHTML = originalText;
            summarizeBtn.disabled = false;
            return;
        }

        // Get summary preferences
        const preferences = await getSummaryPreferences();

        // Send to backend for summarization
        const summary = await getSummary(messages, preferences);

        // Display the summary
        displaySummary(summary, preferences);

        // Reset button
        summarizeBtn.innerHTML = originalText;
        summarizeBtn.disabled = false;
    } catch (error) {
        console.error("Error summarizing messages:", error);
        showNotification("Error summarizing messages");

        // Reset button
        const summarizeBtn = document.getElementById("discord-summarizer-btn");
        summarizeBtn.innerHTML = "<span>Summarize</span>";
        summarizeBtn.disabled = false;
    }
}

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

// Get summary preferences from storage
function getSummaryPreferences() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { action: "getSummaryPreferences" },
            (response) => {
                resolve(
                    response || {
                        summaryMode: "brief",
                        summaryStyle: "bullets",
                    }
                );
            }
        );
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
                const payload = JSON.parse(atob(tokenParts[1]));
                return payload.user_id || null;
            }
        }
    } catch (error) {
        console.error("Error getting Discord user ID:", error);
    }

    return null;
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

// Send messages to backend for summarization
async function getSummary(messages, preferences) {
    try {
        // Get user and channel information
        const userId = getDiscordUserId();
        const { serverId, channelId } = getDiscordIds();

        const response = await fetch(`${CONFIG.API_URL}/summarize`, {
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

        // Store the summaryId in the response for potential future use
        const result = {
            summary: data.summary,
            summaryId: data.summaryId,
        };

        return result.summary;
    } catch (error) {
        console.error("Error getting summary:", error);
        throw error;
    }
}

// Display the summary in Discord
function displaySummary(summary, preferences) {
    // Create summary container
    const summaryContainer = document.createElement("div");
    summaryContainer.className = "discord-summarizer-summary";

    // Create header
    const header = document.createElement("div");
    header.className = "discord-summarizer-header";

    const title = document.createElement("h3");
    title.textContent = `Summary (${preferences.summaryMode.replace(
        "_",
        " "
    )})`;
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "discord-summarizer-close";
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", () => {
        summaryContainer.remove();
    });
    header.appendChild(closeBtn);

    summaryContainer.appendChild(header);

    // Create content
    const content = document.createElement("div");
    content.className = "discord-summarizer-content";
    content.innerHTML = summary;
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

// Handle summarize request from popup
async function handleSummarizeFromPopup(sendResponse) {
    try {
        // Check if we're on Discord
        if (!window.location.href.includes("discord.com")) {
            sendResponse({ success: false, error: "Not on Discord" });
            return;
        }

        // Get unread messages
        const messages = getUnreadMessages();

        if (messages.length === 0) {
            sendResponse({ success: false, error: "No unread messages found" });
            return;
        }

        // Get summary preferences
        const preferences = await getSummaryPreferences();

        // Send to backend for summarization
        const summary = await getSummary(messages, preferences);

        // Display the summary
        displaySummary(summary, preferences);

        sendResponse({ success: true });
    } catch (error) {
        console.error("Error handling popup request:", error);
        sendResponse({ success: false, error: error.message });
    }
}

// Observe Discord navigation changes
function observeDiscordNavigation() {
    // Discord is a SPA, so we need to observe navigation changes
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (
                mutation.type === "childList" &&
                mutation.addedNodes.length > 0
            ) {
                // Check if we need to re-add the summarize button
                if (!document.getElementById("discord-summarizer-btn")) {
                    addSummarizeButton();
                }
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
