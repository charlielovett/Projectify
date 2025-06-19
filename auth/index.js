const express = require('express');
const axios = require('axios');
const open = (...args) => import('open').then(mod => mod.default(...args));
require('dotenv').config();

const app = express();
const port = 8888;

const scopes = 'user-read-currently-playing user-read-playback-state';

app.get('/login', (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?` +
    new URLSearchParams({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scopes,
      redirect_uri: process.env.REDIRECT_URI
    });

  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  try {
    const response = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = response.data;

    // Store tokens
    const fs = require('fs');
    fs.writeFileSync('refresh_token.txt', refresh_token, 'utf8');
    console.log('Access Token:', access_token);
    console.log('Refresh Token saved to file.');


    res.send('Authentication successful! You can close this tab.');
  } catch (err) {
    console.error('Error getting tokens:', err.response?.data || err.message);
    res.send('Error retrieving tokens.');
  }
});

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
  open('http://127.0.0.1:8888/login');
});