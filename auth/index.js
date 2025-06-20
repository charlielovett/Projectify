const express = require('express');
const axios = require('axios');
const fs = require('fs');
const open = (...args) => import('open').then(mod => mod.default(...args));
require('dotenv').config();

const app = express();
const port = 8888;

const scopes = 'user-read-currently-playing user-read-playback-state user-top-read';

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
    fs.writeFileSync('tokens/refresh_token.txt', refresh_token, 'utf8');
    console.log('Access Token:', access_token);
    console.log('Refresh Token saved to file.');


    res.send('Authentication successful! You can close this tab.');
  } catch (err) {
    console.error('Error getting tokens:', err.response?.data || err.message);
    res.send('Error retrieving tokens.');
  }
});

const refreshAccessToken = require('./refreshAccessToken');

app.get('/currently-playing', async (req, res) => {
  const fs = require('fs');
  const axios = require('axios');

  let access_token = fs.readFileSync('tokens/access_token.txt', 'utf8');

  async function fetchSpotifyTrack(token) {
    return axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 1000
    });
  }

  try {
    let response = await fetchSpotifyTrack(access_token);

    // Handle no song playing
    if (response.status === 204 || !response.data?.item) {
      return res.status(204).json({ message: 'No track playing' });
    }

    const track = response.data.item;
    res.json({
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumCover: track.album.images[0]?.url,
      isPlaying: response.data.is_playing,
      progressMs: response.data.progress_ms,
      durationMs: track.duration_ms
    });

  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('Token expired, refreshing...');

      const newToken = await refreshAccessToken();
      if (!newToken) return res.status(500).json({ error: 'Could not refresh token' });

      try {
        const response = await fetchSpotifyTrack(newToken);
        if (response.status === 204 || !response.data?.item) {
          return res.status(204).json({ message: 'No track playing' });
        }

        const track = response.data.item;
        return res.json({
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          albumCover: track.album.images[0]?.url,
          isPlaying: response.data.is_playing,
          progressMs: response.data.progress_ms,
          durationMs: track.duration_ms
        });

      } catch (secondErr) {
        console.error('Retry after refresh failed:', secondErr.message);
        return res.status(500).json({ error: 'Failed after token refresh' });
      }

    } else {
      console.error('Error calling Spotify:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Unexpected error' });
    }
  }
});

app.get('/lastfm/top-artists', async (req, res) => {
  const username = req.query.username; // e.g., ?username=charlielovett
  const apiKey = process.env.LASTFM_API_KEY;

  if (!username || !apiKey) {
    return res.status(400).json({ error: 'Missing username or API key' });
  }

  try {
    const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.gettopartists',
        user: username,
        api_key: apiKey,
        format: 'json',
        limit: 20,
        period: '1month' // Can also be 'overall', '7day', '3month', etc.
      }
    });

    const artists = data.topartists.artist.map((artist, index) => ({
      name: artist.name,
      playcount: parseInt(artist.playcount, 10),
      image: artist.image.find(img => img.size === 'large')?.['#text'] || null,
      rank: index + 1,
      url: artist.url
    }));

    res.json(artists);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch data from Last.fm' });
  }
});

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
  open('http://127.0.0.1:8888/login');
});