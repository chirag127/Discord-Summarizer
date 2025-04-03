// Popup script for Discord Summarizer extension

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const summaryModeSelect = document.getElementById('summary-mode');
  const summaryStyleSelect = document.getElementById('summary-style');
  const summarizeBtn = document.getElementById('summarize-btn');
  const statusDiv = document.getElementById('status');
  
  // Load saved preferences
  chrome.storage.sync.get(['summaryMode', 'summaryStyle'], (result) => {
    if (result.summaryMode) {
      summaryModeSelect.value = result.summaryMode;
    }
    if (result.summaryStyle) {
      summaryStyleSelect.value = result.summaryStyle;
    }
  });
  
  // Save preferences when changed
  summaryModeSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ summaryMode: summaryModeSelect.value });
  });
  
  summaryStyleSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ summaryStyle: summaryStyleSelect.value });
  });
  
  // Handle summarize button click
  summarizeBtn.addEventListener('click', async () => {
    try {
      // Show loading status
      statusDiv.textContent = 'Checking Discord tab...';
      
      // Find Discord tab
      const tabs = await chrome.tabs.query({ url: '*://*.discord.com/*' });
      
      if (tabs.length === 0) {
        statusDiv.textContent = 'Please open Discord in a tab first';
        return;
      }
      
      // Send message to content script
      statusDiv.textContent = 'Summarizing...';
      chrome.tabs.sendMessage(tabs[0].id, { action: 'summarizeFromPopup' }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }
        
        if (response && response.success) {
          statusDiv.textContent = 'Summary created!';
        } else if (response && response.error) {
          statusDiv.textContent = 'Error: ' + response.error;
        } else {
          statusDiv.textContent = 'Unknown error occurred';
        }
      });
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
    }
  });
});
