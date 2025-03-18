document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('save');

  // Load the saved API key
  chrome.storage.local.get('apiKey', function(data) {
      apiKeyInput.value = data.apiKey || '';
  });

  // Save the API key when the button is clicked
  saveButton.addEventListener('click', function() {
      const apiKey = apiKeyInput.value;
      chrome.storage.local.set({ apiKey: apiKey }, function() {
          alert('API Key saved locally.');
      });
  });
});