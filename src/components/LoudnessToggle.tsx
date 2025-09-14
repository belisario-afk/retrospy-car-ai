import React, { useMemo } from "react";
import { useLoudness } from "../lib/loudness";

const PillBtn: React.FC<
  React.PropsWithChildren<{ active?: boolean; onClick?: () => void; ariaLabel?: string }>
> = ({ active, onClick, ariaLabel, children }) => (
  <button
    className={`px-3 py-1 rounded-full border border-neon-dim text-sm ${
      active ? "bg-neon-green/20" : "hover:bg-neon-green/10"
    }`}
    onClick={onClick}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);

const LoudnessToggle: React.FC = () => {
  const { mode, autoState, setMode, applyTargetFor, volumeAvailable } = useLoudness();

  const label = useMemo(() => {
    if (mode === "auto") return `Auto (${autoState})`;
    return mode === "city" ? "City" : "Highway";
  }, [mode, autoState]);

  return (
    <div className="flex items-center gap-2" aria-label="Speed adaptive loudness">
      <span className="text-xs opacity-80">{label}</span>
      <div role="group" className="flex gap-1">
        <PillBtn
          active={mode === "city"}
          onClick={async () => {
            setMode("city");
            await applyTargetFor("city");
          }}
          ariaLabel="City mode"
        >
          City
        </PillBtn>
        <PillBtn
          active={mode === "highway"}
          onClick={async () => {
            setMode("highway");
            await applyTargetFor("highway");
          }}
          ariaLabel="Highway mode"
        >
          Hwy
        </PillBtn>
        <PillBtn
          active={mode === "auto"}
          onClick={() => setMode("auto")}
          ariaLabel="Auto mode"
        >
          Auto
        </PillBtn>
      </div>
      {volumeAvailable === false && (
        <span className="text-[10px] opacity-70">(volume control unavailable)</span>
      )}
    </div>
  );
};

export default LoudnessToggle;