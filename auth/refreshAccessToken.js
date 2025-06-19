const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function refreshAccessToken() {
  const refresh_token = fs.readFileSync('tokens/refresh_token.txt', 'utf8');

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const newAccessToken = response.data.access_token;
    console.log('Refreshed Access Token:', newAccessToken);

    // Save it to a file for now
    fs.writeFileSync('tokens/access_token.txt', newAccessToken, 'utf8');

    return newAccessToken;
  } catch (err) {
    console.error('Error refreshing access token:', err.response?.data || err.message);
    return null;
  }
}

module.exports = refreshAccessToken;

