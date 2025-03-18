let whatsappWindowId = null;

chrome.action.onClicked.addListener(function() {
  if (whatsappWindowId) {
    chrome.windows.get(whatsappWindowId, function(win) {
      if (win) {
        // If the window exists, focus it
        chrome.windows.update(whatsappWindowId, { focused: true });
      } else {
        // If it doesn’t exist, create a new one
        createWhatsappWindow();
      }
    });
  } else {
    // No window ID yet, create a new one
    createWhatsappWindow();
  }
});

function createWhatsappWindow() {
  chrome.windows.create({
    url: "https://web.whatsapp.com",
    type: "popup",
    width: 800,
    height: 700,
    focused: true
  }, function(win) {
    whatsappWindowId = win.id;
  });
}

// Clear the window ID when the popup is closed
chrome.windows.onRemoved.addListener(function(windowId) {
  if (windowId === whatsappWindowId) {
    whatsappWindowId = null;
  }
});