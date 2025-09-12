import { useCallback, useEffect } from "react";
import { exchangeCodeForToken } from "../lib/api";
import { generateCodeChallenge, generateCodeVerifier } from "../lib/spotify/pkce";

const PKCE_VERIFIER_KEY = "pkce:verifier";
const PKCE_STATE_KEY = "pkce:state";

// Token storage keys (used if no onAuthenticated handler is provided)
const TOKEN_KEY = "spotify:access_token";
const REFRESH_TOKEN_KEY = "spotify:refresh_token";
const EXPIRES_AT_KEY = "spotify:token_expires_at";

function getRedirectUri(): string {
  // Prefer explicit env. Must match the Spotify Dashboard value exactly.
  const fromEnv = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  // Fallback: derive from PUBLIC_URL (CRA injects this at build)
  const publicUrl = process.env.PUBLIC_URL;
  if (publicUrl) {
    try {
      const url = new URL(publicUrl);
      return `${url.origin}${url.pathname.replace(/\/?$/, "")}/callback`;
    } catch {
      // PUBLIC_URL could be relative; use current origin + path
      const basePath = publicUrl.replace(/\/?$/, "");
      return `${window.location.origin}${basePath}/callback`;
    }
  }
  // Last resort: origin + /callback
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

export function usePKCE(onAuthenticated?: (accessToken: string) => void) {
  const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? "";
  const redirectUri = getRedirectUri();

  const login = useCallback(async (scopes: string[]) => {
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
  }, [clientId, redirectUri]);

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
      // Clean URL and bail
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

      // Clear transient storage and query
      sessionStorage.removeItem(PKCE_VERIFIER_KEY);
      sessionStorage.removeItem(PKCE_STATE_KEY);

      // Store tokens if no external handler is provided
      if (onAuthenticated) {
        onAuthenticated(token.access_token);
      } else {
        try {
          const expiresAt = Date.now() + token.expires_in * 1000;
          localStorage.setItem(TOKEN_KEY, token.access_token);
          if (token.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, token.refresh_token);
          localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
        } catch {
          // Storage may be unavailable in private mode; ignore
        }
      }

      // Clean the URL back to the app base path
      const clean = getBasePathFromPublicUrl();
      window.history.replaceState({}, document.title, clean);
    } catch (err) {
      console.error("Token exchange failed", err);
    }
  }, [clientId, onAuthenticated, redirectUri]);

  // Auto-handle callback on mount if present (keeps compatibility with old usage)
  useEffect(() => {
    if (isRedirectCallback()) {
      void handleRedirectCallback();
    }
  }, [handleRedirectCallback, isRedirectCallback]);

  return { login, handleRedirectCallback, isRedirectCallback };
}