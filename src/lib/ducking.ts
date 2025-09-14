// Simple Spotify volume ducking for TTS/prompts.
// Prefer SDK volume when available to avoid Web API 403s.

import { setVolumeSmart } from "./spotify/webPlaybackWrapper";

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
    await setVolumeSmart(end);
    return;
  }
  const stepTime = Math.max(10, Math.round(durationMs / steps));
  for (let i = 1; i <= steps; i++) {
    const v = Math.round(start + ((end - start) * i) / steps);
    try {
      await setVolumeSmart(v);
    } catch {
      // If user switched devices or volume is not controllable, stop ramp
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
  const startVol = restorePercent; // best effort default; SDK path doesn't expose current volume
  const startedAt = Date.now();

  // Duck down
  await rampVolume(startVol, targetPercent, rampMs);

  let result: T;
  try {
    result = await action();
  } finally {
    const spent = Date.now() - startedAt;
    const wait = Math.max(0, holdMs - spent);
    if (wait > 0) await sleep(wait);
    // Restore
    await rampVolume(targetPercent, restorePercent, rampMs);
  }
  return result;
}