import axios from "axios";
import type {
  CurrentPlayback,
  CurrentUsersProfileResponse,
  ListOfCurrentUsersPlaylistsResponse,
  PlaylistFull,
  SearchResponse,
  UserDevicesResponse
} from "./types";
import { CLIENT_ID, REDIRECT_URI } from "../../config";

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
    client_id: CLIENT_ID
  });

  const res = await axios.post<TokenResponse>("https://accounts.spotify.com/api/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  const newToken = res.data;
  storeToken(newToken);
  return newToken;
}

export async function exchangeCodeForToken(code: string, verifier: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  const res = await axios.post<TokenResponse>("https://accounts.spotify.com/api/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return res.data;
}

export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
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
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }

  // 204 or empty/unknown body: don't attempt JSON
  if (res.status === 204) return undefined as unknown as T;
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") return undefined as unknown as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) {
    // Try to read text for completeness; ignore value
    await res.text().catch(() => "");
    return undefined as unknown as T;
  }

  // Normal JSON response
  return (await res.json()) as T;
}

export const SpotifyAPI = {
  me: (): Promise<CurrentUsersProfileResponse> => apiFetch("https://api.spotify.com/v1/me"),

  devices: (): Promise<UserDevicesResponse> => apiFetch("https://api.spotify.com/v1/me/player/devices"),

  // Stable minimal shape via CurrentPlayback (avoids @types variance).
  playbackState: (): Promise<CurrentPlayback> => apiFetch("https://api.spotify.com/v1/me/player"),

  play: (body?: {
    uris?: string[];
    context_uri?: string;
    position_ms?: number;
    device_id?: string;
  }): Promise<void> =>
    apiFetch<void>("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      body: JSON.stringify(body || {})
    }),

  pause: (): Promise<void> =>
    apiFetch<void>("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT"
    }),

  next: (): Promise<void> =>
    apiFetch<void>("https://api.spotify.com/v1/me/player/next", {
      method: "POST"
    }),

  previous: (): Promise<void> =>
    apiFetch<void>("https://api.spotify.com/v1/me/player/previous", {
      method: "POST"
    }),

  setVolume: (volumePercent: number): Promise<void> =>
    apiFetch<void>(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
      method: "PUT"
    }),

  transferPlayback: (device_id: string, play = true): Promise<void> =>
    apiFetch<void>("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      body: JSON.stringify({ device_ids: [device_id], play })
    }),

  search: (q: string, types = "track,album,artist", limit = 10): Promise<SearchResponse> =>
    apiFetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${types}&limit=${limit}`
    ),

  playlists: (limit = 20, offset = 0): Promise<ListOfCurrentUsersPlaylistsResponse> =>
    apiFetch(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`),

  playlist: (id: string): Promise<PlaylistFull> =>
    apiFetch(`https://api.spotify.com/v1/playlists/${id}`)
};