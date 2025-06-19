# Projectify

A Node.js-based local app that fetches your currently playing Spotify track — including the song name, artist, and album cover — and will eventually display it in a custom UI for projection.

## 🚀 Features

- OAuth 2.0 authentication with Spotify
- Securely stores refresh token and auto-refreshes access tokens
- Fetches current playback info (track, artist, album art)
- Polls every 5 seconds for live updates
- Clean project structure and environment separation

## 🧪 Usage

### 1. Clone and install

```bash
git clone https://github.com/yourusername/spotify-auth.git
cd spotify-auth
npm install
```

### 2. Set up your .env
Create a .env file with the following:

CLIENT_ID=your_spotify_client_id

CLIENT_SECRET=your_spotify_client_secret

REDIRECT_URI=your_redirect_uri

See https://developer.spotify.com/documentation/web-api to set up your tokens

### 3. Authenticate
Start the Server

```bash
node auth/index.js
```
You’ll see the current track, artist, and album cover logged every 5 seconds. Tokens are refreshed automatically if expired.
