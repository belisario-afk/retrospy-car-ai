import React, { useEffect, useRef } from "react";
import { useLoudness } from "../lib/loudness";
import { useAudioFX } from "../lib/audiofx";

// Convert meters/second to mph
const MPS_TO_MPH = 2.2369362920544;

const SpeedLoudnessController: React.FC = () => {
  const {
    mode,
    setMode,
    cityPercent,
    highwayPercent,
    autoEnterMph,
    autoExitMph,
    speedMph,
    setSpeedMph,
    applyTargetFor
  } = useLoudness();
  const { settings: fx, setSettings } = useAudioFX();

  const watchIdRef = useRef<number | null>(null);
  const lastAutoRef = useRef<"city" | "highway">("city");

  // GPS watch for Auto mode
  useEffect(() => {
    if (mode !== "auto") {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const sp = pos.coords.speed; // m/s (may be null)
          if (sp == null || Number.isNaN(sp)) return;
          setSpeedMph(sp * MPS_TO_MPH);
        },
        () => {
          // Denied or unavailable; fall back to manual
          setMode("city");
        },
        { enableHighAccuracy: false, maximumAge: 3000, timeout: 5000 }
      );
    } catch {
      setMode("city");
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [mode, setMode, setSpeedMph]);

  // Auto mode decision + apply
  useEffect(() => {
    if (mode !== "auto") return;
    const mph = speedMph;
    if (mph == null) return;

    if (lastAutoRef.current === "city" && mph >= autoEnterMph) {
      lastAutoRef.current = "highway";
      void applyTargetFor("highway");
      // Nudge AudioFX preamp slightly up in highway for non-DRM sources
      setSettings({ preampDb: Math.min(12, (fx.preampDb || 0) + 1.5) });
    } else if (lastAutoRef.current === "highway" && mph <= autoExitMph) {
      lastAutoRef.current = "city";
      void applyTargetFor("city");
      setSettings({ preampDb: Math.max(-12, (fx.preampDb || 0) - 1.5) });
    }
  }, [mode, speedMph, autoEnterMph, autoExitMph, applyTargetFor, setSettings, fx.preampDb]);

  // Manual mode: when switching City/Highway, apply target and set sensible preamp nudge
  useEffect(() => {
    if (mode === "city") {
      void applyTargetFor("city");
      // Set preamp closer to neutral for city
      if (fx.preampDb > 0) setSettings({ preampDb: fx.preampDb - Math.min(1.5, fx.preampDb) });
    } else if (mode === "highway") {
      void applyTargetFor("highway");
      if (fx.preampDb < 12) setSettings({ preampDb: Math.min(12, fx.preampDb + 1.5) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cityPercent, highwayPercent]);

  return null;
};

export default SpeedLoudnessController;