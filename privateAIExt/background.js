// Create the context menu item for "Ask AI"
chrome.contextMenus.create({
    id: "askAI",
    title: "Ask AI",
    contexts: ["selection"] // Only show when text is selected
  });
  chrome.contextMenus.create({
    id: "askAIToSum",
    title: "Ask AI to Summarize",
    contexts: ["selection"] // Only show when text is selected
  });
  chrome.contextMenus.create({
    id: "askAIToAns",
    title: "Ask AI to Answer",
    contexts: ["selection"] // Only show when text is selected
  });
  
  // Create the new context menu item for "Ask AI in Turkish"
  chrome.contextMenus.create({
    id: "askAI_Turkish",
    title: "AI'a Sor",
    contexts: ["selection"] // Only show when text is selected
  });
  chrome.contextMenus.create({
    id: "askAI_TurkishToSum",
    title: "AI ile Özetle",
    contexts: ["selection"] // Only show when text is selected
  });
  chrome.contextMenus.create({
    id: "askAI_TurkishToAns",
    title: "AI ile Cevapla",
    contexts: ["selection"] // Only show when text is selected
  });
  
  // Handle clicks on the context menu items
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "askAI") {
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with English as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "en" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
        // Note: If chrome.action.openPopup() is unsupported (pre-Chrome 88 or restricted),
        // the user must manually click the extension icon after selecting "Ask AI".
      });
    } else if (info.menuItemId === "askAI_Turkish") {
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with Turkish as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "tr" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
      });
    } else if (info.menuItemId === "askAIToSum"){
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with Turkish as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "enSum" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
      });
    } else if (info.menuItemId === "askAI_TurkishToSum"){
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with Turkish as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "trSum" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
      });
    } else if (info.menuItemId === "askAIToAns"){
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with Turkish as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "enAns" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
      });
    } else if (info.menuItemId === "askAI_TurkishToAns"){
      const selectedText = info.selectionText; // Get the selected text
      // Store the selected text with Turkish as the language
      chrome.storage.local.set({ selectedTextForAI: { text: selectedText, language: "trAns" } }, () => {
        // Attempt to open the popup programmatically
        chrome.action.openPopup();
      });
    }
  });