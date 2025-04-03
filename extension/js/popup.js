// Popup script for Discord Summarizer extension

// Function to display summary in the popup
function displaySummaryInPopup(summary, title) {
    // Get the summary container and content elements
    const summaryContainer = document.getElementById("popup-summary-container");
    const summaryContent = document.getElementById("popup-summary-content");
    const copyBtn = document.getElementById("popup-copy-btn");

    // Update the section title if needed
    const sectionTitle = summaryContainer.querySelector(".section-title");
    if (sectionTitle) {
        sectionTitle.textContent = title || "Summary";
    }

    // Set the summary content
    summaryContent.innerHTML = summary;

    // Show the summary container
    summaryContainer.style.display = "block";

    // Set up the copy button functionality
    if (copyBtn) {
        copyBtn.onclick = () => {
            // Get the text content
            const textContent =
                summaryContent.innerText || summaryContent.textContent;

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
                    });
            } else {
                // Fallback for older browsers
                // Create a temporary textarea element
                const textarea = document.createElement("textarea");
                textarea.value = textContent;
                textarea.style.position = "fixed"; // Prevent scrolling to bottom
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();

                try {
                    // Execute the copy command
                    const successful = document.execCommand("copy");
                    if (successful) {
                        // Show feedback
                        const originalText = copyBtn.textContent;
                        copyBtn.textContent = "Copied!";
                        setTimeout(() => {
                            copyBtn.textContent = originalText;
                        }, 2000);
                    } else {
                        console.error("Copy command was unsuccessful");
                    }
                } catch (err) {
                    console.error("Could not execute copy command: ", err);
                }

                // Clean up
                document.body.removeChild(textarea);
            }
        };
    }

    // Scroll to the summary container
    summaryContainer.scrollIntoView({ behavior: "smooth" });
}

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
        // Clear any displayed summary when changing mode
        clearSummary();
    });

    summaryStyleSelect.addEventListener("change", () => {
        chrome.storage.sync.set({ summaryStyle: summaryStyleSelect.value });
        // Clear any displayed summary when changing style
        clearSummary();
    });

    // Function to clear any displayed summary
    function clearSummary() {
        const summaryContainer = document.getElementById(
            "popup-summary-container"
        );
        const summaryContent = document.getElementById("popup-summary-content");

        // Hide the container and clear the content
        if (summaryContainer) {
            summaryContainer.style.display = "none";
        }
        if (summaryContent) {
            summaryContent.innerHTML = "";
        }

        // Clear the status message
        statusDiv.textContent = "";
    }

    // Handle message selection change
    messageSelectionSelect.addEventListener("change", () => {
        const isRecent = messageSelectionSelect.value === "recent";
        recentOptionsDiv.style.display = isRecent ? "block" : "none";
        chrome.storage.sync.set({
            messageSelection: messageSelectionSelect.value,
        });

        // Clear any displayed summary when changing selection type
        clearSummary();
    });

    // Save message count when changed
    messageCountInput.addEventListener("change", () => {
        // Ensure value is within bounds
        let count = parseInt(messageCountInput.value);
        if (isNaN(count) || count < 5) count = 5;
        if (count > 100) count = 100;
        messageCountInput.value = count;
        chrome.storage.sync.set({ messageCount: count });

        // Clear any displayed summary when changing message count
        clearSummary();
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
                                    // Check if this is a recent messages summary that should be displayed in the popup
                                    if (
                                        messageSelection === "recent" &&
                                        response.summary
                                    ) {
                                        // Show the summary in the popup
                                        displaySummaryInPopup(
                                            response.summary,
                                            response.title ||
                                                "Recent Messages Summary"
                                        );
                                        statusDiv.textContent =
                                            "Summary created!";
                                    } else {
                                        // For unread messages, the summary is displayed in Discord
                                        statusDiv.textContent =
                                            "Summary created!";
                                    }
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
