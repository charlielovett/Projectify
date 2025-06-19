const axios = require('axios');
const fs = require('fs');
const refreshAccessToken = require('../auth/refreshAccessToken');

async function getCurrentlyPlaying() {
  let access_token = fs.readFileSync('tokens/access_token.txt', 'utf8');

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    if (response.status === 204 || !response.data.item) {
      console.log('No track is currently playing.');
      return;
    }

    const item = response.data.item;
    console.log(`Now Playing: ${item.name} by ${item.artists.map(a => a.name).join(', ')}`);
    console.log(`Album Cover: ${item.album.images[0].url}`);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('⚠️ Access token expired. Refreshing...');
      const newToken = await refreshAccessToken();

      if (newToken) {
        getCurrentlyPlaying(); // Try again with refreshed token
      }
    } else {
      console.error('Error fetching track:', err.response?.data || err.message);
    }
  }
}

getCurrentlyPlaying();
setInterval(getCurrentlyPlaying, 1000); // every 5 seconds