import React, { useEffect, useState } from "react";
import { useTTS } from "../lib/tts";

const TTSController: React.FC = () => {
  const { availableVoices, settings, setSettings, speak } = useTTS();
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    // Greet on load after small delay
    const t = setTimeout(async () => {
      if (!hasGreeted) {
        await speak(settings.greeting + " All systems ready.");
        setHasGreeted(true);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [hasGreeted, settings.greeting, speak]);

  return (
    <section aria-labelledby="tts-settings" className="space-y-2">
      <h2 id="tts-settings" className="text-neon-green/90 text-lg">
        Voice and Speech
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Voice</span>
          <select
            className="bg-black/40 border border-neon-dim rounded p-2"
            value={settings.voiceURI || ""}
            onChange={(e) => setSettings({ voiceURI: e.target.value || undefined })}
            aria-label="Choose voice"
          >
            <option value="">Auto (Male English preferred)</option>
            {availableVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} — {v.lang}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Rate: {settings.rate.toFixed(2)}</span>
          <input
            type="range"
            min={0.5}
            max={1.3}
            step={0.01}
            value={settings.rate}
            onChange={(e) => setSettings({ rate: Number(e.target.value) })}
            aria-label="Speech rate"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs opacity-80">Pitch: {settings.pitch.toFixed(2)}</span>
          <input
            type="range"
            min={0.7}
            max={1.3}
            step={0.01}
            value={settings.pitch}
            onChange={(e) => setSettings({ pitch: Number(e.target.value) })}
            aria-label="Speech pitch"
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={() => speak("Connected.")}
        >
          Test Voice
        </button>
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={() => speak(settings.greeting)}
        >
          Play Greeting
        </button>
      </div>
    </section>
  );
};

export default TTSController;