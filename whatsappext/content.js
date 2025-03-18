// content.js
function checkForNewMessages() {
    const messages = document.querySelectorAll('.message-in:not(.seen)');
    messages.forEach(message => {
      const sender = message.querySelector('.message-author')?.textContent || 'Unknown';
      const text = message.querySelector('.message-text')?.textContent || '[No text]';
      chrome.runtime.sendMessage({
        type: 'newMessage',
        sender: sender,
        text: text
      });
      message.classList.add('seen'); // Mark as seen to avoid duplicate notifications
    });
  }
  
  // Observe changes in the chat area
  const observer = new MutationObserver(checkForNewMessages);
  observer.observe(document.body, { childList: true, subtree: true });