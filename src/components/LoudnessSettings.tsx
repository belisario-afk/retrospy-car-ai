import React from "react";
import { useLoudness } from "../lib/loudness";

const Row: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label className="flex items-center justify-between gap-3">
    <span className="text-sm opacity-80">{label}</span>
    <div className="flex items-center gap-2">{children}</div>
  </label>
);

const LoudnessSettings: React.FC = () => {
  const {
    mode,
    setMode,
    cityPercent,
    highwayPercent,
    setCityPercent,
    setHighwayPercent,
    rampMs,
    setRampMs,
    throttleMs,
    setThrottleMs,
    autoEnterMph,
    autoExitMph,
    setAutoThresholds,
    applyTargetFor
  } = useLoudness();

  return (
    <section className="space-y-3 border border-neon-dim rounded p-3">
      <h2 className="text-lg">Speed‑Adaptive Loudness</h2>
      <div className="text-xs opacity-80">
        Adjusts Spotify device volume for City/Highway. Auto mode switches based on GPS speed with
        hysteresis. If remote volume isn’t supported by your device, the toggle still works but volume
        may not change remotely.
      </div>

      <div className="flex gap-2">
        <button
          className={`px-3 py-1 rounded border border-neon-dim ${mode === "city" ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
          onClick={async () => {
            setMode("city");
            await applyTargetFor("city");
          }}
        >
          City
        </button>
        <button
          className={`px-3 py-1 rounded border border-neon-dim ${mode === "highway" ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
          onClick={async () => {
            setMode("highway");
            await applyTargetFor("highway");
          }}
        >
          Highway
        </button>
        <button
          className={`px-3 py-1 rounded border border-neon-dim ${mode === "auto" ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
          onClick={() => setMode("auto")}
        >
          Auto
        </button>
      </div>

      <Row label={`City volume: ${cityPercent}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cityPercent}
          onChange={(e) => setCityPercent(Number(e.target.value))}
        />
        <button
          className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={() => applyTargetFor("city")}
        >
          Test
        </button>
      </Row>

      <Row label={`Highway volume: ${highwayPercent}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={highwayPercent}
          onChange={(e) => setHighwayPercent(Number(e.target.value))}
        />
        <button
          className="px-2 py-1 text-xs border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={() => applyTargetFor("highway")}
        >
          Test
        </button>
      </Row>

      <Row label={`Ramp: ${rampMs} ms`}>
        <input
          type="range"
          min={0}
          max={2000}
          step={50}
          value={rampMs}
          onChange={(e) => setRampMs(Number(e.target.value))}
        />
      </Row>

      <Row label={`Throttle: ${throttleMs} ms`}>
        <input
          type="range"
          min={250}
          max={3000}
          step={50}
          value={throttleMs}
          onChange={(e) => setThrottleMs(Number(e.target.value))}
        />
      </Row>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Auto: enter highway at (mph)</span>
          <input
            type="number"
            className="bg-black/40 border border-neon-dim rounded p-2"
            min={1}
            value={autoEnterMph}
            onChange={(e) => setAutoThresholds(Number(e.target.value), autoExitMph)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Auto: exit highway at (mph)</span>
          <input
            type="number"
            className="bg-black/40 border border-neon-dim rounded p-2"
            min={0}
            value={autoExitMph}
            onChange={(e) => setAutoThresholds(autoEnterMph, Number(e.target.value))}
          />
        </label>
      </div>
    </section>
  );
};

export default LoudnessSettings;