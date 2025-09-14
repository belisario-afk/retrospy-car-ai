import React from "react";
import { useTheme, ThemePresetKey, ThemeMode } from "../lib/theme";

const presets: ThemePresetKey[] = ["Neon Green", "Ice Blue", "Magenta", "Amber", "Cyber Purple", "RGB Rainbow"];

const ThemeSettings: React.FC = () => {
  const {
    preset,
    setPreset,
    mode,
    setMode,
    background,
    foreground,
    accent,
    setColors,
    glow,
    setGlow,
    rainbowSpeed,
    setRainbowSpeed,
    animated,
    setAnimated
  } = useTheme();

  return (
    <section className="space-y-3 border border-neon-dim rounded p-3">
      <h2 className="text-lg">Theme & Colors</h2>
      <div className="text-xs opacity-80">
        Customize the accent color, glow, and enable RGB rainbow mode. Presets instantly apply a look; you can still tweak colors after applying a preset.
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            className={`px-3 py-1 rounded border border-neon-dim ${preset === p ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
            onClick={() => setPreset(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Mode</span>
          <select
            className="bg-black/40 border border-neon-dim rounded p-2"
            value={mode}
            onChange={(e) => setMode(e.target.value as ThemeMode)}
          >
            <option value="solid">Solid</option>
            <option value="gradient" disabled>
              Gradient (coming soon)
            </option>
            <option value="rainbow">Rainbow</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Glow</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={glow}
            onChange={(e) => setGlow(Number(e.target.value))}
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Background</span>
          <input
            type="color"
            value={background}
            onChange={(e) => setColors({ background: e.target.value })}
            aria-label="Pick background color"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Text</span>
          <input
            type="color"
            value={foreground}
            onChange={(e) => setColors({ foreground: e.target.value })}
            aria-label="Pick text color"
          />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setColors({ accent: e.target.value })}
            aria-label="Pick accent color"
          />
        </label>

        {mode === "rainbow" && (
          <>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Rainbow speed</span>
              <input
                type="range"
                min={1}
                max={360}
                step={1}
                value={rainbowSpeed}
                onChange={(e) => setRainbowSpeed(Number(e.target.value))}
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Animate</span>
              <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} />
            </label>
          </>
        )}
      </div>
    </section>
  );
};

export default ThemeSettings;