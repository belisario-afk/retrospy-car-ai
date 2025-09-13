import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type EQBand = {
  freq: number; // Hz
  gain: number; // dB
  type?: BiquadFilterType; // default "peaking"
  q?: number; // default 1.0
};

export type AudioFXSettings = {
  enabled: boolean;
  preampDb: number; // overall gain
  balance: number; // -1 left, 0 center, +1 right
  compressorEnabled: boolean;
  compressor: {
    threshold: number; // dB
    knee: number;
    ratio: number;
    attack: number; // seconds
    release: number; // seconds
  };
  loudnessNormalization: boolean; // placeholder flag, uses compressor defaults
  crossfadeMs: number; // future use
  bands: EQBand[]; // 10-band
  preset?: string;
};

type AudioFXContextType = {
  settings: AudioFXSettings;
  setSettings: (s: Partial<AudioFXSettings>) => void;
  setPreset: (name: string) => void;
  presets: Record<string, AudioFXSettings>;
  connectSource: (el: HTMLAudioElement) => MediaElementAudioSourceNode | null;
  audioContext: AudioContext | null;
};

const STORAGE_KEY = "retrospy_audiofx";

const DEFAULT_BANDS: EQBand[] = [
  { freq: 31, gain: 0, q: 1, type: "peaking" },
  { freq: 62, gain: 0, q: 1, type: "peaking" },
  { freq: 125, gain: 0, q: 1, type: "peaking" },
  { freq: 250, gain: 0, q: 1, type: "peaking" },
  { freq: 500, gain: 0, q: 1, type: "peaking" },
  { freq: 1000, gain: 0, q: 1, type: "peaking" },
  { freq: 2000, gain: 0, q: 1, type: "peaking" },
  { freq: 4000, gain: 0, q: 1, type: "peaking" },
  { freq: 8000, gain: 0, q: 1, type: "peaking" },
  { freq: 16000, gain: 0, q: 1, type: "peaking" }
];

const FLAT: AudioFXSettings = {
  enabled: true,
  preampDb: 0,
  balance: 0,
  compressorEnabled: false,
  compressor: { threshold: -24, knee: 30, ratio: 12, attack: 0.003, release: 0.25 },
  loudnessNormalization: false,
  crossfadeMs: 0,
  bands: DEFAULT_BANDS.map((b) => ({ ...b, gain: 0 })),
  preset: "Flat"
};

const CAR: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => {
    if (b.freq <= 62) return { ...b, gain: 3 };
    if (b.freq >= 8000) return { ...b, gain: 3 };
    return { ...b, gain: 0 };
  }),
  preset: "Car"
};

const VOCAL_BOOST: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => {
    if (b.freq === 1000 || b.freq === 2000 || b.freq === 4000) return { ...b, gain: 3.5 };
    if (b.freq <= 62) return { ...b, gain: -1.5 };
    return b;
  }),
  preset: "Vocal Boost"
};

const BASS_BOOST: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => (b.freq <= 125 ? { ...b, gain: 5 } : { ...b, gain: 0 })),
  preset: "Bass Boost"
};

const TREBLE_BOOST: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => (b.freq >= 8000 ? { ...b, gain: 5 } : { ...b, gain: 0 })),
  preset: "Treble Boost"
};

const LOUDNESS: AudioFXSettings = {
  ...FLAT,
  compressorEnabled: true,
  loudnessNormalization: true,
  bands: DEFAULT_BANDS.map((b) => {
    // A rough ISO 226 style low volume correction: mild U-curve
    if (b.freq <= 125) return { ...b, gain: 2.5 };
    if (b.freq >= 8000) return { ...b, gain: 2.5 };
    return b;
  }),
  preset: "Loudness"
};

const ACOUSTIC: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => {
    if (b.freq === 4000 || b.freq === 8000) return { ...b, gain: 2.5 };
    if (b.freq === 250) return { ...b, gain: -1.5 };
    return b;
  }),
  preset: "Acoustic"
};

