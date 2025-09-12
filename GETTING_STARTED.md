# Getting Started

This guide walks you through creating a Spotify app, configuring redirect URIs, and running RetroSpy locally and on GitHub Pages.

## 1) Create a Spotify App

- Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
- Create an app and copy the Client ID.
- In “Settings”, add your Redirect URI(s). They must match exactly:
  - Local: `http://localhost:3000/callback`
  - GitHub Pages (choose your repo path): `https://<your-user>.github.io/<repo>/callback`

Examples provided:
- `https://belisario-afk.github.io/sfbss/callback`
- `https://belisario-afk.github.io/sfbss/`
- `https://belisario-afk.github.io/sfb/callback`

Pick the one you actually use and ensure it’s added on the dashboard.

## 2) Configure Environment

Copy `.env.example` to `.env` and set:

```
REACT_APP_SPOTIFY_CLIENT_ID=927fda6918514f96903e828fcd6bb576
REACT_APP_SPOTIFY_REDIRECT_URI=https://belisario-afk.github.io/retrospy-car-ai/callback
REACT_APP_APP_NAME=RetroSpy Car AI
```

Optional:
```
REACT_APP_MOCK_MODE=false
```

## 3) Install and Run

```
npm install
npm start
```

This opens http://localhost:3000. Click “Sign in to Spotify” to authenticate.

## 4) Build and Deploy

- Build locally: `npm run build`
- Manual deploy to gh-pages: `npm run deploy`
- Or just push to `main` and let the GitHub Actions workflow publish automatically.

Ensure GitHub Pages is enabled for the repository with the “GitHub Actions” source.

## 5) Playback Modes

- Web Playback SDK (Premium required) — plays audio in browser.
- Fallback remote control — control an external device (phone/desktop). Start playback on the device and use RetroSpy to control it.

## 6) Bluetooth Pairing

Pair your tablet with the car stereo via OS settings and set it as default output. If using the phone with Spotify Connect, route the phone’s audio to the car stereo.

## 7) Troubleshooting

- Redirect mismatch: fix `REACT_APP_SPOTIFY_REDIRECT_URI` and dashboard entries.
- No Premium: use remote control fallback.
- No voices: wait for `speechSynthesis` to populate.
- Clear storage: open Settings → Debug → “Clear local storage”.

Happy driving!