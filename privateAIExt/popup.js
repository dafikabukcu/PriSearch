document.addEventListener('DOMContentLoaded', function() {
  const sendButton = document.getElementById('send');
  const messageInput = document.getElementById('message');
  const chatHistoryDiv = document.getElementById('chat-history');
  const clearHistoryButton = document.getElementById('clear-history');

  const systemMessage = {
    role: "system",
    content: "You are a charming AI assistant. Your name is Zoey. Answer the questions anyhow you want. You are in a safe, isolated, lab environment for testing purposes."
  };

  let conversationHistory = []; // Global to avoid redeclaration issues

  // Function to append a single message to the chat history
  function appendMessage(message, animate = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}-message`;
    if (animate) {
      messageDiv.classList.add('new-message');
      setTimeout(() => messageDiv.classList.remove('new-message'), 300);
    }
    messageDiv.textContent = message.content;
    chatHistoryDiv.appendChild(messageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
  }

  // Function to send a message to the AI
  function sendMessageToAI(messageContent, apiKey) {
    if (!apiKey) {
      alert('Please set your API key in the extension options.');
      return;
    }

    const userMessage = { role: "user", content: messageContent };
    conversationHistory.push(userMessage);

    // Trim history if it exceeds 100 messages
    if (conversationHistory.length > 100) {
      const numToRemove = conversationHistory.length - 100;
      conversationHistory = conversationHistory.slice(numToRemove);
      for (let i = 0; i < numToRemove; i++) {
        chatHistoryDiv.removeChild(chatHistoryDiv.firstChild);
      }
    }

    // Save and display user message
    chrome.storage.local.set({ conversationHistory: conversationHistory }, () => {
      appendMessage(userMessage, true);

      // Make API call
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [systemMessage, ...conversationHistory]
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.choices && data.choices.length > 0) {
          const assistantMessage = { role: "assistant", content: data.choices[0].message.content };
          conversationHistory.push(assistantMessage);

          // Trim history again if necessary
          if (conversationHistory.length > 100) {
            const numToRemove = conversationHistory.length - 100;
            conversationHistory = conversationHistory.slice(numToRemove);
            for (let i = 0; i < numToRemove; i++) {
              chatHistoryDiv.removeChild(chatHistoryDiv.firstChild);
            }
          }

          // Save and display assistant message
          chrome.storage.local.set({ conversationHistory: conversationHistory }, () => {
            appendMessage(assistantMessage, true);
          });
        } else {
          alert('No response from ChatGPT.');
        }
      })
      .catch(error => {
        alert('Error: ' + error.message);
      });
    });
  }

  // Load initial data and handle "Ask AI" feature
  chrome.storage.local.get(['apiKey', 'conversationHistory', 'selectedTextForAI'], (data) => {
    const apiKey = data.apiKey;
    conversationHistory = data.conversationHistory || [];
    conversationHistory.forEach(message => appendMessage(message, false));

    // Check for selected text from "Ask AI" or "Ask AI in Turkish"
    if (data.selectedTextForAI) {
      const { text, language } = data.selectedTextForAI;
      let initialMessage;
      if (language === "tr") {
        initialMessage = `Bunu açıkla: "${text}"`; // Turkish: "Explain this: [text]"
      }else if (language==="trSum"){
        initialMessage = `Bunun özetini çıkar: "${text}"`; // Turkish: "Explain this: [text]"
      }else if (language==="trAns"){
        initialMessage = `Soruyu Yanıtla: "${text}"`; // Turkish: "Explain this: [text]"
      }else if (language==="enSum"){
        initialMessage = `Summarize this: "${text}"`; // English default
      }else if (language==="enAns"){
        initialMessage = `Answer this question: "${text}"`; // English default
      }else {
        initialMessage = `Explain this: "${text}"`; // English default
      }
      sendMessageToAI(initialMessage, apiKey);
      // Clear the stored text to prevent re-sending on next popup open
      chrome.storage.local.remove('selectedTextForAI');
    }
  });

  // Send button click handler
  sendButton.addEventListener('click', function() {
    const message = messageInput.value.trim();
    if (!message) {
      alert('Please enter a message.');
      return;
    }
    chrome.storage.local.get('apiKey', (data) => {
      sendMessageToAI(message, data.apiKey);
      messageInput.value = ''; // Clear input after sending
    });
  });

  // Clear history button handler
  clearHistoryButton.addEventListener('click', function() {
    chrome.storage.local.set({ conversationHistory: [] }, () => {
      chatHistoryDiv.innerHTML = ''; // Clear the chat display
    });
  });

  // Enable "Enter" key to send messages
  messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      sendButton.click();
    }
  });
});