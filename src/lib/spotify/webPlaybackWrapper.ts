/* eslint-disable @typescript-eslint/no-explicit-any */
import { getStoredToken, isTokenExpired, refreshAccessToken, SpotifyAPI } from "./api";
import type { UserDevicesResponse } from "./types";

/**
 * Spotify Web Playback SDK helper.
 * - Loads SDK correctly (defines onSpotifyWebPlaybackSDKReady before injecting the script).
 * - Avoids `process is not defined` by not referencing process at runtime.
 * - Provides SDK-first volume control to avoid 403s from the Web API.
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

// Current player/device cache
let currentPlayer: Spotify.Player | null = null;
let currentDeviceId: string | null = null;

function loadSdk(): Promise<void> {
  if (sdkLoaded) return Promise.resolve();
  if (sdkLoadingPromise) return sdkLoadingPromise;

  sdkLoadingPromise = new Promise<void>((resolve, reject) => {
    // Define the global callback BEFORE loading the script to avoid "onSpotifyWebPlaybackSDKReady is not defined"
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      sdkLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
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

  // Avoid runtime env references that may not exist (Vite/CRA differences)
  const appName = "RetroSpy Car AI";

  return new Promise((resolve) => {
    const player = new (window as any).Spotify.Player({
      name: appName,
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
      currentPlayer = player;
      currentDeviceId = device_id;
      resolved = true;
      resolve({ ok: true, deviceId: device_id, player });
    });

    player.addListener("not_ready", ({ device_id }: PlayerReady) => {
      if (currentDeviceId === device_id) {
        // mark device as stale if needed
      }
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

export function getCurrentPlayer(): Spotify.Player | null {
  return currentPlayer;
}

export function getCurrentDeviceId(): string | null {
  return currentDeviceId;
}

export async function isSdkActiveDevice(): Promise<boolean> {
  if (!currentDeviceId) return false;
  try {
    const st = await SpotifyAPI.playbackState();
    const activeId = (st as any)?.device?.id || null;
    return Boolean(activeId && activeId === currentDeviceId);
  } catch {
    return false;
  }
}

export async function setPlayerVolume(percent: number): Promise<void> {
  const player = getCurrentPlayer();
  if (!player) throw new Error("SDK player not available");
  const vol = Math.max(0, Math.min(1, percent / 100));
  await player.setVolume(vol);
}

/**
 * Prefer SDK volume when the SDK device is active (avoids Web API 403).
 * Falls back to Web API setVolume if SDK is not available/active.
 */
export async function setVolumeSmart(percent: number): Promise<void> {
  if (await isSdkActiveDevice()) {
    await setPlayerVolume(percent);
  } else {
    await SpotifyAPI.setVolume(percent);
  }
}

export async function transferToDevice(deviceId: string): Promise<void> {
  await SpotifyAPI.transferPlayback(deviceId, true);
}

export async function getDevices(): Promise<UserDevicesResponse> {
  return await SpotifyAPI.devices();
}