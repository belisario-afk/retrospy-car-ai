import React, { useEffect, useState } from "react";
import { useTTS } from "../lib/tts";

type Props = {
  externalAmplitude?: number; // 0..1
  height?: number;
  width?: number;
};

const MouthVisualizer: React.FC<Props> = ({ externalAmplitude, height = 18, width = 160 }) => {
  const { envelopeSubscribers } = useTTS();
  const [amp, setAmp] = useState(0.03);

  useEffect(() => {
    const sub = (e: { amplitude: number }) => setAmp((prev) => prev * 0.6 + e.amplitude * 0.4);
    envelopeSubscribers.add(sub);
    return () => {
      envelopeSubscribers.delete(sub);
    };
  }, [envelopeSubscribers]);

  const amplitude = externalAmplitude !== undefined ? externalAmplitude : amp;
  const lineThickness = Math.max(2, Math.floor(amplitude * height));

  return (
    <div
      role="img"
      aria-label="AI mouth visualizer"
      className="mx-auto my-2"
      style={{ width, height }}
    >
      <div
        className="bg-neon-green transition-all duration-50 rounded-full"
        style={{
          height: lineThickness,
          width: "100%",
          boxShadow: "0 0 12px rgba(57,255,20,.6)"
        }}
      />
    </div>
  );
};

export default MouthVisualizer;