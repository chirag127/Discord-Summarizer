// Content script for Discord Summarizer extension

// Function declarations - Define all functions at the top level for hoisting

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

// Get summary history from backend
async function getSummaryHistory(userId) {
    try {
        // Check if CONFIG is defined
        if (!CONFIG || !CONFIG.API_URL) {
            console.error("CONFIG or CONFIG.API_URL is not defined");
            // Fallback to localhost if CONFIG is not defined
            var apiUrl = "http://localhost:3000";
        } else {
            var apiUrl = CONFIG.API_URL;
        }

        console.log(
            "Fetching summary history from:",
            `${apiUrl}/summaries/${userId}`
        );

        const response = await fetch(`${apiUrl}/summaries/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("History API response:", data);

        return data.summaries || [];
    } catch (error) {
        console.error("Error getting summary history:", error);
        throw error;
    }
}

// Display summary history in Discord
function displaySummaryHistory(summaries) {
    // Create history container
    const historyContainer = document.createElement("div");
    historyContainer.className = "discord-summarizer-history";

    // Create header
    const header = document.createElement("div");
    header.className = "discord-summarizer-header";

    const title = document.createElement("h3");
    title.textContent = "Summary History";
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "discord-summarizer-close";
    closeBtn.innerHTML = "×";
    closeBtn.addEventListener("click", () => {
        historyContainer.remove();
    });
    header.appendChild(closeBtn);

    historyContainer.appendChild(header);

    // Create content
    const content = document.createElement("div");
    content.className = "discord-summarizer-history-content";

    // Add each summary
    summaries.forEach((summary) => {
        const summaryItem = document.createElement("div");
        summaryItem.className = "discord-summarizer-history-item";

        // Create summary header
        const summaryHeader = document.createElement("div");
        summaryHeader.className = "discord-summarizer-history-item-header";

        // Format date
        const date = new Date(summary.createdAt);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        // Add summary info
        const summaryInfo = document.createElement("div");
        summaryInfo.className = "discord-summarizer-history-item-info";
        summaryInfo.innerHTML = `
            <span class="discord-summarizer-history-date">${formattedDate}</span>
            <span class="discord-summarizer-history-mode">${summary.mode.replace(
                "_",
                " "
            )}</span>
        `;
        summaryHeader.appendChild(summaryInfo);

        // Add expand/collapse button
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "discord-summarizer-history-toggle";
        toggleBtn.innerHTML = "+";
        toggleBtn.addEventListener("click", () => {
            // Toggle content visibility
            const content = summaryItem.querySelector(
                ".discord-summarizer-history-item-content"
            );
            const isVisible = content.style.display !== "none";
            content.style.display = isVisible ? "none" : "block";
            toggleBtn.innerHTML = isVisible ? "+" : "-";
        });
        summaryHeader.appendChild(toggleBtn);

        summaryItem.appendChild(summaryHeader);

        // Create summary content
        const summaryContent = document.createElement("div");
        summaryContent.className = "discord-summarizer-history-item-content";
        summaryContent.innerHTML = summary.summary;
        summaryContent.style.display = "none"; // Hidden by default
        summaryItem.appendChild(summaryContent);

        content.appendChild(summaryItem);
    });

    historyContainer.appendChild(content);

    // Find the messages container
    const messagesContainer = document.querySelector(
        '[class*="messagesWrapper"]'
    );

    if (messagesContainer) {
        // Insert at the bottom
        messagesContainer.appendChild(historyContainer);

        // Scroll to the history
        historyContainer.scrollIntoView({ behavior: "smooth" });
    }
}

// Handle history button click
async function handleHistoryClick() {
    try {
        console.log("History button clicked");

        // Show loading state
        const historyBtn = document.getElementById(
            "discord-summarizer-history-btn"
        );
        const originalText = historyBtn.innerHTML;
        historyBtn.innerHTML = "<span>Loading...</span>";
        historyBtn.disabled = true;

        // Get user ID
        const userId = getDiscordUserId();
        console.log("User ID for history:", userId);

        if (!userId) {
            showNotification("Unable to identify user. Please try again.");
            historyBtn.innerHTML = originalText;
            historyBtn.disabled = false;
            return;
        }

        try {
            // Get summaries from backend
            const summaries = await getSummaryHistory(userId);
            console.log("Summaries retrieved:", summaries.length);

            if (summaries.length === 0) {
                showNotification("No summary history found");
                historyBtn.innerHTML = originalText;
                historyBtn.disabled = false;
                return;
            }

            // Display the summaries
            displaySummaryHistory(summaries);

            // Reset button
            historyBtn.innerHTML = originalText;
            historyBtn.disabled = false;
        } catch (historyError) {
            console.error("Error getting summary history:", historyError);
            showNotification(
                "Error: " +
                    (historyError.message || "Failed to get summary history")
            );
            historyBtn.innerHTML = originalText;
            historyBtn.disabled = false;
        }
    } catch (error) {
        console.error("Error fetching summary history:", error);
        showNotification("Error fetching summary history");

        // Reset button
        const historyBtn = document.getElementById(
            "discord-summarizer-history-btn"
        );
        historyBtn.innerHTML = "<span>History</span>";
        historyBtn.disabled = false;
    }
}

// Initialize the extension immediately and also when the page is fully loaded
initDiscordSummarizer();

// Also listen for DOMContentLoaded in case the script runs before the page is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initDiscordSummarizer();
    });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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

            // Add message selection dropdown
            const messageSelector = createMessageSelector();
            buttonContainer.appendChild(messageSelector);

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

// Create message selection dropdown
function createMessageSelector() {
    const container = document.createElement("div");
    container.className = "discord-summarizer-message-selector-container";

    const messageSelector = document.createElement("select");
    messageSelector.id = "discord-summarizer-message-selection";
    messageSelector.className = "discord-summarizer-message-selection";

    const options = [
        { value: "unread", label: "Unread Messages" },
        { value: "recent", label: "Recent Messages" },
    ];

    options.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        messageSelector.appendChild(optionElement);
    });

    container.appendChild(messageSelector);

    // Create message count input (initially hidden)
    const countContainer = document.createElement("div");
    countContainer.className = "discord-summarizer-count-container";
    countContainer.style.display = "none";

    const countInput = document.createElement("input");
    countInput.type = "number";
    countInput.id = "discord-summarizer-message-count";
    countInput.className = "discord-summarizer-message-count";
    countInput.min = 5;
    countInput.max = 100;
    countInput.value = 20;

    countContainer.appendChild(countInput);
    container.appendChild(countContainer);

    // Get saved preferences
    chrome.storage.sync.get(["messageSelection", "messageCount"], (result) => {
        if (result.messageSelection) {
            messageSelector.value = result.messageSelection;
            // Show/hide count input based on selection
            countContainer.style.display =
                result.messageSelection === "recent" ? "block" : "none";
        }
        if (result.messageCount) {
            countInput.value = result.messageCount;
        }
    });

    // Save preferences when changed
    messageSelector.addEventListener("change", (e) => {
        const isRecent = e.target.value === "recent";
        countContainer.style.display = isRecent ? "block" : "none";
        chrome.storage.sync.set({ messageSelection: e.target.value });
    });

    countInput.addEventListener("change", () => {
        // Ensure value is within bounds
        let count = parseInt(countInput.value);
        if (isNaN(count) || count < 5) count = 5;
        if (count > 100) count = 100;
        countInput.value = count;
        chrome.storage.sync.set({ messageCount: count });
    });

    return container;
}

// Handle summarize button click
async function handleSummarizeClick() {
    try {
        // Show loading state
        const summarizeBtn = document.getElementById("discord-summarizer-btn");
        const originalText = summarizeBtn.innerHTML;
        summarizeBtn.innerHTML = "<span>Summarizing...</span>";
        summarizeBtn.disabled = true;

        // Get saved preferences for message selection
        chrome.storage.sync.get(
            ["messageSelection", "messageCount"],
            async (result) => {
                try {
                    const messageSelection =
                        result.messageSelection || "unread";
                    const messageCount = result.messageCount || 20;

                    // Get messages based on selection
                    let messages = [];
                    let summaryTitle = "";

                    if (messageSelection === "unread") {
                        messages = getUnreadMessages();
                        summaryTitle = "Unread Messages Summary";

                        if (messages.length === 0) {
                            showNotification("No unread messages found");
                            summarizeBtn.innerHTML = originalText;
                            summarizeBtn.disabled = false;
                            return;
                        }
                    } else {
                        messages = getRecentMessages(messageCount);
                        summaryTitle = `Last ${messageCount} Messages Summary`;

                        if (messages.length === 0) {
                            showNotification(
                                "No messages found in this channel"
                            );
                            summarizeBtn.innerHTML = originalText;
                            summarizeBtn.disabled = false;
                            return;
                        }
                    }

                    // Get summary preferences
                    const preferences = await getSummaryPreferences();

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
            }
        );
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
                        summaryMode: "brief",
                        summaryStyle: "bullets",
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

            // Display the summary
            displaySummary(summary, preferences, {
                title:
                    messageSelection === "unread"
                        ? "Unread Messages Summary"
                        : `Last ${messageCount} Messages Summary`,
            });

            sendResponse({ success: true });
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
