import { create } from "zustand";
import { setVolumeSmart } from "./spotify/webPlaybackWrapper";

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
    await setVolumeSmart(end);
    return;
  }
  const stepTime = Math.max(50, Math.floor(durationMs / steps));
  for (let i = 1; i <= steps; i++) {
    const v = Math.round(start + ((end - start) * i) / steps);
    await setVolumeSmart(v).catch(() => {
      // best-effort; indicate failure so callers can back off
      throw new Error("volume_unavailable");
    });
    await sleep(stepTime);
  }
}

export type LoudnessMode = "city" | "highway" | "auto";
export type AutoState = "city" | "highway";

function pickAutoState(args: {
  speedMph: number;
  autoEnterMph: number;
  autoExitMph: number;
  lastAppliedPercent: number | null;
  cityPercent: number;
  highwayPercent: number;
}): AutoState {
  const { speedMph, autoEnterMph, autoExitMph, lastAppliedPercent, cityPercent, highwayPercent } =
    args;

  if (speedMph >= autoEnterMph) return "highway";
  if (speedMph <= autoExitMph) return "city";

  // Between thresholds: bias to the last applied side if we can infer it.
  if (lastAppliedPercent !== null) {
    const mid = (cityPercent + highwayPercent) / 2;
    return lastAppliedPercent >= mid ? "highway" : "city";
  }
  // Default bias
  return "city";
}

type LoudnessState = {
  // Current mode (UI toggle)
  mode: LoudnessMode;
  setMode: (m: LoudnessMode) => void;

  // Targets and behavior
  cityPercent: number;
  highwayPercent: number;
  rampMs: number;
  throttleMs: number;

  // Auto-switch thresholds (mph)
  autoEnterMph: number; // when speed >= enter -> prefer "highway"
  autoExitMph: number; // when speed <= exit  -> prefer "city"
  setAutoThresholds: (enter: number, exit: number) => void;

  // Derived auto state for UI (shown when mode === "auto")
  autoState: AutoState;

  // Internal bookkeeping
  lastAppliedPercent: number | null;
  lastApplyAt: number | null;
  speedMph: number;
  volumeAvailable: boolean; // if false, cooldown before retrying

  // Mutators
  setCityPercent: (n: number) => void;
  setHighwayPercent: (n: number) => void;
  setRampMs: (n: number) => void;
  setThrottleMs: (n: number) => void;
  setSpeedMph: (mph: number) => void;

  // Apply target volume for a mode (defaults to current mode if omitted)
  applyTargetFor: (kind?: LoudnessMode) => Promise<void>;
};

const COOLDOWN_MS = 30_000;

