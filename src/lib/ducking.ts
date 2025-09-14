// Simple Spotify volume ducking for TTS/prompts.
// Note: Web API doesn't expose current volume; we restore to a configured default.
// You can later wire this to your player SDK to capture the true current volume.

import { SpotifyAPI } from "./spotify/api";

type DuckOptions = {
  targetPercent?: number;   // volume percent during duck (0-100)
  restorePercent?: number;  // volume percent after duck (0-100)
  rampMs?: number;          // ramp duration for each step
  holdMs?: number;          // minimal time to hold duck if action resolves too quickly
};

const DEFAULTS: Required<DuckOptions> = {
  targetPercent: 25,
  restorePercent: 65,
  rampMs: 200,
  holdMs: 0
};

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function rampVolume(from: number, to: number, durationMs: number, steps = 6) {
  const clamped = (v: number) => Math.max(0, Math.min(100, v));
  const start = clamped(from);
  const end = clamped(to);
  if (durationMs <= 0 || steps <= 1) {
    await SpotifyAPI.setVolume(end);
    return;
  }
  const stepTime = Math.max(10, Math.round(durationMs / steps));
  for (let i = 1; i <= steps; i++) {
    const v = Math.round(start + ((end - start) * i) / steps);
    try {
      await SpotifyAPI.setVolume(v);
    } catch {
      // If user switched devices, this may fail; continue best-effort
      break;
    }
    await sleep(stepTime);
  }
}

export async function duckDuring<T>(
  action: () => Promise<T>,
  opts: DuckOptions = {}
): Promise<T> {
  const { targetPercent, restorePercent, rampMs, holdMs } = { ...DEFAULTS, ...opts };

  try {
    // Best-effort: ramp down to duck target
    await rampVolume(restorePercent, targetPercent, rampMs);
  } catch {
    // Ignore volume API failures; still run the action
  }

  const start = Date.now();
  try {
    const result = await action();
    const elapsed = Date.now() - start;
    if (holdMs > elapsed) await sleep(holdMs - elapsed);
    return result;
  } finally {
    try {
      await rampVolume(targetPercent, restorePercent, rampMs);
    } catch {
      // Ignore restore failures (e.g., device changed mid-duck)
    }
  }
}