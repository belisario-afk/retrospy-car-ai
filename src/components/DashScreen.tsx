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
        // Duck Spotify during TTS so the greeting is crystal clear
        void duckDuring(() => speak(text), { targetPercent: 25, restorePercent: 65, rampMs: 250 });
        sessionStorage.setItem(key, "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [speak, settings.greeting]);

  return (
    <div className="grid grid-rows-[1fr] gap-3">
      <div className="bg-black/30 border border-neon-dim rounded p-3 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(57,255,20,.03) 0 2px, transparent 2px 3px)"
          }}
        />
        <MouthVisualizer />
      </div>
    </div>
  );
};

export default DashScreen;