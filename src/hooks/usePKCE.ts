import { useCallback } from "react";
import { generateCodeChallenge, generateCodeVerifier, parseHashParams } from "../lib/spotify/pkce";
import { storeToken, exchangeCodeForToken, getStoredToken } from "../lib/spotify/api";

/**
 * React hook that encapsulates the Authorization Code with PKCE flow.
 * - Uses localStorage to persist verifier and tokens.
 * - Never stores a client secret in the client (PKCE is recommended for SPAs).
 */
export const usePKCE = () => {
  const isRedirectCallback = useCallback(() => {
    // CRA serves SPA; redirect to /callback is just a client route. We detect ?code= or error in query string.
    const params = new URLSearchParams(window.location.search);
    return params.has("code") || params.has("error");
  }, []);

  const startLogin = useCallback(async () => {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID!;
    const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI!;
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

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
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