import React, { useEffect } from "react";
import MouthVisualizer from "./MouthVisualizer";
import TTSController from "./TTSController";
import { useTTS } from "../lib/tts";

const DashScreen: React.FC = () => {
  const { speak } = useTTS();

  useEffect(() => {
    // Initial greeting is triggered in TTSController as well
    // Here we can trigger auxiliary phrases if desired
  }, [speak]);

  return (
    <div className="grid grid-rows-[auto_auto_1fr] gap-3">
      <div className="text-2xl sm:text-3xl">
        Welcome back <span className="text-neon-green drop-shadow-neon">Mister Belisario</span>
      </div>
      <div className="bg-black/30 border border-neon-dim rounded p-3 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ background: "repeating-linear-gradient(90deg, rgba(57,255,20,.03) 0 2px, transparent 2px 3px)" }} />
        <div className="text-sm opacity-90">
          Retro-future dash: CRT scanlines, glitch transitions, neon green accent. Touch-friendly controls for driving.
        </div>
        <MouthVisualizer />
      </div>
      <TTSController />
    </div>
  );
};

export default DashScreen;