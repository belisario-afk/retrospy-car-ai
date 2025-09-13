import React from "react";
import MouthVisualizer from "./MouthVisualizer";

const DashScreen: React.FC = () => {
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