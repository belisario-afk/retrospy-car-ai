/* eslint-disable @typescript-eslint/no-explicit-any */
import { getStoredToken, isTokenExpired, refreshAccessToken, SpotifyAPI } from "./api";

/**
 * Wrapper to load and manage Spotify Web Playback SDK.
 * - Detects Premium requirement and initialization errors.
 * - Exposes a minimal control API + current state subscription.
 */

export type PlaybackState = Spotify.PlaybackState | null;

type PlayerReady = {
  device_id: string;
};

type InitResult =
  | { ok: true; deviceId: string; player: Spotify.Player }
  | { ok: false; reason: string; requiresPremium?: boolean };

let sdkLoaded = false;
let sdkLoadingPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (sdkLoaded) return Promise.resolve();
  if (sdkLoadingPromise) return sdkLoadingPromise;
  sdkLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  }).then(() => {
    // global callback fired by SDK
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      sdkLoaded = true;
    };
  });
  return sdkLoadingPromise;
}

export async function initWebPlayback(): Promise<InitResult> {
  // Ensure we have a valid token
  let tk = getStoredToken();
  if (!tk || isTokenExpired(tk)) {
    tk = (await refreshAccessToken()) || tk;
  }
  if (!tk) return { ok: false, reason: "Not authenticated" };

  await loadSdk();

  if (!(window as any).Spotify) {
    return {
      ok: false,
      reason: "Spotify Web Playback SDK failed to load",
      requiresPremium: true
    };
  }

  return new Promise((resolve) => {
    const player = new (window as any).Spotify.Player({
      name: process.env.REACT_APP_APP_NAME || "RetroSpy Car AI",
      getOAuthToken: async (cb: (token: string) => void) => {
        // Refresh token if needed
        let token = getStoredToken();
        if (!token || isTokenExpired(token)) {
          token = (await refreshAccessToken()) || token;
        }
        cb(token?.access_token || "");
      },
      volume: 0.8
    });

    let resolved = false;

    player.addListener("ready", ({ device_id }: PlayerReady) => {
      resolved = true;
      resolve({ ok: true, deviceId: device_id, player });
    });

    player.addListener("not_ready", ({ device_id }: PlayerReady) => {
      console.warn("Device ID has gone offline", device_id);
    });

    player.addListener("initialization_error", ({ message }: any) => {
      console.error("Initialization error", message);
      if (!resolved) {
        resolved = true;
        resolve({
          ok: false,
          reason: message || "Initialization error",
          requiresPremium: /premium/i.test(message || "")
        });
      }
    });
    player.addListener("authentication_error", ({ message }: any) => {
      console.error("Auth error", message);
      if (!resolved) {
        resolved = true;
        resolve({ ok: false, reason: message || "Auth error" });
      }
    });
    player.addListener("account_error", ({ message }: any) => {
      console.error("Account error", message);
      if (!resolved) {
        resolved = true;
        resolve({
          ok: false,
          reason: message || "Account error",
          requiresPremium: true
        });
      }
    });

    player.connect();
  });
}

export async function transferToDevice(deviceId: string): Promise<void> {
  await SpotifyAPI.transferPlayback(deviceId, true);
}

export async function getDevices(): Promise<SpotifyApi.UserDevicesResponse> {
  return await SpotifyAPI.devices();
}