import React, { useCallback, useEffect, useRef, useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";

type Props = {
  initial?: number; // 0..100
  onChangePercent?: (v: number) => void;
  label?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function normalizeDeg180(d: number) {
  let x = d;
  while (x <= -180) x += 360;
  while (x > 180) x -= 360;
  return x;
}

const HAPTIC_STEP = 5; // vibrate every 5%
const HAPTIC_PULSE_MS = 20;
const MIN_ANGLE = -130;
const MAX_ANGLE = 130;
const ANGLE_RANGE = MAX_ANGLE - MIN_ANGLE;

// Visual config
const KNOB_SIZE = 160; // px (tuned for SM‑T227U landscape)
const RING_RADIUS = (KNOB_SIZE / 2) - 8; // where ticks sit
const TICK_MINOR_STEP = 1; // percent
const TICK_MAJOR_STEP = 5; // percent

function vibrate(pattern: number | number[]) {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate?.(pattern);
    }
  } catch {
    // ignore
  }
}

const Knob3D: React.FC<Props> = ({ initial = 60, onChangePercent, label = "Volume" }) => {
  // Displayed value (smoothed)
  const [display, setDisplay] = useState<number>(clamp(initial, 0, 100));

  // Target (unsmoothed) value and refs
  const targetRef = useRef<number>(clamp(initial, 0, 100));
  const displayRef = useRef<number>(display);
  const draggingRef = useRef<boolean>(false);

  // Angle-grab offset so the knob never jumps on initial touch
  const grabOffsetDegRef = useRef<number>(0);

  // Throttled apply to Spotify
  const applyTimer = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);

  const lastTickRef = useRef<number>(Math.round(display / HAPTIC_STEP));
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  // Helpers: map value <-> angle
  const angleFromValue = useCallback((v: number) => MIN_ANGLE + (ANGLE_RANGE * clamp(v, 0, 100)) / 100, []);
  const valueFromAngle = useCallback((deg: number) => {
    const clamped = clamp(deg, MIN_ANGLE, MAX_ANGLE);
    return clamp(Math.round(((clamped - MIN_ANGLE) / ANGLE_RANGE) * 100), 0, 100);
  }, []);

  const pointerAngleDeg = useCallback((clientX: number, clientY: number) => {
    const el = knobRootRef.current!;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    // 0° at top, clockwise positive
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
    deg = normalizeDeg180(deg);
    return deg;
  }, []);

  // Root ref for geometry
  const knobRootRef = useRef<HTMLDivElement | null>(null);

  // Apply to Spotify (gentle throttle)
  const flushApply = useCallback(() => {
    applyTimer.current = null;
    const v = pendingRef.current;
    if (v == null) return;
    pendingRef.current = null;
    void SpotifyAPI.setVolume(v).catch(() => {});
    onChangePercent?.(v);
  }, [onChangePercent]);

  const scheduleApply = useCallback(
    (v: number) => {
      pendingRef.current = v;
      if (applyTimer.current === null) {
        applyTimer.current = window.setTimeout(flushApply, 100);
      }
    },
    [flushApply]
  );

  // Start a continuous RAF smoother (very light)
  useEffect(() => {
    const animate = (ts: number) => {
      const prevTs = lastTsRef.current || ts;
      const dt = Math.min(0.050, Math.max(0.000, (ts - prevTs) / 1000)); // clamp for stability
      lastTsRef.current = ts;

      // Exponential smoothing: bigger step when further away, scaled by time
      const curr = displayRef.current;
      const target = targetRef.current;
      const step = clamp(dt * 10, 0, 1); // ~10Hz approach rate
      const next = Math.abs(target - curr) < 0.1 ? target : lerp(curr, target, step);

      if (next !== curr) {
        displayRef.current = next;
        setDisplay(Math.round(next)); // render as integer percent for clean ticks

        // Haptic tick: fire when crossing a new 5% boundary
        const newTick = Math.round(next / HAPTIC_STEP);
        if (newTick !== lastTickRef.current) {
          lastTickRef.current = newTick;
          vibrate(HAPTIC_PULSE_MS);
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (applyTimer.current !== null) {
        clearTimeout(applyTimer.current);
        applyTimer.current = null;
      }
    };
  }, []);

  // Pointer interactions
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    // Prime haptic
    vibrate(HAPTIC_PULSE_MS);

    // Compute grab offset so initial touch does NOT jump value
    const pAng = pointerAngleDeg(e.clientX, e.clientY);
    const currVal = targetRef.current;
    const currAng = angleFromValue(currVal);
    grabOffsetDegRef.current = normalizeDeg180(pAng - currAng);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    const pAng = pointerAngleDeg(e.clientX, e.clientY);
    const effective = normalizeDeg180(pAng - grabOffsetDegRef.current);
    const v = valueFromAngle(clamp(effective, MIN_ANGLE, MAX_ANGLE));
    if (v !== targetRef.current) {
      targetRef.current = v;
      scheduleApply(v);
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    // Ensure final apply
    scheduleApply(targetRef.current);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    const v = clamp(targetRef.current + delta, 0, 100);
    targetRef.current = v;
    scheduleApply(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let v = targetRef.current;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") v = clamp(v + 1, 0, 100);
    else if (e.key === "ArrowDown" || e.key === "ArrowLeft") v = clamp(v - 1, 0, 100);
    else if (e.key === "Home") v = 0;
    else if (e.key === "End") v = 100;
    else return;

    targetRef.current = v;
    scheduleApply(v);
    e.preventDefault();
  };

  const displayAngle = angleFromValue(display);

  // Build ticks
  const majorTicks = Array.from({ length: Math.floor(100 / TICK_MAJOR_STEP) + 1 }, (_, i) => i * TICK_MAJOR_STEP);
  const minorTicks = Array.from({ length: Math.floor(100 / TICK_MINOR_STEP) + 1 }, (_, i) => i * TICK_MINOR_STEP).filter(
    (p) => p % TICK_MAJOR_STEP !== 0
  );

  const tickEl = (percent: number, major: boolean) => {
    const ang = angleFromValue(percent);
    if (ang < MIN_ANGLE || ang > MAX_ANGLE) return null;
    const len = major ? 12 : 6;
    const thickness = major ? 3 : 2;
    const color =
      percent <= display ? "var(--accent)" : "color-mix(in oklab, var(--accent) 35%, transparent)";

    return (
      <div
        key={`${major ? "M" : "m"}-${percent}`}
        className="absolute"
        style={{
          left: "50%",
          top: "50%",
          width: thickness,
          height: len,
          background: color,
          borderRadius: thickness / 2,
          transformOrigin: "50% 0%",
          transform: `translate(-50%, -50%) rotate(${ang}deg) translate(0, -${RING_RADIUS}px)`,
          boxShadow: major ? "0 0 6px color-mix(in oklab, var(--accent) 45%, transparent)" : "none"
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={knobRootRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(display)}
        tabIndex={0}
        className="relative select-none accent-ring"
        style={{
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          borderRadius: "50%",
          touchAction: "none",
          overscrollBehavior: "contain",
          userSelect: "none",
          border: "1px solid var(--accent-dim)",
          background:
            // Concentric grooves + subtle metal shading
            `radial-gradient(circle at 35% 30%, rgba(255,255,255,.12), rgba(0,0,0,.55) 60%, rgba(0,0,0,.8)),
             repeating-conic-gradient(from 0deg, rgba(255,255,255,0.06) 0 2deg, rgba(0,0,0,0.06) 2deg 4deg),
             linear-gradient(180deg, rgba(255,255,255,.06), rgba(0,0,0,.4))`,
          boxShadow:
            "inset 0 2px 10px rgba(255,255,255,.05), inset 0 -8px 18px rgba(0,0,0,.65), 0 0 16px color-mix(in oklab, var(--accent) 20%, transparent)"
        }}
      >
        {/* Progress arc */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            mask:
              "radial-gradient(circle at 50% 50%, transparent calc(50% - 9px), black calc(50% - 8px))",
            WebkitMask:
              "radial-gradient(circle at 50% 50%, transparent calc(50% - 9px), black calc(50% - 8px))",
            background: `conic-gradient(from ${MIN_ANGLE + 90}deg, var(--accent) ${(display / 100) * ANGLE_RANGE}deg, #202020 ${(display / 100) * ANGLE_RANGE}deg 360deg)`
          }}
        />

        {/* Ticks */}
        <div className="absolute inset-0 pointer-events-none">
          {minorTicks.map((p) => tickEl(p, false))}
          {majorTicks.map((p) => tickEl(p, true))}
        </div>

        {/* Pointer line */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: 6,
            height: 42,
            transformOrigin: "50% 90%",
            transform: `translate(-50%, -90%) rotate(${displayAngle}deg)`,
            background: "var(--accent)",
            borderRadius: 3,
            boxShadow:
              "0 0 10px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 2px rgba(0,0,0,.6)"
          }}
        />

        {/* Center cap */}
        <div
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: 28,
            height: 28,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,.18), rgba(0,0,0,.7))",
            border: "1px solid var(--accent-dim)",
            boxShadow: "inset 0 1px 6px rgba(0,0,0,.7), 0 0 6px rgba(0,0,0,.6)"
          }}
        />
      </div>

      <div className="text-xs opacity-80">
        {label}: {Math.round(display)}%
      </div>
    </div>
  );
};

export default Knob3D;