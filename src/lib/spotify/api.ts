import axios from "axios";

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  obtained_at?: number;
};

export function storeToken(token: TokenResponse) {
  const toStore = { ...token, obtained_at: Date.now() };
  localStorage.setItem("spotify_auth_token", JSON.stringify(toStore));
}

export function getStoredToken(): TokenResponse | null {
  const raw = localStorage.getItem("spotify_auth_token");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenResponse;
  } catch {
    return null;
  }
}

export function isTokenExpired(tk: TokenResponse | null): boolean {
  if (!tk) return true;
  const obtainedAt = tk.obtained_at || 0;
  const expiresMs = tk.expires_in * 1000;
  return Date.now() > obtainedAt + expiresMs - 60_000; // refresh 60s early
}

export async function refreshAccessToken(): Promise<TokenResponse | null> {
  const tk = getStoredToken();
  if (!tk?.refresh_token) return null;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tk.refresh_token,
    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID!
  });

  const res = await axios.post<TokenResponse>("https://accounts.spotify.com/api/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const newToken = res.data;
  storeToken(newToken);
  return newToken;
}

export async function exchangeCodeForToken(code: string, verifier: string): Promise<TokenResponse> {
  const redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI!;
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID!,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier
  });

  const res = await axios.post<TokenResponse>("https://accounts.spotify.com/api/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return res.data;
}

export async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  let token = getStoredToken();
  if (isTokenExpired(token)) {
    token = (await refreshAccessToken()) || token;
  }
  if (!token) {
    throw new Error("Not authenticated");
  }
  const res = await fetch(url, {
    ...(init || {}),
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const SpotifyAPI = {
  me: () => apiFetch("https://api.spotify.com/v1/me"),
  devices: () => apiFetch("https://api.spotify.com/v1/me/player/devices"),
  playbackState: () => apiFetch("https://api.spotify.com/v1/me/player"),
  play: (body?: { uris?: string[]; context_uri?: string; position_ms?: number; device_id?: string }) =>
    apiFetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      body: JSON.stringify(body || {})
    }),
  pause: () =>
    apiFetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT"
    }),
  next: () =>
    apiFetch("https://api.spotify.com/v1/me/player/next", {
      method: "POST"
    }),
  previous: () =>
    apiFetch("https://api.spotify.com/v1/me/player/previous", {
      method: "POST"
    }),
  setVolume: (volumePercent: number) =>
    apiFetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
      method: "PUT"
    }),
  transferPlayback: (deviceId: string, play = true) =>
    apiFetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [deviceId], play })
    }),
  search: (q: string, types = ["track", "album", "artist"], limit = 10) =>
    apiFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${types.join(
        ","
      )}&limit=${limit}`
    ),
  myPlaylists: (limit = 20) =>
    apiFetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}`),
  createPlaylist: (userId: string, name: string, description = "", isPublic = false) =>
    apiFetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      body: JSON.stringify({ name, description, public: isPublic })
    }),
  addTracksToPlaylist: (playlistId: string, uris: string[]) =>
    apiFetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ uris })
    }),
  getCurrentlyPlaying: () =>
    apiFetch("https://api.spotify.com/v1/me/player/currently-playing")
};