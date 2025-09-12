import { useEffect, useRef, useState } from "react";

/**
 * Hook that provides a simple amplitude value (0..1) from an HTMLAudioElement.
 * Used in mock mode or for local audio visualization.
 */

type AudioContextCtor = new () => AudioContext;

type WindowWithWebAudio = Window & {
  AudioContext?: AudioContextCtor;
  webkitAudioContext?: AudioContextCtor;
};

export function useAudioAnalyser(audio?: HTMLAudioElement | null) {
  const [amplitude, setAmplitude] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const raf = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!audio) return;

    const w = window as WindowWithWebAudio;
    const AudioCtor = w.AudioContext ?? w.webkitAudioContext;
    if (!AudioCtor) {
      // Browser does not support Web Audio API
      return;
    }

    const ctx = new AudioCtor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    srcRef.current = src;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteTimeDomainData(dataRef.current);
        // compute rough amplitude
        let sum = 0;
        for (let i = 0; i < dataRef.current.length; i++) {
          const v = (dataRef.current[i] - 128) / 128;
          sum += Math.abs(v);
        }
        const avg = sum / dataRef.current.length;
        // smooth
        setAmplitude((prev) => prev * 0.6 + avg * 0.4);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      try {
        src.disconnect();
      } catch {
        // ignore
      }
      try {
        analyser.disconnect();
      } catch {
        // ignore
      }
      ctx.close().catch(() => {});
    };
  }, [audio]);

  return amplitude;
}