const ELECTRONIC: AudioFXSettings = {
  ...FLAT,
  bands: DEFAULT_BANDS.map((b) => {
    if (b.freq <= 125) return { ...b, gain: 4 };
    if (b.freq >= 8000) return { ...b, gain: 2 };
    return b;
  }),
  preset: "Electronic"
};

const PRESETS: Record<string, AudioFXSettings> = {
  Flat: FLAT,
  Car: CAR,
  "Vocal Boost": VOCAL_BOOST,
  "Bass Boost": BASS_BOOST,
  "Treble Boost": TREBLE_BOOST,
  Loudness: LOUDNESS,
  Acoustic: ACOUSTIC,
  Electronic: ELECTRONIC
};

const AudioFXContext = createContext<AudioFXContextType | null>(null);

function getAudioContextCtor(): typeof AudioContext {
  if (typeof window !== "undefined") {
    if ("AudioContext" in window && window.AudioContext) {
      return window.AudioContext as typeof AudioContext;
    }
    const w = window as Window & { webkitAudioContext?: typeof AudioContext };
    if (w.webkitAudioContext) return w.webkitAudioContext;
  }
  throw new Error("Web Audio API not supported in this environment");
}

export const AudioFXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AudioFXSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...FLAT, ...JSON.parse(stored) } : CAR;
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const nodeGraph = useRef<{
    inputL: GainNode | null;
    inputR: GainNode | null;
    merger: ChannelMergerNode | null;
    splitter: ChannelSplitterNode | null;
    preamp: GainNode | null;
    filters: BiquadFilterNode[]; // EQ filters
    compressor: DynamicsCompressorNode | null;
    output: GainNode | null;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const ensureContext = useCallback(() => {
    if (!audioContextRef.current) {
      const Ctor = getAudioContextCtor();
      audioContextRef.current = new Ctor();
    }
    return audioContextRef.current!;
  }, []);

  const rebuildGraph = () => {
    const ac = ensureContext();

    // Disconnect old graph if present
    if (nodeGraph.current) {
      try {
        nodeGraph.current.output?.disconnect();
      } catch (e) {
        // Non-fatal: graph might already be disconnected
        // eslint-disable-next-line no-console
        console.debug("AudioFX: previous graph disconnect ignored", e);
      }
    }

    // Build core path
    const splitter = ac.createChannelSplitter(2);
    const inputL = ac.createGain();
    const inputR = ac.createGain();
    const merger = ac.createChannelMerger(2);
    const preamp = ac.createGain();
    const compressor = ac.createDynamicsCompressor();
    const output = ac.createGain();

    // Balance: map [-1, +1] to L/R gains
    const bal = Math.max(-1, Math.min(1, settings.balance));
    inputL.gain.value = bal <= 0 ? 1 : 1 - bal; // reduce L when biasing right
    inputR.gain.value = bal >= 0 ? 1 : 1 + bal; // reduce R when biasing left

    // Preamp (convert dB to linear)
    preamp.gain.value = Math.pow(10, settings.preampDb / 20);

    // Compressor setup
    compressor.threshold.value = settings.compressor.threshold;
    compressor.knee.value = settings.compressor.knee;
    compressor.ratio.value = settings.compressor.ratio;
    compressor.attack.value = settings.compressor.attack;
    compressor.release.value = settings.compressor.release;

    // Filters: series chain
    const filters: BiquadFilterNode[] = settings.bands.map((b) => {
      const f = ac.createBiquadFilter();
      f.type = b.type || "peaking";
      f.frequency.value = b.freq;
      f.Q.value = b.q ?? 1.0;
      f.gain.value = b.gain;
      return f;
    });

    // Wire filter chain: preamp -> f1 -> f2 -> ... -> (compressor?) -> output
    let lastNode: AudioNode = preamp;
    for (const f of filters) {
      lastNode.connect(f);
      lastNode = f;
    }
    if (settings.compressorEnabled || settings.loudnessNormalization) {
      lastNode.connect(compressor);
      compressor.connect(output);
    } else {
      lastNode.connect(output);
    }
    output.connect(ac.destination);

    nodeGraph.current = {
      inputL,
      inputR,
      splitter,
      merger,
      preamp,
      filters,
      compressor,
      output
    };
  };

  useEffect(() => {
    // Create or update graph on settings changes
    rebuildGraph();

    // Update node parameters
    if (nodeGraph.current) {
      nodeGraph.current.preamp!.gain.value = Math.pow(10, settings.preampDb / 20);
      nodeGraph.current.inputL!.gain.value = settings.balance <= 0 ? 1 : 1 - settings.balance;
      nodeGraph.current.inputR!.gain.value = settings.balance >= 0 ? 1 : 1 + settings.balance;
      nodeGraph.current.filters.forEach((f, i) => {
        const b = settings.bands[i];
        if (b) {
          f.frequency.value = b.freq;
          f.gain.value = b.gain;
          f.Q.value = b.q ?? 1.0;
          f.type = b.type || "peaking";
        }
      });
      if (nodeGraph.current.compressor) {
        nodeGraph.current.compressor.threshold.value = settings.compressor.threshold;
        nodeGraph.current.compressor.knee.value = settings.compressor.knee;
        nodeGraph.current.compressor.ratio.value = settings.compressor.ratio;
        nodeGraph.current.compressor.attack.value = settings.compressor.attack;
        nodeGraph.current.compressor.release.value = settings.compressor.release;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(settings)]);

  const setSettings = (s: Partial<AudioFXSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...s, bands: s.bands ? [...s.bands] : prev.bands }));
  };

  const setPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setSettingsState((prev) => ({ ...prev, ...p, preset: name }));
  };

  const connectSource = useCallback(
    (el: HTMLAudioElement) => {
      try {
        const ac = ensureContext();
        // Important: Spotify Web Playback SDK audio is DRM-protected; cannot be tapped here.
        // This is for non-DRM HTMLAudioElements only.
        const src = ac.createMediaElementSource(el);

        // Build per-source processing: panner -> preamp -> EQ series -> (compressor?) -> destination
        const panner = ac.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, settings.balance));

        const preamp = ac.createGain();
        preamp.gain.value = Math.pow(10, settings.preampDb / 20);

        // Build EQ series
        let tail: AudioNode = preamp;
        for (const b of settings.bands) {
          const f = ac.createBiquadFilter();
          f.type = b.type || "peaking";
          f.frequency.value = b.freq;
          f.Q.value = b.q ?? 1.0;
          f.gain.value = b.gain;
          tail.connect(f);
          tail = f;
        }

        // Optionally add a compressor
        if (settings.compressorEnabled || settings.loudnessNormalization) {
          const comp = ac.createDynamicsCompressor();
          comp.threshold.value = settings.compressor.threshold;
          comp.knee.value = settings.compressor.knee;
          comp.ratio.value = settings.compressor.ratio;
          comp.attack.value = settings.compressor.attack;
          comp.release.value = settings.compressor.release;
          tail.connect(comp);
          comp.connect(ac.destination);
        } else {
          tail.connect(ac.destination);
        }

        // Source routing
        src.connect(panner);
        panner.connect(preamp);

        return src;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("connectSource failed (likely due to DRM or context state):", e);
        return null;
      }
    },
    [ensureContext, settings]
  );

  const value = useMemo<AudioFXContextType>(
    () => ({
      settings,
      setSettings,
      setPreset,
      presets: PRESETS,
      connectSource,
      audioContext: audioContextRef.current
    }),
    [settings, connectSource]
  );

  return <AudioFXContext.Provider value={value}>{children}</AudioFXContext.Provider>;
};

export function useAudioFX(): AudioFXContextType {
  const ctx = useContext(AudioFXContext);
  if (!ctx) throw new Error("useAudioFX must be used within AudioFXProvider");
  return ctx;
}