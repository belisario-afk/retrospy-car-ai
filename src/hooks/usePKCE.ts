import { useCallback, useEffect } from "react";
import { exchangeCodeForToken } from "../lib/api";
import { generateCodeChallenge, generateCodeVerifier } from "../lib/spotify/pkce";

const PKCE_VERIFIER_KEY = "pkce:verifier";
const PKCE_STATE_KEY = "pkce:state";

const TOKEN_KEY = "spotify:access_token";
const REFRESH_TOKEN_KEY = "spotify:refresh_token";
const EXPIRES_AT_KEY = "spotify:token_expires_at";

function getRedirectUri(): string {
  const fromEnv = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) {
    try {
      const url = new URL(publicUrl);
      return `${url.origin}${url.pathname.replace(/\/?$/, "")}/callback`;
    } catch {
      const basePath = publicUrl.replace(/\/?$/, "");
      return `${window.location.origin}${basePath}/callback`;
    }
  }
  return `${window.location.origin}/callback`;
}

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
    return raw.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
  }
  // Reasonable defaults for playback + profile
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
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? "";
  const redirectUri = getRedirectUri();

  const login = useCallback(
    async (scopes: string[]) => {
      if (!clientId) {
        console.error(
          "REACT_APP_SPOTIFY_CLIENT_ID is missing. Set it in .env and rebuild. Aborting login."
        );
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

  // Backwards-compatible alias that allows optional scopes
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
      const token = await exchangeCodeForToken({
        code,
        codeVerifier: verifier,
        clientId,
        redirectUri
      });

      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      sessionStorage.removeItem(PKCE_STATE_KEY);

      if (onAuthenticated) {
        onAuthenticated(token.access_token);
      } else {
        try {
          const expiresAt = Date.now() + token.expires_in * 1000;
          localStorage.setItem(TOKEN_KEY, token.access_token);
          if (token.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, token.refresh_token);
          localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
        } catch {
          // ignore storage failures
        }
      }

      const clean = getBasePathFromPublicUrl();
      window.history.replaceState({}, document.title, clean);
    } catch (err) {
      console.error("Token exchange failed", err);
    }
  }, [clientId, onAuthenticated, redirectUri]);

  useEffect(() => {
    if (isRedirectCallback()) {
      void handleRedirectCallback();
    }
  }, [handleRedirectCallback, isRedirectCallback]);

  return { login, startLogin, handleRedirectCallback, isRedirectCallback };
}