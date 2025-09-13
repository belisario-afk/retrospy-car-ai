import { useCallback, useEffect } from "react";
import { generateCodeChallenge, generateCodeVerifier } from "../lib/spotify/pkce";
import { exchangeCodeForToken as spotifyExchangeCodeForToken, storeToken } from "../lib/spotify/api";
import { CLIENT_ID, REDIRECT_URI } from "../config";

const PKCE_VERIFIER_KEY = "pkce:verifier";
const PKCE_STATE_KEY = "pkce:state";

function getBasePathFromPublicUrl(): string {
  const publicUrl = process.env.PUBLIC_URL;
  if (!publicUrl) return "/";
  try {
    const u = new URL(publicUrl, window.location.origin);
    const p = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return p;
  } catch {
    const p = publicUrl.startsWith("/") ? publicUrl : `/${publicUrl}`;
    return p.endsWith("/") ? p : `${p}/`;
  }
}

function getDefaultScopes(): string[] {
  const raw = process.env.REACT_APP_SPOTIFY_SCOPES;
  if (raw && raw.trim().length > 0) {
    return raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
  }
  return [
    "user-read-email",
    "user-read-private",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "playlist-read-private"
  ];
}

export function usePKCE(onAuthenticated?: (accessToken: string) => void) {
  const clientId = CLIENT_ID;
  const redirectUri = REDIRECT_URI;

  const login = useCallback(
    async (scopes: string[]) => {
      if (!clientId) {
        console.error("REACT_APP_SPOTIFY_CLIENT_ID is missing. Set it in .env and rebuild.");
        alert("Spotify Client ID missing. Configure .env and rebuild.");
        return;
      }

      const verifier = generateCodeVerifier(64);
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

      const challenge = await generateCodeChallenge(verifier);
      const state = Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem(PKCE_STATE_KEY, state);

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge,
        state,
        scope: scopes.join(" ")
      });

      window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
    },
    [clientId, redirectUri]
  );

  const startLogin = useCallback(
    async (scopes?: string[]) => {
      const effectiveScopes = scopes && scopes.length ? scopes : getDefaultScopes();
      return login(effectiveScopes);
    },
    [login]
  );

  const isRedirectCallback = useCallback((): boolean => {
    const params = new URLSearchParams(window.location.search);
    return params.has("code") || params.has("error");
  }, []);

  const handleRedirectCallback = useCallback(async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      const clean = getBasePathFromPublicUrl();
      window.history.replaceState({}, document.title, clean);
      return;
    }

    if (!code) return;

    const expectedState = sessionStorage.getItem(PKCE_STATE_KEY);
    if (!state || state !== expectedState) {
      console.error("OAuth state mismatch");
      return;
    }

    const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    if (!verifier) {
      console.error("Missing PKCE code_verifier in sessionStorage");
      return;
    }

    try {
      const token = await spotifyExchangeCodeForToken(code, verifier);
      storeToken(token);

      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      sessionStorage.removeItem(PKCE_STATE_KEY);

      const clean = getBasePathFromPublicUrl();
      window.history.replaceState({}, document.title, clean);

      if (onAuthenticated) onAuthenticated(token.access_token);
    } catch (err) {
      console.error("Token exchange failed", err);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    if (isRedirectCallback()) {
      void handleRedirectCallback();
    }
  }, [handleRedirectCallback, isRedirectCallback]);

  return { login, startLogin, handleRedirectCallback, isRedirectCallback };
}