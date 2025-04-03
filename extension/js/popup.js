// Popup script for Discord Summarizer extension

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
    // Get elements
    const summaryModeSelect = document.getElementById("summary-mode");
    const summaryStyleSelect = document.getElementById("summary-style");
    const messageSelectionSelect = document.getElementById("message-selection");
    const recentOptionsDiv = document.getElementById("recent-options");
    const messageCountInput = document.getElementById("message-count");
    const summarizeBtn = document.getElementById("summarize-btn");
    const statusDiv = document.getElementById("status");

    // Load saved preferences
    chrome.storage.sync.get(
        ["summaryMode", "summaryStyle", "messageSelection", "messageCount"],
        (result) => {
            if (result.summaryMode) {
                summaryModeSelect.value = result.summaryMode;
            }
            if (result.summaryStyle) {
                summaryStyleSelect.value = result.summaryStyle;
            }
            if (result.messageSelection) {
                messageSelectionSelect.value = result.messageSelection;
                // Show/hide recent options based on selection
                recentOptionsDiv.style.display =
                    result.messageSelection === "recent" ? "block" : "none";
            }
            if (result.messageCount) {
                messageCountInput.value = result.messageCount;
            }
        }
    );

    // Save preferences when changed
    summaryModeSelect.addEventListener("change", () => {
        chrome.storage.sync.set({ summaryMode: summaryModeSelect.value });
    });

    summaryStyleSelect.addEventListener("change", () => {
        chrome.storage.sync.set({ summaryStyle: summaryStyleSelect.value });
    });

    // Handle message selection change
    messageSelectionSelect.addEventListener("change", () => {
        const isRecent = messageSelectionSelect.value === "recent";
        recentOptionsDiv.style.display = isRecent ? "block" : "none";
        chrome.storage.sync.set({
            messageSelection: messageSelectionSelect.value,
        });
    });

    // Save message count when changed
    messageCountInput.addEventListener("change", () => {
        // Ensure value is within bounds
        let count = parseInt(messageCountInput.value);
        if (isNaN(count) || count < 5) count = 5;
        if (count > 100) count = 100;
        messageCountInput.value = count;
        chrome.storage.sync.set({ messageCount: count });
    });

    // Handle summarize button click
    summarizeBtn.addEventListener("click", async () => {
        try {
            // Show loading status
            statusDiv.textContent = "Checking Discord tab...";

            // Find Discord tab - use a more general approach
            const tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            // Check if we have an active tab
            if (tabs.length === 0) {
                statusDiv.textContent = "No active tab found";
                return;
            }

            // Check if the active tab is Discord
            const activeTab = tabs[0];
            if (!activeTab.url || !activeTab.url.includes("discord.com")) {
                statusDiv.textContent = "Please open Discord in the active tab";
                return;
            }

            // Get current settings
            const messageSelection = messageSelectionSelect.value;
            const messageCount =
                messageSelection === "recent"
                    ? parseInt(messageCountInput.value)
                    : 0;

            // Send message to content script
            statusDiv.textContent = "Summarizing...";

            try {
                // First, check if the content script is ready by sending a ping
                chrome.tabs.sendMessage(
                    activeTab.id,
                    { action: "ping" },
                    (_pingResponse) => {
                        // If we get here without an error, the content script is ready
                        if (chrome.runtime.lastError) {
                            // Content script not ready or not injected
                            statusDiv.textContent =
                                "Error: Content script not ready. Please refresh the Discord tab.";
                            console.error(
                                "Content script error:",
                                chrome.runtime.lastError
                            );
                            return;
                        }

                        // Now send the actual summarize message
                        chrome.tabs.sendMessage(
                            activeTab.id,
                            {
                                action: "summarizeFromPopup",
                                messageSelection,
                                messageCount,
                            },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    statusDiv.textContent =
                                        "Error: " +
                                        chrome.runtime.lastError.message;
                                    console.error(
                                        "Summarize error:",
                                        chrome.runtime.lastError
                                    );
                                    return;
                                }

                                if (response && response.success) {
                                    statusDiv.textContent = "Summary created!";
                                } else if (response && response.error) {
                                    statusDiv.textContent =
                                        "Error: " + response.error;
                                } else {
                                    statusDiv.textContent =
                                        "Unknown error occurred";
                                }
                            }
                        );
                    }
                );
            } catch (sendError) {
                statusDiv.textContent =
                    "Error sending message: " + sendError.message;
                console.error("Send message error:", sendError);
            }
        } catch (error) {
            statusDiv.textContent = "Error: " + error.message;
        }
    });
});
