import React, { useEffect, useRef } from "react";
import { applyThemeToDocument, useTheme } from "../lib/theme";

const ThemeController: React.FC = () => {
  const theme = useTheme();
  const rafRef = useRef<number | null>(null);
  const hueRef = useRef<number>(Number(getComputedStyle(document.documentElement).getPropertyValue("--accent-hue")) || 110);
  const lastTsRef = useRef<number>(0);

  // Apply static variables
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme.background, theme.foreground, theme.accent, theme.glow]);

  // Rainbow animation (adjusts --accent via hue rotate)
  useEffect(() => {
    if (theme.mode !== "rainbow" || !theme.animated) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const tick = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = (ts - last) / 1000; // sec
      lastTsRef.current = ts;
      hueRef.current = (hueRef.current + theme.rainbowSpeed * dt) % 360;

      const h = hueRef.current;
      const accent = `hsl(${Math.round(h)} 90% 60%)`;
      const root = document.documentElement;
      root.style.setProperty("--accent", accent);
      root.style.setProperty("--accent-dim", `color-mix(in oklab, ${accent} 35%, transparent)`);
      root.style.setProperty("--accent-hue", String(h.toFixed(1)));

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [theme.mode, theme.animated, theme.rainbowSpeed]);

  return null;
};

export default ThemeController;