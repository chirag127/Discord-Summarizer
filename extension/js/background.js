// Background script for Discord Summarizer extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Discord Summarizer extension installed");
    // No preferences to initialize - using fixed defaults
});

// Listen for extension icon click (browser action)
chrome.action.onClicked.addListener((tab) => {
    // Only respond if we're on a Discord tab
    if (tab.url && tab.url.includes("discord.com")) {
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: "summarizeFromPopup" });
    }
});

// No message listeners needed - using fixed defaults
