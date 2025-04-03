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

            // Find Discord tab
            const tabs = await chrome.tabs.query({
                url: "*://*.discord.com/*",
            });

            if (tabs.length === 0) {
                statusDiv.textContent = "Please open Discord in a tab first";
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
            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    action: "summarizeFromPopup",
                    messageSelection,
                    messageCount,
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        statusDiv.textContent =
                            "Error: " + chrome.runtime.lastError.message;
                        return;
                    }

                    if (response && response.success) {
                        statusDiv.textContent = "Summary created!";
                    } else if (response && response.error) {
                        statusDiv.textContent = "Error: " + response.error;
                    } else {
                        statusDiv.textContent = "Unknown error occurred";
                    }
                }
            );
        } catch (error) {
            statusDiv.textContent = "Error: " + error.message;
        }
    });
});
