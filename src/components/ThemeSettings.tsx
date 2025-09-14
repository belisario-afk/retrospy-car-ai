import React from "react";
import { useTheme, ThemePresetKey, ThemeMode, BgEffect } from "../lib/theme";

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
    setAnimated,
    bgEffect,
    setBgEffect,
    bgChaser,
    updateBgChaser,
    bgStars,
    updateBgStars,
    bgSunset,
    updateBgSunset
  } = useTheme();

  return (
    <section className="space-y-3 border border-neon-dim rounded p-3">
      <h2 className="text-lg">Theme & Colors</h2>
      <div className="text-xs opacity-80">
        Presets, RGB accent animation, and animated backgrounds like chaser lines or a night sky with twinkling stars.
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
          <input type="color" value={background} onChange={(e) => setColors({ background: e.target.value })} />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Text</span>
          <input type="color" value={foreground} onChange={(e) => setColors({ foreground: e.target.value })} />
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Accent</span>
          <input type="color" value={accent} onChange={(e) => setColors({ accent: e.target.value })} />
        </label>

        {mode === "rainbow" && (
          <>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">RGB speed</span>
              <input type="range" min={1} max={360} step={1} value={rainbowSpeed} onChange={(e) => setRainbowSpeed(Number(e.target.value))} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Animate</span>
              <input type="checkbox" checked={animated} onChange={(e) => setAnimated(e.target.checked)} />
            </label>
          </>
        )}
      </div>

      <div className="border-t border-neon-dim pt-3 space-y-2">
        <h3 className="text-md">Animated Background</h3>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Effect</span>
          <select
            className="bg-black/40 border border-neon-dim rounded p-2"
            value={bgEffect}
            onChange={(e) => setBgEffect(e.target.value as BgEffect)}
          >
            <option value="none">None</option>
            <option value="chaser">Chaser lines</option>
            <option value="stars">Night sky</option>
            <option value="sunset">Sunset gradient</option>
          </select>
        </label>

        {bgEffect === "chaser" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Lines</span>
              <input type="range" min={2} max={72} step={1} value={bgChaser.lineCount} onChange={(e) => updateBgChaser({ lineCount: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Speed</span>
              <input type="range" min={20} max={600} step={5} value={bgChaser.speed} onChange={(e) => updateBgChaser({ speed: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Thickness</span>
              <input type="range" min={1} max={8} step={1} value={bgChaser.thickness} onChange={(e) => updateBgChaser({ thickness: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Angle</span>
              <input type="range" min={-90} max={90} step={1} value={bgChaser.angleDeg} onChange={(e) => updateBgChaser({ angleDeg: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Dash/gap</span>
              <input type="range" min={20} max={180} step={5} value={bgChaser.gap} onChange={(e) => updateBgChaser({ gap: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Glow</span>
              <input type="range" min={0} max={1} step={0.05} value={bgChaser.glow} onChange={(e) => updateBgChaser({ glow: Number(e.target.value) })} />
            </label>
          </div>
        )}

        {bgEffect === "stars" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Density</span>
              <input type="range" min={2} max={18} step={1} value={bgStars.density} onChange={(e) => updateBgStars({ density: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Twinkle</span>
              <input type="range" min={0} max={1} step={0.05} value={bgStars.twinkle} onChange={(e) => updateBgStars({ twinkle: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Twinkle speed</span>
              <input type="range" min={0.2} max={2} step={0.05} value={bgStars.speed} onChange={(e) => updateBgStars({ speed: Number(e.target.value) })} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Shooting chance</span>
              <input type="range" min={0} max={0.1} step={0.005} value={bgStars.shootingChance} onChange={(e) => updateBgStars({ shootingChance: Number(e.target.value) })} />
            </label>
          </div>
        )}

        {bgEffect === "sunset" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Scheme</span>
              <select
                className="bg-black/40 border border-neon-dim rounded p-2"
                value={bgSunset.scheme}
                onChange={(e) => updateBgSunset({ scheme: e.target.value as "night" | "sunset" | "dawn" })}
              >
                <option value="night">Night</option>
                <option value="sunset">Sunset</option>
                <option value="dawn">Dawn</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm">Hue speed</span>
              <input type="range" min={0} max={12} step={0.2} value={bgSunset.speed} onChange={(e) => updateBgSunset({ speed: Number(e.target.value) })} />
            </label>
          </div>
        )}
      </div>
    </section>
  );
};

export default ThemeSettings;