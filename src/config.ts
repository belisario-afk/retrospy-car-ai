// Central config with safe runtime fallbacks for env values.
// CRA replaces process.env.REACT_APP_* at build time. If not set, we derive sensible defaults.

function defaultRedirectUri(): string {
  // e.g., https://belisario-afk.github.io/retrospy-car-ai/callback
  const loc = window.location;
  // Ensure trailing slash before appending /callback
  let base = loc.origin + loc.pathname;
  if (!base.endsWith("/")) base += "/";
  return base + "callback";
}

// Provided by the user; safe to include as default since it's a public client id.
export const CLIENT_ID: string =
  process.env.REACT_APP_SPOTIFY_CLIENT_ID || "927fda6918514f96903e828fcd6bb576";

// If not supplied at build, compute it from current location (works for localhost and GitHub Pages)
export const REDIRECT_URI: string =
  (process.env.REACT_APP_SPOTIFY_REDIRECT_URI as string) || defaultRedirectUri();

// Optional: app name
export const APP_NAME: string = process.env.REACT_APP_APP_NAME || "RetroSpy Car AI";