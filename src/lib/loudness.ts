import { create } from "zustand";
import { SpotifyAPI } from "./spotify/api";

export type LoudnessMode = "city" | "highway" | "auto";

type LoudnessState = {
  mode: LoudnessMode;
  autoState: "city" | "highway"; // internal state while in auto
  cityPercent: number; // 0..100
  highwayPercent: number; // 0..100
  rampMs: number; // duration of volume ramp
  throttleMs: number; // min interval between volume API calls
  autoEnterMph: number; // switch to highway when >=
  autoExitMph: number; // switch to city when <=
  lastAppliedPercent: number | null;
  lastApplyAt: number | null;
  volumeAvailable: boolean | null; // null unknown, true ok, false failing
  // Runtime speed tracking
  speedMph: number | null;
  // Actions
  setMode: (mode: LoudnessMode) => void;
  setCityPercent: (v: number) => void;
  setHighwayPercent: (v: number) => void;
  setRampMs: (v: number) => void;
  setThrottleMs: (v: number) => void;
  setAutoThresholds: (enterMph: number, exitMph: number) => void;
  setSpeedMph: (mph: number | null) => void;
  applyTargetFor: (kind: "city" | "highway") => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function rampSpotifyVolume(from: number, to: number, durationMs: number, steps = 6) {
  const start = clamp(Math.round(from), 0, 100);
  const end = clamp(Math.round(to), 0, 100);
  if (durationMs <= 0 || steps <= 1) {
    await SpotifyAPI.setVolume(end);
    return;
  }
  const stepTime = Math.max(50, Math.floor(durationMs / steps));
  for (let i = 1; i <= steps; i++) {
    const v = Math.round(start + ((end - start) * i) / steps);
    await SpotifyAPI.setVolume(v).catch(() => {
      // best-effort; if a step fails we still continue to avoid stalling
    });
    await sleep(stepTime);
  }
}

export const useLoudness = create<LoudnessState>((set, get) => ({
  mode: "city",
  autoState: "city",
  cityPercent: 45,
  highwayPercent: 70,
  rampMs: 300,
  throttleMs: 1500,
  autoEnterMph: 50,
  autoExitMph: 40,
  lastAppliedPercent: null,
  lastApplyAt: null,
  volumeAvailable: null,
  speedMph: null,

  setMode: (mode) => set({ mode }),
  setCityPercent: (v) => set({ cityPercent: clamp(v, 0, 100) }),
  setHighwayPercent: (v) => set({ highwayPercent: clamp(v, 0, 100) }),
  setRampMs: (v) => set({ rampMs: clamp(v, 0, 8000) }),
  setThrottleMs: (v) => set({ throttleMs: clamp(v, 250, 5000) }),
  setAutoThresholds: (enterMph, exitMph) =>
    set({
      autoEnterMph: Math.max(0, enterMph),
      autoExitMph: Math.max(0, Math.min(exitMph, enterMph - 1)) // ensure hysteresis
    }),
  setSpeedMph: (mph) => set({ speedMph: mph }),

  applyTargetFor: async (kind) => {
    const state = get();
    const target =
      kind === "city" ? clamp(state.cityPercent, 0, 100) : clamp(state.highwayPercent, 0, 100);

    const now = Date.now();
    if (state.lastApplyAt && now - state.lastApplyAt < state.throttleMs) {
      // Too soon; skip to avoid pumping / API rate
      return;
    }

    const from = state.lastAppliedPercent ?? target;
    try {
      await rampSpotifyVolume(from, target, state.rampMs);
      set({ lastAppliedPercent: target, lastApplyAt: Date.now(), volumeAvailable: true });
    } catch {
      // setVolume failed (device might not support remote volume)
      set({ volumeAvailable: false, lastApplyAt: Date.now(), lastAppliedPercent: target });
    }
  }
}));