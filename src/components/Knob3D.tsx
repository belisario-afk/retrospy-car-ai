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

const HAPTIC_STEP = 5; // vibrate on every 5% change
const MIN_ANGLE = -130;
const MAX_ANGLE = 130;
const HAPTIC_PULSE_MS = 20;

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
  const [value, setValue] = useState<number>(clamp(initial, 0, 100));
  const [dragging, setDragging] = useState<boolean>(false);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const lastTickRef = useRef<number>(Math.round(initial / HAPTIC_STEP));
  const lastAppliedRef = useRef<number>(initial);

  // Throttled Spotify volume apply (gentle)
  const applyTimer = useRef<number | null>(null);
  const pendingRef = useRef<number | null>(null);

  const flush = useCallback(() => {
    applyTimer.current = null;
    const v = pendingRef.current;
    if (v == null) return;
    pendingRef.current = null;
    lastAppliedRef.current = v;
    void SpotifyAPI.setVolume(v).catch(() => {});
    onChangePercent?.(v);
  }, [onChangePercent]);

  const scheduleApply = useCallback(
    (v: number) => {
      pendingRef.current = v;
      if (applyTimer.current === null) {
        applyTimer.current = window.setTimeout(flush, 100);
      }
    },
    [flush]
  );

  const angleFromValue = (v: number) => MIN_ANGLE + ((MAX_ANGLE - MIN_ANGLE) * v) / 100;
  const valueFromPoint = (clientX: number, clientY: number) => {
    const el = knobRef.current!;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI;
    deg = deg - 90; // rotate to top
    if (deg < -180) deg += 360;
    const clamped = clamp(deg, MIN_ANGLE, MAX_ANGLE);
    const val = ((clamped - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100;
    return clamp(Math.round(val), 0, 100);
  };

  const handleHapticTick = (v: number, prime = false) => {
    if (prime) {
      vibrate(HAPTIC_PULSE_MS);
      return;
    }
    const tick = Math.round(v / HAPTIC_STEP);
    if (tick !== lastTickRef.current) {
      lastTickRef.current = tick;
      vibrate(HAPTIC_PULSE_MS);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); // stop page gestures
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    // Prime haptic so users feel it immediately
    handleHapticTick(value, true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault(); // stop page scroll while dragging
    const v = valueFromPoint(e.clientX, e.clientY);
    if (v === value) return;
    setValue(v);
    scheduleApply(v);
    handleHapticTick(v);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    // Ensure final value is applied
    scheduleApply(value);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -2 : 2;
    const v = clamp(value + delta, 0, 100);
    setValue(v);
    scheduleApply(v);
    handleHapticTick(v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      const v = clamp(value + 1, 0, 100);
      setValue(v);
      scheduleApply(v);
      handleHapticTick(v);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      const v = clamp(value - 1, 0, 100);
      setValue(v);
      scheduleApply(v);
      handleHapticTick(v);
    } else if (e.key === "Home") {
      setValue(0);
      scheduleApply(0);
      handleHapticTick(0);
    } else if (e.key === "End") {
      setValue(100);
      scheduleApply(100);
      handleHapticTick(100);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (applyTimer.current !== null) {
        clearTimeout(applyTimer.current);
        applyTimer.current = null;
      }
    };
  }, []);

  const angle = angleFromValue(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={knobRef}
        className="relative select-none"
        style={{
          width: 140,
          height: 140,
          perspective: 600,
          // Prevent page from moving during interaction (Android)
          touchAction: "none",
          overscrollBehavior: "contain"
        }}
      >
        <div
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          className="w-full h-full rounded-full accent-ring"
          style={{
            background: `conic-gradient(from 225deg, var(--accent) ${value}%, #202020 ${value}% 100%)`,
            boxShadow: `inset 0 2px 10px rgba(255,255,255,.05), inset 0 -6px 14px rgba(0,0,0,.6), 0 0 ${12 * (1 + (value / 100) * 0.5)}px color-mix(in oklab, var(--accent) 35%, transparent)`,
            border: "1px solid var(--accent-dim)",
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none"
          }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 6,
              height: 36,
              transformOrigin: "50% 90%",
              transform: `translate(-50%, -90%) rotate(${angle}deg)`,
              background: "var(--accent)",
              borderRadius: 3,
              boxShadow:
                "0 0 8px color-mix(in oklab, var(--accent) 60%, transparent), 0 0 2px rgba(0,0,0,.6)"
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 20,
              height: 20,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,.15), rgba(0,0,0,.6))",
              border: "1px solid var(--accent-dim)"
            }}
          />
        </div>
      </div>
      <div className="text-xs opacity-80">
        {label}: {value}%
      </div>
    </div>
  );
};

export default Knob3D;