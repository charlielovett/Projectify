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
    console.log('Refresh Token saved to file.');


    res.send('Authentication successful! You can close this tab.');
  } catch (err) {
    console.error('Error getting tokens:', err.response?.data || err.message);
    res.send('Error retrieving tokens.');
  }
});

const refreshAccessToken = require('./refreshAccessToken');

async function getSpotifyArtistByName(name, accessToken) {
  try {
    const query = encodeURIComponent(name);
    const res = await axios.get(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=5`, {
      headers: {
        Authorization: `Bearer ${accessToken()}`
      }
    });

    const artist = res.data.artists.items[0];

    return (artist)
      ? {
        name,
        image: artist.images?.[0]?.url || null,
        url: artist.external_urls.spotify,
        spotifyId: artist.id
      } : { name, image: null, url: null, spotifyId: null };
  } catch (err) {
    if (err.response?.status === 401) {
      console.log(`Token expired while fetching ${name}, refreshing...`);
      token = await refreshAccessToken();
      if (!token) throw new Error('Failed to refresh token');
      return getSpotifyArtistByName(name, () => token);
    } else {
      console.error(`Error fetching ${name}:`, err.message);
      return { name, image: null, url: null, spotifyId: null };
    }
  }
}

app.get('/currently-playing', async (req, res) => {
  const readToken = () => fs.readFileSync('tokens/access_token.txt', 'utf8');

  const fetchSpotifyTrack = async (token) => {
    return axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 1000
    });
  };

  const formatTrackData = (data) => {
    const track = data.item;
    return {
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumCover: track.album.images[0]?.url,
      isPlaying: data.is_playing,
      progressMs: data.progress_ms,
      durationMs: track.duration_ms
    };
  };

  try {
    let accessToken = readToken();
    let response = await fetchSpotifyTrack(accessToken);

    if (response.status === 204 || !response.data?.item) {
      return res.status(204).json({ message: 'No track playing' });
    }

    return res.json(formatTrackData(response.data));

  } catch (err) {
    if (err.response?.status === 401) {
      console.log('Token expired, refreshing...');

      const newToken = await refreshAccessToken();
      if (!newToken) return res.status(500).json({ error: 'Could not refresh token' });

      try {
        const response = await fetchSpotifyTrack(newToken);
        if (response.status === 204 || !response.data?.item) {
          return res.status(204).json({ message: 'No track playing' });
        }

        return res.json(formatTrackData(response.data));
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
  const username = req.query.username;
  const apiKey = process.env.LASTFM_API_KEY;

  if (!username || !apiKey) {
    return res.status(400).json({ error: 'Missing username or API key' });
  }

  try {
    // Fetch top artists from Last.fm
    const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'user.gettopartists',
        user: username,
        api_key: apiKey,
        format: 'json',
        limit: 20,
        period: '1month'
      }
    });

    const lastfmArtists = data.topartists.artist.map((artist, index) => ({
      name: artist.name,
      playcount: parseInt(artist.playcount, 10),
      rank: index + 1,
      lastfmUrl: artist.url
    }));

    // Fetch Spotify access token from file
    const getAccessToken = () => fs.readFileSync('tokens/access_token.txt', 'utf8');

    // Match Last.fm artists using normalized names
    const enriched = [];
    for (const artist of lastfmArtists) {
      const spotifyArtistData = await getSpotifyArtistByName(artist.name, getAccessToken);
      enriched.push({
        ...artist,
        spotifyImage: spotifyArtistData.image,
        spotifyUrl: spotifyArtistData.url,
        spotifyId: spotifyArtistData.spotifyId,
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error('Error in /lastfm/top-artists:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch artist data' });
  }
});

app.listen(port, () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
  open('http://127.0.0.1:8888/login');
});