export const useLoudnessStore = create<LoudnessState>((set, get) => {
  // Initial defaults
  const initial = {
    mode: "auto" as LoudnessMode,
    cityPercent: 45,
    highwayPercent: 65,
    rampMs: 600,
    throttleMs: 1200,
    autoEnterMph: 45,
    autoExitMph: 30,
    lastAppliedPercent: null as number | null,
    lastApplyAt: null as number | null,
    speedMph: 0,
    volumeAvailable: true
  };

  return {
    ...initial,
    autoState: pickAutoState({
      speedMph: initial.speedMph,
      autoEnterMph: initial.autoEnterMph,
      autoExitMph: initial.autoExitMph,
      lastAppliedPercent: initial.lastAppliedPercent,
      cityPercent: initial.cityPercent,
      highwayPercent: initial.highwayPercent
    }),

    // Mutators
    setMode: (m) => set({ mode: m }),

    setCityPercent: (n) => {
      const cityPercent = clamp(n, 0, 100);
      const s = get();
      const autoState = pickAutoState({
        speedMph: s.speedMph,
        autoEnterMph: s.autoEnterMph,
        autoExitMph: s.autoExitMph,
        lastAppliedPercent: s.lastAppliedPercent,
        cityPercent,
        highwayPercent: s.highwayPercent
      });
      set({ cityPercent, autoState });
    },

    setHighwayPercent: (n) => {
      const highwayPercent = clamp(n, 0, 100);
      const s = get();
      const autoState = pickAutoState({
        speedMph: s.speedMph,
        autoEnterMph: s.autoEnterMph,
        autoExitMph: s.autoExitMph,
        lastAppliedPercent: s.lastAppliedPercent,
        cityPercent: s.cityPercent,
        highwayPercent
      });
      set({ highwayPercent, autoState });
    },

    setRampMs: (n) => set({ rampMs: Math.max(0, n | 0) }),
    setThrottleMs: (n) => set({ throttleMs: Math.max(0, n | 0) }),

    setAutoThresholds: (enter, exit) => {
      // sanitize thresholds to reasonable bounds and hysteresis
      const e = clamp(Math.round(enter), 0, 300);
      const x = clamp(Math.round(exit), 0, 300);
      // ensure exit <= enter to keep hysteresis valid
      const exitFixed = Math.min(x, e);
      const s = get();
      const autoState = pickAutoState({
        speedMph: s.speedMph,
        autoEnterMph: e,
        autoExitMph: exitFixed,
        lastAppliedPercent: s.lastAppliedPercent,
        cityPercent: s.cityPercent,
        highwayPercent: s.highwayPercent
      });
      set({ autoEnterMph: e, autoExitMph: exitFixed, autoState });
    },

    setSpeedMph: (mph) => {
      const speed = clamp(Math.round(mph), 0, 300);
      const s = get();
      const autoState = pickAutoState({
        speedMph: speed,
        autoEnterMph: s.autoEnterMph,
        autoExitMph: s.autoExitMph,
        lastAppliedPercent: s.lastAppliedPercent,
        cityPercent: s.cityPercent,
        highwayPercent: s.highwayPercent
      });
      set({ speedMph: speed, autoState });
    },

    applyTargetFor: async (kind) => {
      const state = get();
      const effectiveMode: LoudnessMode = kind ?? state.mode;

      let target: number;
      let chosenAutoState: AutoState | null = null;

      if (effectiveMode === "auto") {
        const automatic = pickAutoState({
          speedMph: state.speedMph,
          autoEnterMph: state.autoEnterMph,
          autoExitMph: state.autoExitMph,
          lastAppliedPercent: state.lastAppliedPercent,
          cityPercent: state.cityPercent,
          highwayPercent: state.highwayPercent
        });
        chosenAutoState = automatic;
        target =
          automatic === "highway"
            ? clamp(state.highwayPercent, 0, 100)
            : clamp(state.cityPercent, 0, 100);
      } else {
        target =
          effectiveMode === "city"
            ? clamp(state.cityPercent, 0, 100)
            : clamp(state.highwayPercent, 0, 100);
      }

      const now = Date.now();

      // Respect throttle window
      if (state.lastApplyAt && now - state.lastApplyAt < state.throttleMs) {
        return;
      }

      // If volume recently failed, back off for COOLDOWN_MS
      if (!state.volumeAvailable && state.lastApplyAt && now - state.lastApplyAt < COOLDOWN_MS) {
        return;
      }

      const from = state.lastAppliedPercent ?? target;
      try {
        await rampSpotifyVolume(from, target, state.rampMs);
        set({
          lastAppliedPercent: target,
          lastApplyAt: Date.now(),
          volumeAvailable: true,
          ...(chosenAutoState ? { autoState: chosenAutoState } : {})
        });
      } catch {
        // setVolume failed (device might not support remote volume or SDK inactive)
        set({
          volumeAvailable: false,
          lastApplyAt: Date.now(),
          lastAppliedPercent: target,
          ...(chosenAutoState ? { autoState: chosenAutoState } : {})
        });
      }
    }
  };
});

// Back-compat named export to satisfy imports like `useLoudness`
export const useLoudness = useLoudnessStore;
export default useLoudnessStore;