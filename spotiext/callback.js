// callback.js
const hash = window.location.hash.substring(1); // Remove the '#'
const params = new URLSearchParams(hash);
const token = params.get('access_token');
const expiresIn = params.get('expires_in');

if (token && expiresIn) {
  const expirationTime = Date.now() + parseInt(expiresIn, 10) * 1000; // Convert expires_in to milliseconds and add to current time
  chrome.storage.local.set({ accessToken: token, expirationTime: expirationTime }, () => {
    console.log('Token stored with expiration:', expirationTime);
    window.close(); // Close the callback tab
  });
} else {
  console.error('Failed to retrieve access token or expires_in');
}