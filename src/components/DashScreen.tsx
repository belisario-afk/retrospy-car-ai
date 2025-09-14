import React, { useEffect } from "react";
import MouthVisualizer from "./MouthVisualizer";
import { useTTS } from "../lib/tts";
import { duckDuring } from "../lib/ducking";

const DashScreen: React.FC = () => {
  const { speak, settings } = useTTS();

  useEffect(() => {
    // Greet once per session on Dash load
    const key = "retrospy:greeted";
    const has = sessionStorage.getItem(key) === "1";
    if (!has) {
      const t = setTimeout(() => {
        const text = settings.greeting || "Welcome back Mister Belisario.";
        void duckDuring(() => speak(text), { targetPercent: 25, restorePercent: 65, rampMs: 250 });
        sessionStorage.setItem(key, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [speak, settings.greeting]);

  return (
    <div className="bg-black/30 border border-neon-dim rounded p-3 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "repeating-linear-gradient(90deg, color-mix(in oklab, var(--accent) 15%, transparent) 0 2px, transparent 2px 3px)"
        }}
      />
      <MouthVisualizer />
    </div>
  );
};

export default DashScreen;