import React from "react";
import { useAudioFX } from "../lib/audiofx";

const bandLabel = (hz: number) => (hz >= 1000 ? `${hz / 1000}k` : `${hz}`);

const AudioSettings: React.FC = () => {
  const { settings, setSettings, setPreset, presets } = useAudioFX();

  return (
    <section aria-labelledby="audiofx" className="space-y-3 border border-neon-dim rounded p-3">
      <div className="flex items-center justify-between">
        <h2 id="audiofx" className="text-lg">
          Advanced Sound System (EQ)
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      <div className="text-xs opacity-80">
        Note: Due to browser/DRM limits, in-app EQ does not affect Spotify Web Playback. Use your car
        stereo’s EQ or OS audio effects for Bluetooth output. These controls apply to local audio
        sources connected inside the app.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Preset</span>
          <select
            className="bg-black/40 border border-neon-dim rounded p-2"
            value={settings.preset || "Custom"}
            onChange={(e) => setPreset(e.target.value)}
          >
            {Object.keys(presets).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Preamp: {settings.preampDb.toFixed(1)} dB</span>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.1}
            value={settings.preampDb}
            onChange={(e) => setSettings({ preampDb: Number(e.target.value) })}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">
            Balance: {settings.balance < 0 ? `${Math.round(Math.abs(settings.balance) * 100)}% L` : settings.balance > 0 ? `${Math.round(settings.balance * 100)}% R` : "Center"}
          </span>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={settings.balance}
            onChange={(e) => setSettings({ balance: Number(e.target.value) })}
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.compressorEnabled}
            onChange={(e) => setSettings({ compressorEnabled: e.target.checked })}
          />
          <span className="text-sm">Compressor / Loudness</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Crossfade: {settings.crossfadeMs} ms</span>
          <input
            type="range"
            min={0}
            max={8000}
            step={250}
            value={settings.crossfadeMs}
            onChange={(e) => setSettings({ crossfadeMs: Number(e.target.value) })}
          />
        </label>
      </div>

      <div className="mt-2">
        <div className="text-sm mb-1">10-Band Equalizer</div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
          {settings.bands.map((b, idx) => (
            <label key={b.freq} className="flex flex-col items-center gap-1">
              <span className="text-[10px] opacity-70">{bandLabel(b.freq)} Hz</span>
              <input
                type="range"
                min={-12}
                max={12}
                step={0.1}
                value={b.gain}
                onChange={(e) => {
                  const newBands = settings.bands.map((x, i) =>
                    i === idx ? { ...x, gain: Number(e.target.value) } : x
                  );
                  setSettings({ bands: newBands, preset: "Custom" });
                }}
                style={{ writingMode: "vertical-lr" } as React.CSSProperties}
                className="h-28"
              />
              <span className="text-[10px] opacity-70">{b.gain.toFixed(1)} dB</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudioSettings;