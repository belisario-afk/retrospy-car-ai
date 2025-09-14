import { create } from "zustand";

export type ThemeMode = "solid" | "gradient" | "rainbow";

export type ThemePresetKey =
  | "Neon Green"
  | "Ice Blue"
  | "Magenta"
  | "Amber"
  | "Cyber Purple"
  | "RGB Rainbow";

export type BgEffect = "none" | "chaser" | "stars" | "sunset";

export type BgChaser = {
  lineCount: number; // 1..200
  speed: number; // px/s dash movement
  thickness: number; // px
  angleDeg: number; // -180..180
  gap: number; // px gap between dashes
  glow: number; // 0..1 extra blur/glow
};

export type BgStars = {
  density: number; // stars per 100k px^2 (e.g., 2..18)
  twinkle: number; // 0..1 twinkle intensity
  speed: number; // twinkle speed factor
  shootingChance: number; // 0..1 probability per second
};

export type BgSunset = {
  scheme: "night" | "sunset" | "dawn";
  speed: number; // hue rotate deg/s
};

export type ThemeState = {
  // Core theme
  preset: ThemePresetKey;
  mode: ThemeMode;
  background: string; // hex
  foreground: string; // hex
  accent: string; // hex
  glow: number; // 0..1
  rainbowSpeed: number; // deg per second
  animated: boolean;

  // Animated backgrounds
  bgEffect: BgEffect;
  bgChaser: BgChaser;
  bgStars: BgStars;
  bgSunset: BgSunset;

  // actions
  setPreset: (k: ThemePresetKey) => void;
  setMode: (m: ThemeMode) => void;
  setColors: (opts: Partial<Pick<ThemeState, "background" | "foreground" | "accent">>) => void;
  setGlow: (g: number) => void;
  setRainbowSpeed: (s: number) => void;
  setAnimated: (a: boolean) => void;

  setBgEffect: (e: BgEffect) => void;
  updateBgChaser: (p: Partial<BgChaser>) => void;
  updateBgStars: (p: Partial<BgStars>) => void;
  updateBgSunset: (p: Partial<BgSunset>) => void;
};

const STORAGE_KEY = "retrospy_theme_v2";

function save(state: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
function load(): Partial<ThemeState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeState;
  } catch {
    return null;
  }
}

// Helpers
function hexToHue(hex: string): number {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!res) return 110;
  const r = parseInt(res[1], 16) / 255;
  const g = parseInt(res[2], 16) / 255;
  const b = parseInt(res[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = (60 * ((g - b) / (max - min)) + 360) % 360;
  } else if (max === g) {
    h = 60 * ((b - r) / (max - min)) + 120;
  } else {
    h = 60 * ((r - g) / (max - min)) + 240;
  }
  return Math.round(h);
}

const PRESETS: Record<ThemePresetKey, { bg: string; fg: string; accent: string; mode: ThemeMode }> = {
  "Neon Green": { bg: "#000000", fg: "#e6ffe6", accent: "#39ff14", mode: "solid" },
  "Ice Blue": { bg: "#030b12", fg: "#e6f7ff", accent: "#29b6f6", mode: "solid" },
  Magenta: { bg: "#0b030a", fg: "#ffe6fb", accent: "#ff2aa1", mode: "solid" },
  Amber: { bg: "#0b0a03", fg: "#fff6e6", accent: "#ffc107", mode: "solid" },
  "Cyber Purple": { bg: "#0a0712", fg: "#f1e6ff", accent: "#9b59ff", mode: "solid" },
  "RGB Rainbow": { bg: "#000000", fg: "#f5f5f5", accent: "#ff0040", mode: "rainbow" }
};

const DEFAULTS: ThemeState = {
  preset: "Neon Green",
  mode: "solid",
  background: PRESETS["Neon Green"].bg,
  foreground: PRESETS["Neon Green"].fg,
  accent: PRESETS["Neon Green"].accent,
  glow: 0.75,
  rainbowSpeed: 20,
  animated: true,

  bgEffect: "none",
  bgChaser: {
    lineCount: 12,
    speed: 120,
    thickness: 3,
    angleDeg: -12,
    gap: 60,
    glow: 0.5
  },
  bgStars: {
    density: 8, // per 100k px^2
    twinkle: 0.7,
    speed: 1,
    shootingChance: 0.03 // 3% per second
  },
  bgSunset: {
    scheme: "night",
    speed: 2
  },

  setPreset: () => {},
  setMode: () => {},
  setColors: () => {},
  setGlow: () => {},
  setRainbowSpeed: () => {},
  setAnimated: () => {},
  setBgEffect: () => {},
  updateBgChaser: () => {},
  updateBgStars: () => {},
  updateBgSunset: () => {}
};

export const useTheme = create<ThemeState>((set) => {
  const initial = { ...DEFAULTS, ...(load() ?? {}) };
  return {
    ...initial,
    setPreset: (k) =>
      set((s) => {
        const p = PRESETS[k];
        const next = { ...s, preset: k, mode: p.mode, background: p.bg, foreground: p.fg, accent: p.accent };
        save(next);
        return next;
      }),
    setMode: (m) =>
      set((s) => {
        const next = { ...s, mode: m };
        save(next);
        return next;
      }),
    setColors: (opts) =>
      set((s) => {
        const next = { ...s, ...opts, preset: s.preset };
        save(next);
        return next;
      }),
    setGlow: (g) =>
      set((s) => {
        const next = { ...s, glow: Math.max(0, Math.min(1, g)) };
        save(next);
        return next;
      }),
    setRainbowSpeed: (spd) =>
      set((s) => {
        const next = { ...s, rainbowSpeed: Math.max(1, Math.min(360, spd)) };
        save(next);
        return next;
      }),
    setAnimated: (a) =>
      set((s) => {
        const next = { ...s, animated: a };
        save(next);
        return next;
      }),
    setBgEffect: (e) =>
      set((s) => {
        const next = { ...s, bgEffect: e };
        save(next);
        return next;
      }),
    updateBgChaser: (p) =>
      set((s) => {
        const next = { ...s, bgChaser: { ...s.bgChaser, ...p } };
        save(next);
        return next;
      }),
    updateBgStars: (p) =>
      set((s) => {
        const next = { ...s, bgStars: { ...s.bgStars, ...p } };
        save(next);
        return next;
      }),
    updateBgSunset: (p) =>
      set((s) => {
        const next = { ...s, bgSunset: { ...s.bgSunset, ...p } };
        save(next);
        return next;
      })
  };
});

// Apply variables to document
export function applyThemeToDocument(t: ThemeState) {
  const root = document.documentElement;
  root.style.setProperty("--bg", t.background);
  root.style.setProperty("--fg", t.foreground);
  root.style.setProperty("--accent", t.accent);
  const hue = hexToHue(t.accent);
  root.style.setProperty("--accent-hue", String(hue));
  root.style.setProperty("--accent-dim", `color-mix(in oklab, ${t.accent} 35%, transparent)`);
  root.style.setProperty("--glow", String(t.glow));
}