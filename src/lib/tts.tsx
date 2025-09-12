import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type TTSSettings = {
  voiceURI?: string;
  rate: number;
  pitch: number;
  greeting: string;
};

export type TTSEnvelopeEvent = {
  amplitude: number; // 0..1
};

type TTSContextType = {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  settings: TTSSettings;
  setSettings: (s: Partial<TTSSettings>) => void;
  availableVoices: SpeechSynthesisVoice[];
  envelopeSubscribers: Set<(e: TTSEnvelopeEvent) => void>;
};

const TTSContext = createContext<TTSContextType | null>(null);

const DEFAULT_SETTINGS: TTSSettings = {
  rate: 0.95,
  pitch: 1.0,
  greeting: "Welcome back Mister Belisario."
};

function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<TTSSettings>(() => {
    const stored = localStorage.getItem("retrospy_tts_settings");
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const envelopeSubscribers = useMemo(() => new Set<(e: TTSEnvelopeEvent) => void>(), []);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const ampInterval = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem("retrospy_tts_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!isSpeechAvailable()) return;
    function loadVoices() {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
    }
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const pickDefaultVoice = () => {
    const list = voices;
    // Prefer male/en-US if available
    const preferred = list.find((v) => /en(-|_)US/i.test(v.lang) && /male/i.test(v.name));
    if (preferred) return preferred;
    const en = list.find((v) => /en/i.test(v.lang));
    return en || list[0];
  };

  const setSettings = (s: Partial<TTSSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...s }));
  };

  const startEnvelope = () => {
    stopEnvelope();
    // Simple fake envelope for TTS (approximate mouth movement)
    // Produces gentle random amplitude to drive the mouth visualizer while speech is in progress
    ampInterval.current = window.setInterval(() => {
      const amplitude = Math.max(0, Math.min(1, 0.4 + (Math.random() - 0.5) * 0.6));
      envelopeSubscribers.forEach((cb) => cb({ amplitude }));
    }, 60);
  };
  const stopEnvelope = () => {
    if (ampInterval.current) {
      window.clearInterval(ampInterval.current);
      ampInterval.current = null;
    }
    envelopeSubscribers.forEach((cb) => cb({ amplitude: 0.02 }));
  };

  const speak = async (text: string) => {
    if (isSpeechAvailable()) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice =
        voices.find((v) => v.voiceURI === settings.voiceURI) || pickDefaultVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      return new Promise<void>((resolve) => {
        utterance.onstart = () => startEnvelope();
        utterance.onend = () => {
          stopEnvelope();
          resolve();
        };
        utterance.onerror = () => {
          stopEnvelope();
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    } else {
      // Fallback: play short MP3 phrase from assets (approximation)
      if (!fallbackAudioRef.current) {
        const audio = new Audio(process.env.PUBLIC_URL + "/sounds/welcome_fallback.mp3");
        fallbackAudioRef.current = audio;
      }
      startEnvelope();
      await fallbackAudioRef.current.play().catch(() => {});
      stopEnvelope();
    }
  };

  const value: TTSContextType = {
    speak,
    cancel: () => (isSpeechAvailable() ? window.speechSynthesis.cancel() : undefined),
    settings,
    setSettings,
    availableVoices: voices,
    envelopeSubscribers
  };

  return <TTSContext.Provider value={value}>{children}</TTSContext.Provider>;
};

export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used within TTSProvider");
  return ctx;
}