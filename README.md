# RetroSpy Car AI — “CarAI Dash”

A retro-future, green-on-black “spy car” dashboard optimized for an in-dash tablet. Features Spotify login with Authorization Code + PKCE, Web Playback SDK integration (Premium users), remote device control fallback, speech greeting, audio visualizer mouth line, Tailwind styling, CI/CD to GitHub Pages, and an optional dev PKCE helper server.

Highlights:
- Modern SPA: React + TypeScript + Tailwind (CRA)
- Deploys automatically to GitHub Pages on push to main
- Spotify auth via Authorization Code with PKCE (no client secret in browser)
- Web Playback SDK (Premium required) with remote-control fallback
- Mobile/tablet-first, double-DIN friendly layout
- TTS greeting: “Welcome back Mister Belisario” with voice/Rate/Pitch settings
- Printable bezel template (PNG/PDF) at Settings → Bezel
- Mock mode available for offline development

Quick start:
1. Copy `.env.example` to `.env` and set `REACT_APP_SPOTIFY_CLIENT_ID` and `REACT_APP_SPOTIFY_REDIRECT_URI`.
2. In Spotify Developer Dashboard, add the same redirect URI (exact match).
3. Install: `npm install`
4. Dev: `npm start`
5. Build: `npm run build`
6. Deploy (manual): `npm run deploy` or rely on CI `gh-pages-deploy.yml`.

Note on GitHub Pages path:
- This project sets `homepage: "."` to generate relative asset URLs, so it works under `https://<user>.github.io/<repo>/`.
- Ensure your `REACT_APP_SPOTIFY_REDIRECT_URI` matches the final Pages URL with `/callback` at the end (e.g., `https://belisario-afk.github.io/retrospy-car-ai/callback`).

## Spotify Configuration

Scopes requested:
- `streaming` — Required for Web Playback SDK (Premium).
- `user-read-playback-state`, `user-read-currently-playing`, `user-read-recently-played` — Read playback info.
- `user-modify-playback-state` — Control playback/volume/transfer.
- `user-read-private`, `user-read-email` — Basic profile.
- `playlist-read-private` — Browse private playlists.
- `playlist-modify-public`, `playlist-modify-private` — Create/save playlists.
- `user-library-read` — Search and add from library.

Why PKCE?
- Authorization Code with PKCE is recommended for SPAs because a client secret cannot be safely stored client-side.

Premium requirement:
- Spotify Web Playback SDK requires a Spotify Premium account to stream in-browser. Non-Premium users can control an existing device (Spotify Connect) from the app.

## Features

- AppShell: header, neon logo (“RetroSpy Car AI”), CRT styling
- DashScreen: greeting, scanline background, animated mouth line
- MouthVisualizer: mouth line animated by TTS envelope or playback proxy
- TTSController: voice selection, rate/pitch, test/greeting buttons
- SpotifyAuth: PKCE login, token storage and refresh
- SpotifyPlayer: Web Playback SDK (if available), remote control fallback, volume, controls
- SearchBar: search tracks, albums, artists with play/queue
- PlaylistManager: browse, create playlist, basic actions
- NowPlaying: artwork, progress, play/pause/skip
- Settings: appearance, voice, debug, Bluetooth pairing guide
- PrintableBezel: generate PNG and print a double-DIN bezel template (180 x 100 mm)

## Bluetooth Pairing

- Pair tablet with car stereo in OS settings and set stereo as default audio output.
- If using Spotify Connect on phone, route phone audio to the car stereo; this app can control that playback.

## Mock Mode

Set `REACT_APP_MOCK_MODE=true` in `.env` to enable local demo sounds and bypass Spotify for UI testing (limited).

## Accessibility

- ARIA labels on controls and visualizer
- Keyboard navigable buttons
- High-contrast green-on-black theme, large targets for touch

## Development

- Lint: `npm run lint`
- Test: `npm test` (Jest + RTL)
- Build: `npm run build`
- Deploy to gh-pages branch: `npm run deploy`
- CI: see `.github/workflows/ci.yml` and `gh-pages-deploy.yml`

## Optional Dev Helper: PKCE server

A minimal Express helper to exchange codes exists at `tools/dev-pkce-server/`. This is optional; the client performs token exchange directly with Spotify. Some corporate networks may require a proxy.

## Troubleshooting

- Login redirects but no playback:
  - Ensure `REACT_APP_SPOTIFY_REDIRECT_URI` exactly matches the URI set in Spotify dashboard.
  - For in-browser playback, ensure the account is Premium.
- “No active device”:
  - Click Play in the app, or start playback on your phone, then return to transfer.
- Token expired:
  - The app refreshes tokens automatically via `refresh_token`. If stuck, clear storage in Settings (Debug).
- No voices listed:
  - Wait for `speechSynthesis` to populate voices; some browsers load asynchronously.

## License

MIT — see [LICENSE](./LICENSE).

## Acknowledgements

- Spotify for Developers APIs and Web Playback SDK
- Web Audio API, Speech Synthesis API