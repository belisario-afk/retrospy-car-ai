import { useCallback } from "react";
import { generateCodeChallenge, generateCodeVerifier } from "../lib/spotify/pkce";
import { storeToken, exchangeCodeForToken, getStoredToken } from "../lib/spotify/api";
import { CLIENT_ID, REDIRECT_URI } from "../config";

/**
 * React hook that encapsulates the Authorization Code with PKCE flow.
 * - Uses localStorage to persist verifier and tokens.
 * - Never stores a client secret in the client (PKCE is recommended for SPAs).
 */
export const usePKCE = () => {
  const isRedirectCallback = useCallback(() => {
    // Detect ?code= or ?error= on any route (Pages serves index.html for all routes)
    const params = new URLSearchParams(window.location.search);
    return params.has("code") || params.has("error");
  }, []);

  const startLogin = useCallback(async () => {
    const verifier = generateCodeVerifier();
    localStorage.setItem("spotify_pkce_verifier", verifier);

    const challenge = await generateCodeChallenge(verifier);

    const scope = [
      "user-read-private",
      "user-read-email",
      "streaming",
      "user-read-playback-state",
      "user-modify-playback-state",
      "playlist-read-private",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-library-read",
      "user-read-currently-playing",
      "user-read-recently-played"
    ].join(" ");

    // Guardrails: if for some reason values are empty, abort with a clear message
    if (!CLIENT_ID || !REDIRECT_URI) {
      alert("Spotify client configuration is missing. Please set REACT_APP_SPOTIFY_CLIENT_ID and REACT_APP_SPOTIFY_REDIRECT_URI in .env and rebuild.");
      throw new Error("Missing CLIENT_ID or REDIRECT_URI");
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: "S256",
      code_challenge: challenge
    });
    window.location.assign(`https://accounts.spotify.com/authorize?${params.toString()}`);
  }, []);

  const handleRedirectCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const verifier = localStorage.getItem("spotify_pkce_verifier");

    if (error) {
      throw new Error(error);
    }
    if (!code || !verifier) {
      throw new Error("Missing auth code or verifier");
    }
    // Exchange code for token
    const token = await exchangeCodeForToken(code, verifier);
    storeToken(token);
    // Clean URL query params
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("spotify_auth_token");
    localStorage.removeItem("spotify_pkce_verifier");
  }, []);

  return { startLogin, handleRedirectCallback, isRedirectCallback, logout, token: getStoredToken() };
};