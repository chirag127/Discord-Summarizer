// Background script for Discord Summarizer extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Discord Summarizer extension installed');
  
  // Initialize default settings
  chrome.storage.sync.get(['summaryMode', 'summaryStyle'], (result) => {
    if (!result.summaryMode) {
      chrome.storage.sync.set({ summaryMode: 'brief' });
    }
    if (!result.summaryStyle) {
      chrome.storage.sync.set({ summaryStyle: 'bullets' });
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSummaryPreferences') {
    chrome.storage.sync.get(['summaryMode', 'summaryStyle'], (result) => {
      sendResponse({
        summaryMode: result.summaryMode || 'brief',
        summaryStyle: result.summaryStyle || 'bullets'
      });
    });
    return true; // Required for async sendResponse
  }
});
