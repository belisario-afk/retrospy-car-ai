import React, { useEffect, useRef } from "react";
import { useTheme } from "../lib/theme";

type Star = {
  x: number;
  y: number;
  r: number; // radius px
  base: number; // base alpha 0..1
  tw: number; // twinkle speed factor
  ph: number; // phase
};

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds left
  maxLife: number;
};

function getCssVar(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name);
  return v && v.trim().length > 0 ? v.trim() : "#39ff14";
}

const DPR = () => Math.min(2, window.devicePixelRatio || 1);

const BackgroundAnimator: React.FC = () => {
  const {
    bgEffect,
    bgChaser,
    bgStars,
    bgSunset,
    animated
  } = useTheme();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const shootersRef = useRef<ShootingStar[]>([]);
  const tRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const resize = () => {
      const dpr = DPR();
      const w = window.innerWidth;
      const h = window.innerHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild stars on resize for density correctness
      if (bgEffect === "stars") {
        const area = w * h;
        const count = Math.max(10, Math.floor((area / 100000) * bgStars.density));
        const list: Star[] = [];
        for (let i = 0; i < count; i++) {
          const x = Math.random() * w;
          const y = Math.random() * h;
          const r = Math.random() * 1.6 + 0.4;
          const base = 0.4 + Math.random() * 0.6;
          const tw = 0.5 + Math.random() * 1.5;
          const ph = Math.random() * Math.PI * 2;
          list.push({ x, y, r, base, tw, ph });
        }
        starsRef.current = list;
      } else {
        starsRef.current = [];
      }
      shootersRef.current = [];
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [bgEffect, bgStars.density]);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;

    const accent = getCssVar("--accent");
    const fg = getCssVar("--fg");
    const bg = getCssVar("--bg");

    const drawChaser = (dt: number) => {
      const w = cv.width / DPR();
      const h = cv.height / DPR();
      tRef.current += dt;
      // Clear with soft background fade
      ctx.fillStyle = bg;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      ctx.save();
      // Rotate the whole layer for angle
      const angle = (bgChaser.angleDeg * Math.PI) / 180;
      ctx.translate(w / 2, h / 2);
      ctx.rotate(angle);
      ctx.translate(-w / 2, -h / 2);

      const gapY = Math.max(6, Math.round((h / Math.max(1, bgChaser.lineCount)))); // spacing between lines
      const dash = Math.max(24, bgChaser.gap); // dash length
      const speed = bgChaser.speed; // px/sec

      ctx.lineWidth = Math.max(1, bgChaser.thickness);
      ctx.strokeStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = Math.round(6 + 20 * bgChaser.glow);

      // Offset for moving dashes
      const offset = (tRef.current * speed) % (dash * 2);

      // Draw multiple parallel lines with dashed moving segments
      for (let y = -h; y < h * 2; y += gapY) {
        ctx.setLineDash([dash, dash]); // equal dash-gap
        ctx.lineDashOffset = -offset - ((y / gapY) % 1) * dash; // subtle phase shift per line
        ctx.beginPath();
        ctx.moveTo(-w, y);
        ctx.lineTo(w * 2, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawStars = (dt: number, now: number) => {
      const w = cv.width / DPR();
      const h = cv.height / DPR();

      // Clear with full fill (night sky)
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "rgba(0,0,8,0.8)");
      grd.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Twinkling stars
      ctx.save();
      for (const s of starsRef.current) {
        const twPhase = s.ph + now * 2 * Math.PI * 0.05 * bgStars.speed * s.tw;
        const alpha = Math.max(0, Math.min(1, s.base * (0.6 + bgStars.twinkle * 0.4 * (0.5 + 0.5 * Math.sin(twPhase)))));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // Spawn shooting stars probabilistically
      if (Math.random() < bgStars.shootingChance * dt) {
        // Spawn from random top or left edge, flying diagonally down-right
        const fromTop = Math.random() < 0.5;
        const x = fromTop ? Math.random() * w : 0;
        const y = fromTop ? 0 : Math.random() * h * 0.4;
        const speed = 600 + Math.random() * 600; // px/s
        const vx = speed * (0.6 + Math.random() * 0.3);
        const vy = speed * (0.3 + Math.random() * 0.2);
        shootersRef.current.push({ x, y, vx, vy, life: 0.8 + Math.random() * 0.7, maxLife: 1.2 });
      }

      // Update and draw shooters
      const keep: ShootingStar[] = [];
      for (const s of shootersRef.current) {
        s.life -= dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.life > 0) {
          keep.push(s);
          // Draw with trail
          const trailLen = 120;
          const grd2 = ctx.createLinearGradient(s.x - s.vx * 0.1, s.y - s.vy * 0.1, s.x, s.y);
          grd2.addColorStop(0, "rgba(255,255,255,0)");
          grd2.addColorStop(1, accent);
          ctx.strokeStyle = grd2;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x - (s.vx / Math.hypot(s.vx, s.vy)) * trailLen, s.y - (s.vy / Math.hypot(s.vx, s.vy)) * trailLen);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      shootersRef.current = keep;
    };

    const drawSunset = (dt: number) => {
      const w = cv.width / DPR();
      const h = cv.height / DPR();
      tRef.current += dt;
      // Slowly shift hues with scheme baseline
      const baseHue =
        bgSunset.scheme === "sunset" ? 20 : bgSunset.scheme === "dawn" ? 200 : 240;
      const hueShift = (tRef.current * bgSunset.speed) % 360;

      const top = `hsl(${(baseHue + hueShift + 40) % 360} 90% 12%)`;
      const mid = `hsl(${(baseHue + hueShift) % 360} 85% 22%)`;
      const bot = `hsl(${(baseHue + hueShift + 300) % 360} 80% 6%)`;

      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, top);
      grd.addColorStop(0.55, mid);
      grd.addColorStop(1, bot);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Subtle sun disk on horizon
      const sunY = h * 0.7;
      const sunX = w * 0.75;
      const sunR = 80;
      const g2 = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      g2.addColorStop(0, "rgba(255,220,160,0.22)");
      g2.addColorStop(1, "rgba(255,220,160,0)");
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = (tsMs: number) => {
      const ts = tsMs / 1000;
      const last = lastRef.current || ts;
      const dt = Math.min(0.05, Math.max(0.0, ts - last)); // clamp for stability
      lastRef.current = ts;

      if (!animated && bgEffect !== "sunset") {
        // If animations disabled, draw only once for static effects; sunset still shifts slowly if animated is off? Keep static.
        if (bgEffect === "stars") {
          drawStars(0, ts);
        } else if (bgEffect === "chaser") {
          // static faint lines
          const w = cv.width / DPR();
          const h = cv.height / DPR();
          ctx.clearRect(0, 0, w, h);
        }
        return;
      }

      switch (bgEffect) {
        case "chaser":
          drawChaser(dt);
          break;
        case "stars":
          drawStars(dt, ts);
          break;
        case "sunset":
          drawSunset(dt);
          break;
        case "none":
        default: {
          const w = cv.width / DPR();
          const h = cv.height / DPR();
          ctx.clearRect(0, 0, w, h);
          break;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // Kick the loop
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [bgEffect, bgChaser.angleDeg, bgChaser.gap, bgChaser.glow, bgChaser.lineCount, bgChaser.speed, bgChaser.thickness, bgStars.density, bgStars.speed, bgStars.twinkle, bgStars.shootingChance, bgSunset.scheme, bgSunset.speed, animated]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none"
      }}
    />
  );
};

export default BackgroundAnimator;