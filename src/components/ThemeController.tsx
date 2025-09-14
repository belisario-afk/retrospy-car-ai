import React, { useEffect, useRef } from "react";
import { useTheme } from "../lib/theme";

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

const ThemeController: React.FC = () => {
  const {
    mode,
    animated,
    rainbowSpeed,
    background,
    foreground,
    accent,
    glow
  } = useTheme();

  const rafRef = useRef<number | null>(null);
  const hueRef = useRef<number>(hexToHue(accent));
  const lastTsRef = useRef<number>(0);

  // Apply static variables (no object refs in deps; only primitives)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--bg", background);
    root.style.setProperty("--fg", foreground);
    root.style.setProperty("--accent", accent);
    const hue = hexToHue(accent);
    root.style.setProperty("--accent-hue", String(hue));
    root.style.setProperty("--accent-dim", `color-mix(in oklab, ${accent} 35%, transparent)`);
    root.style.setProperty("--glow", String(glow));
  }, [background, foreground, accent, glow]);

  // Rainbow animation (adjusts --accent via hue rotate)
  useEffect(() => {
    if (mode !== "rainbow" || !animated) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = (ts - last) / 1000;
      lastTsRef.current = ts;
      hueRef.current = (hueRef.current + rainbowSpeed * dt) % 360;

      const h = hueRef.current;
      const dynAccent = `hsl(${Math.round(h)} 90% 60%)`;
      const root = document.documentElement;
      root.style.setProperty("--accent", dynAccent);
      root.style.setProperty("--accent-dim", `color-mix(in oklab, ${dynAccent} 35%, transparent)`);
      root.style.setProperty("--accent-hue", String(h.toFixed(1)));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mode, animated, rainbowSpeed]);

  return null;
};

export default ThemeController;