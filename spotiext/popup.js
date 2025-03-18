const CLIENT_ID = '63e67889cb4642eb80812b8dfc3f5527'; // Your Spotify Client ID
const REDIRECT_URI = 'chrome-extension://bneddjkeehagaegbndmejojlkjafgdgg/callback.html'; // Your extension ID
const SCOPES = 'user-read-playback-state user-modify-playback-state';
let accessToken;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['accessToken', 'expirationTime'], (data) => {
    const now = Date.now();
    if (data.accessToken && data.expirationTime && now < data.expirationTime) {
      accessToken = data.accessToken;
      console.log('Retrieved valid token:', accessToken);
      fetchCurrentState();
      setInterval(fetchCurrentState, 5000); // Update every 5 seconds
      setupEventListeners();
    } else {
      if (data.accessToken) {
        console.log('Token expired');
        chrome.storage.local.remove(['accessToken', 'expirationTime']);
      }
      showLogin();
    }
  });
});

function showLogin() {
  document.getElementById('container').innerHTML = `
    <p>For security, Spotify requires re-authentication every hour. Please log in again.</p>
    <button id="login-btn">Log in to Spotify</button>
  `;
  document.getElementById('login-btn').addEventListener('click', login);
}

function login() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  chrome.tabs.create({ url: authUrl });
}

async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 401) {
        chrome.storage.local.remove(['accessToken', 'expirationTime']);
        showLogin();
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const searchResultsDiv = document.getElementById('search-results');
  let debounceTimer;

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = searchInput.value.trim();
      if (query && accessToken) {
        searchSongs(query);
      } else {
        searchResultsDiv.style.display = 'none';
      }
    }, 300);
  });

  document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
  document.getElementById('prev-btn').addEventListener('click', previousTrack);
  document.getElementById('next-btn').addEventListener('click', nextTrack);

  let volumeDebounceTimer;
  document.getElementById('volume-slider').addEventListener('input', () => {
    clearTimeout(volumeDebounceTimer);
    volumeDebounceTimer = setTimeout(setVolume, 300); // 300ms delay
  });
}

async function searchSongs(query) {
  try {
    const response = await apiCall(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    displaySearchResults(data.tracks.items);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

function displaySearchResults(tracks) {
    const searchResultsDiv = document.getElementById('search-results');
    searchResultsDiv.innerHTML = '';
    tracks.forEach(track => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'search-result';
        resultDiv.innerHTML = `
            <img src="${track.album.images[2].url}" alt="${track.name}">
            <div>${track.name} - ${track.artists[0].name}</div>
        `;
        resultDiv.addEventListener('click', () => {
            searchResultsDiv.style.display = 'none'; // Hide search results immediately
            playSong(track.uri);
        });
        searchResultsDiv.appendChild(resultDiv);
    });
    searchResultsDiv.style.display = 'block';
}

async function playSong(uri) {
    try {
        // Get available devices
        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await response.json();
        if (!data.devices || data.devices.length === 0) {
            showFeedback('No active device found. Open Spotify on a device and try again.');
            return;
        }
        const deviceId = data.devices[0].id; // Use the first available device

        // Start playback
        await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: [uri],
                device_id: deviceId
            })
        });
        console.log('Playback started');
        fetchCurrentState(); // Refresh the interface to show the playing song
    } catch (error) {
        console.error('Playback error:', error);
        showFeedback('Couldn’t play the song. Please try again.');
    }
}

  function showFeedback(message) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;
    setTimeout(() => {
      notificationDiv.textContent = ''; // Clear after 5 seconds
    }, 5000);
  }

async function fetchCurrentState() {
    try {
      const response = await apiCall('https://api.spotify.com/v1/me/player', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
  
      // Check if the response has content (status 204 means no content)
      if (response.status === 204 || !response.ok) {
        document.getElementById('song-photo').src = 'default-image.jpg';
        document.getElementById('song-name').textContent = 'No song playing';
        document.getElementById('artist-name').textContent = '';
        document.getElementById('play-pause-btn').textContent = '▶️';
        return; // Exit early since there’s no data to parse
      }
  
      // Get the response as text first to avoid JSON parsing errors
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text); // Parse only if there’s content
        if (data && data.item) {
          document.getElementById('song-photo').src = data.item.album.images[0].url;
          document.getElementById('song-name').textContent = data.item.name;
          document.getElementById('artist-name').textContent = data.item.artists[0].name;
          document.getElementById('play-pause-btn').textContent = data.is_playing ? '⏸' : '▶️';
        } else {
          // Valid JSON but no playback data
          document.getElementById('song-photo').src = 'default-image.jpg';
          document.getElementById('song-name').textContent = 'No song playing';
          document.getElementById('artist-name').textContent = '';
          document.getElementById('play-pause-btn').textContent = '▶️';
        }
      } else {
        // Empty response body
        document.getElementById('song-photo').src = 'default-image.jpg';
        document.getElementById('song-name').textContent = 'No song playing';
        document.getElementById('artist-name').textContent = '';
        document.getElementById('play-pause-btn').textContent = '▶️';
      }
    } catch (error) {
      console.error('Error fetching current state:', error);
      // Fallback UI update in case of unexpected errors
      document.getElementById('song-photo').src = 'default-image.jpg';
      document.getElementById('song-name').textContent = 'No song playing';
      document.getElementById('artist-name').textContent = '';
      document.getElementById('play-pause-btn').textContent = '▶️';
    }
  }

async function togglePlayPause() {
  const isPlaying = document.getElementById('play-pause-btn').textContent === '⏸';
  const endpoint = isPlaying ? 'pause' : 'play';
  try {
    await apiCall(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    fetchCurrentState();
  } catch (error) {
    console.error('Error toggling play/pause:', error);
  }
}

async function previousTrack() {
  try {
    await apiCall('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    fetchCurrentState();
  } catch (error) {
    console.error('Error skipping to previous track:', error);
  }
}

async function nextTrack() {
  try {
    await apiCall('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    fetchCurrentState();
  } catch (error) {
    console.error('Error skipping to next track:', error);
  }
}

async function setVolume() {
  if (!accessToken) {
    console.log('No access token available');
    return;
  }
  const volume = document.getElementById('volume-slider').value;
  try {
    await apiCall(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error('Error in setVolume:', error);
  }
}