// Popup script for Discord Summarizer extension

// TTS settings object
let ttsSettings = {
    rate: 1.0,
    pitch: 1.0,
    voiceName: null,
};

// Function to display summary in the popup
function displaySummaryInPopup(summary, title) {
    // Get the summary container and content elements
    const summaryContainer = document.getElementById("popup-summary-container");
    const summaryContent = document.getElementById("popup-summary-content");
    const copyBtn = document.getElementById("popup-copy-btn");
    const ttsBtn = document.getElementById("popup-tts-btn");

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

    // Set up the TTS button functionality
    if (ttsBtn) {
        ttsBtn.onclick = async () => {
            // Check if Web Speech API is supported
            if (!window.speechSynthesis) {
                alert("Text-to-speech is not supported in your browser.");
                return;
            }

            // Initialize TTS controller with current settings
            await ttsController.init(ttsSettings);

            // If already playing, stop it
            if (ttsController.isPlaying) {
                ttsController.cancel();
                ttsBtn.textContent = "🔊";
                ttsBtn.classList.remove("playing");
                return;
            }

            // Get the text content
            const textContent =
                summaryContent.innerText || summaryContent.textContent;

            // Prepare and play the speech
            ttsController
                .prepare(textContent, summaryContent, () => {
                    // Reset button when speech ends
                    ttsBtn.textContent = "🔊";
                    ttsBtn.classList.remove("playing");
                })
                .play();

            // Update button state
            ttsBtn.textContent = "⏹️";
            ttsBtn.classList.add("playing");
        };
    }
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

    // TTS elements
    const ttsVoiceSelect = document.getElementById("tts-voice");
    const ttsRateInput = document.getElementById("tts-rate");
    const ttsPitchInput = document.getElementById("tts-pitch");
    const ttsRateValue = document.getElementById("tts-rate-value");
    const ttsPitchValue = document.getElementById("tts-pitch-value");

    // Load saved preferences
    chrome.storage.sync.get(
        [
            "summaryMode",
            "summaryStyle",
            "messageSelection",
            "messageCount",
            "ttsRate",
            "ttsPitch",
            "ttsVoice",
        ],
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

            // Load TTS settings
            if (result.ttsRate) {
                ttsRateInput.value = result.ttsRate;
                ttsRateValue.textContent = result.ttsRate;
                ttsSettings.rate = parseFloat(result.ttsRate);
            }
            if (result.ttsPitch) {
                ttsPitchInput.value = result.ttsPitch;
                ttsPitchValue.textContent = result.ttsPitch;
                ttsSettings.pitch = parseFloat(result.ttsPitch);
            }
            if (result.ttsVoice) {
                ttsSettings.voiceName = result.ttsVoice;
            }

            // Initialize TTS and populate voice dropdown
            initTTS();
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

    // Initialize TTS and populate voice dropdown
    async function initTTS() {
        // Check if Web Speech API is supported
        if (!window.speechSynthesis) {
            console.error("Text-to-speech is not supported in this browser");
            return;
        }

        // Initialize TTS controller
        await ttsController.init(ttsSettings);

        // Get available voices
        const voices = ttsController.getVoices();

        // Clear existing options
        ttsVoiceSelect.innerHTML = "";

        // Add default option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Default Voice";
        ttsVoiceSelect.appendChild(defaultOption);

        // Add available voices
        voices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;

            // Select saved voice if available
            if (ttsSettings.voiceName === voice.name) {
                option.selected = true;
            }

            ttsVoiceSelect.appendChild(option);
        });
    }

    // Handle TTS settings changes
    ttsRateInput.addEventListener("input", () => {
        const rate = parseFloat(ttsRateInput.value);
        ttsRateValue.textContent = rate.toFixed(1);
        ttsSettings.rate = rate;
        chrome.storage.sync.set({ ttsRate: rate.toString() });

        // Update active TTS if playing
        if (ttsController.isPlaying) {
            ttsController.updateSettings({ rate });
        }
    });

    ttsPitchInput.addEventListener("input", () => {
        const pitch = parseFloat(ttsPitchInput.value);
        ttsPitchValue.textContent = pitch.toFixed(1);
        ttsSettings.pitch = pitch;
        chrome.storage.sync.set({ ttsPitch: pitch.toString() });

        // Update active TTS if playing
        if (ttsController.isPlaying) {
            ttsController.updateSettings({ pitch });
        }
    });

    ttsVoiceSelect.addEventListener("change", () => {
        const voiceName = ttsVoiceSelect.value;
        ttsSettings.voiceName = voiceName || null;
        chrome.storage.sync.set({ ttsVoice: voiceName });

        // Update active TTS if playing
        if (ttsController.isPlaying) {
            // Get the selected voice object
            const voices = ttsController.getVoices();
            const voice = voices.find((v) => v.name === voiceName);

            if (voice) {
                ttsController.updateSettings({ voice });
            }
        }
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
