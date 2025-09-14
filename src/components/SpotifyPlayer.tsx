import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";

type Track = {
  id?: string;
  name: string;
  artists: string[];
  albumArt: string | null;
  durationMs: number;
};

type Playback = {
  isPlaying: boolean;
  positionMs: number;
  track: Track | null;
};

type SpotifyImage = { url?: string };
type SpotifyArtist = { name?: string };
type SpotifyItem = {
  id?: string;
  name?: string;
  duration_ms?: number;
  album?: { images?: SpotifyImage[] };
  images?: SpotifyImage[];
  artists?: SpotifyArtist[];
};
type SpotifyPlaybackState = {
  is_playing?: boolean;
  progress_ms?: number;
  item?: SpotifyItem | null;
  track?: SpotifyItem | null;
  currently_playing?: SpotifyItem | null;
};

const VIB_MS = 18;

function vibrate(ms = VIB_MS) {
  try {
    if ("vibrate" in navigator) navigator.vibrate?.(ms);
  } catch {
    // ignore vibrate errors
  }
}

function formatTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const useRafProgress = (playing: boolean, startMs: number, durationMs: number) => {
  const [pos, setPos] = useState(startMs);
  const posRef = useRef(startMs);
  const playRef = useRef(playing);
  const lastRef = useRef<number>(0);
  const durRef = useRef(durationMs);

  useEffect(() => {
    posRef.current = startMs;
    setPos(startMs);
  }, [startMs]);

  useEffect(() => {
    playRef.current = playing;
  }, [playing]);

  useEffect(() => {
    durRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    let raf: number | null = null;
    const step = (ts: number) => {
      const last = lastRef.current || ts;
      lastRef.current = ts;
      if (playRef.current) {
        const dt = ts - last;
        const next = Math.min(durRef.current, posRef.current + dt);
        posRef.current = next;
        setPos(next);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return pos;
};

const Icon = {
  Prev: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M6 6h2v12H6zM20 6v12L9 12l11-6z" />
    </svg>
  ),
  Play: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Pause: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  ),
  Next: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M16 6h2v12h-2zM4 6l11 6L4 18z" />
    </svg>
  ),
  Volume: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      <path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4.03v8.06A4.5 4.5 0 0016.5 12zm0-8.5v3a8 8 0 010 11v3c5-2.1 8-7.1 8-11.5S21.5 5.6 16.5 3.5z" />
    </svg>
  )
};

const SpotifyPlayer: React.FC = () => {
  const [playback, setPlayback] = useState<Playback>({ isPlaying: false, positionMs: 0, track: null });
  const [volume, setVolume] = useState<number>(65);
  const [seeking, setSeeking] = useState<boolean>(false);
  const [seekPos, setSeekPos] = useState<number>(0);
  const applyVolTimer = useRef<number | null>(null);
  const pollTimer = useRef<number | null>(null);

  const duration = playback.track?.durationMs ?? 0;
  const livePos = useRafProgress(playback.isPlaying && !seeking, playback.positionMs, duration);
  const uiPos = seeking ? seekPos : livePos;

  const percent = useMemo(() => (duration > 0 ? Math.min(100, Math.max(0, (uiPos / duration) * 100)) : 0), [duration, uiPos]);

  // Poll Spotify for current state
  const fetchState = useCallback(async () => {
    try {
      const s = (await SpotifyAPI.playbackState()) as SpotifyPlaybackState | null;
      if (!s) return;

      const item: SpotifyItem | null = s.item ?? s.track ?? s.currently_playing ?? null;

      const images: SpotifyImage[] = item?.album?.images ?? item?.images ?? [];
      const art = images?.[0]?.url ?? images?.[1]?.url ?? null;

      const artists: string[] = Array.isArray(item?.artists)
        ? (item!.artists as SpotifyArtist[]).map((a) => a.name ?? "").filter(Boolean)
        : [];

      const track: Track | null = item
        ? {
            id: item.id,
            name: item.name || "Unknown",
            artists,
            albumArt: art,
            durationMs: item.duration_ms ?? 0
          }
        : null;

      setPlayback({
        isPlaying: Boolean(s.is_playing),
        positionMs: s.progress_ms || 0,
        track
      });
    } catch {
      // ignore transient API errors while polling
    }
  }, []);

  useEffect(() => {
    void fetchState();
    if (pollTimer.current !== null) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    // Poll every 2.5s to stay in sync with remote actions
    pollTimer.current = window.setInterval(fetchState, 2500);
    return () => {
      if (pollTimer.current !== null) clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
  }, [fetchState]);

  // Button actions
  const doPrev = useCallback(async () => {
    vibrate();
    try {
      await SpotifyAPI.previous();
      await fetchState();
    } catch {
      // ignore previous() failures (e.g., start of queue)
    }
  }, [fetchState]);

  const doNext = useCallback(async () => {
    vibrate();
    try {
      await SpotifyAPI.next();
      await fetchState();
    } catch {
      // ignore next() failures
    }
  }, [fetchState]);

  const doToggle = useCallback(async () => {
    vibrate();
    try {
      if (playback.isPlaying) {
        await SpotifyAPI.pause();
      } else {
        await SpotifyAPI.play();
      }
      await fetchState();
    } catch {
      // ignore toggle failures
    }
  }, [fetchState, playback.isPlaying]);

  // Volume control (gentle throttle)
  const applyVolume = useCallback((v: number) => {
    if (applyVolTimer.current !== null) {
      clearTimeout(applyVolTimer.current);
      applyVolTimer.current = null;
    }
    applyVolTimer.current = window.setTimeout(() => {
      void SpotifyAPI.setVolume(v).catch(() => {
        // ignore volume set errors
      });
    }, 100);
  }, []);

  const onVolume = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Math.max(0, Math.min(100, Number(e.target.value)));
      setVolume(v);
      applyVolume(v);
    },
    [applyVolume]
  );

  // Seek handling with multiple wrapper-name fallbacks
  type SeekLikeAPI = {
    seek?: (positionMs: number) => Promise<unknown>;
    seekToPosition?: (positionMs: number) => Promise<unknown>;
    seekPosition?: (positionMs: number) => Promise<unknown>;
    play: (opts?: { position_ms?: number }) => Promise<unknown>;
  };

  const onSeekStart = useCallback(() => {
    setSeeking(true);
    setSeekPos(livePos);
    vibrate();
  }, [livePos]);

  const onSeekChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      const ms = Math.round((v / 100) * duration);
      setSeekPos(ms);
    },
    [duration]
  );

  const onSeekCommit = useCallback(async () => {
    setSeeking(false);
    try {
      const api = SpotifyAPI as unknown as SeekLikeAPI;
      if (typeof api.seek === "function") {
        await api.seek(seekPos);
      } else if (typeof api.seekToPosition === "function") {
        await api.seekToPosition(seekPos);
      } else if (typeof api.seekPosition === "function") {
        await api.seekPosition(seekPos);
      } else {
        // Fallback: use play with position_ms
        await api.play({ position_ms: seekPos });
      }
      await fetchState();
    } catch {
      // ignore seek errors
    }
  }, [seekPos, fetchState]);

  const title = playback.track?.name || "Nothing playing";
  const artistsText = playback.track?.artists?.join(", ") || "—";
  const art = playback.track?.albumArt;

  // Accent fallback
  const accent = useMemo(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    return v || "#39ff14";
  }, []);

  return (
    <section
      className="relative rounded-lg border border-neon-dim bg-black/35 overflow-hidden"
      style={{
        boxShadow: "0 0 24px color-mix(in oklab, var(--accent) 18%, transparent)"
      }}
      role="region"
      aria-label="Playback controller"
    >
      {/* Glow strip */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          filter: "blur(0.2px)"
        }}
      />

      <div className="grid grid-cols-[112px,1fr] gap-3 p-3 md:grid-cols-[144px,1fr] md:p-4">
        {/* Album art */}
        <div className="relative aspect-square rounded overflow-hidden border border-neon-dim bg-black/50">
          {art ? (
            <img src={art} alt="" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full grid place-items-center text-xs opacity-60">No art</div>
          )}
          {/* Art glow */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 24px color-mix(in oklab, var(--accent) 25%, transparent)" }}
          />
        </div>

        {/* Meta + controls */}
        <div className="flex flex-col gap-3 justify-between">
          <div className="min-h-[44px]">
            <div className="text-[17px] md:text-[18px] leading-tight truncate" title={title}>
              {title}
            </div>
            <div className="text-xs opacity-80 truncate" title={artistsText}>
              {artistsText}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] opacity-80 w-[42px] text-right tabular-nums">{formatTime(uiPos)}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={percent}
              onMouseDown={onSeekStart}
              onTouchStart={onSeekStart}
              onChange={onSeekChange}
              onMouseUp={onSeekCommit}
              onTouchEnd={onSeekCommit}
              className="flex-1"
              style={{
                WebkitAppearance: "none",
                appearance: "none",
                height: 8,
                borderRadius: 999,
                background: `linear-gradient(90deg, var(--accent) ${percent}%, #202020 ${percent}%)`,
                outline: "none",
                boxShadow: "inset 0 1px 6px rgba(0,0,0,.6), 0 0 10px color-mix(in oklab, var(--accent) 20%, transparent)"
              }}
              aria-label="Seek"
            />
            <span className="text-[11px] opacity-80 w-[42px] tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                className="h-11 w-11 rounded-full grid place-items-center border border-neon-dim hover:bg-neon-green/10 active:scale-[0.98]"
                onClick={doPrev}
                aria-label="Previous"
              >
                <Icon.Prev width={22} height={22} />
              </button>
              <button
                className="h-12 w-12 rounded-full grid place-items-center border border-neon-dim hover:bg-neon-green/10 active:scale-[0.98]"
                onClick={doToggle}
                aria-label={playback.isPlaying ? "Pause" : "Play"}
                style={{
                  boxShadow: "0 0 14px color-mix(in oklab, var(--accent) 22%, transparent)"
                }}
              >
                {playback.isPlaying ? <Icon.Pause width={24} height={24} /> : <Icon.Play width={24} height={24} />}
              </button>
              <button
                className="h-11 w-11 rounded-full grid place-items-center border border-neon-dim hover:bg-neon-green/10 active:scale-[0.98]"
                onClick={doNext}
                aria-label="Next"
              >
                <Icon.Next width={22} height={22} />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 min-w-[160px]">
              <Icon.Volume width={18} height={18} />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                onChange={onVolume}
                aria-label="Volume"
                style={{
                  WebkitAppearance: "none",
                  appearance: "none",
                  height: 6,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, var(--accent) ${volume}%, #202020 ${volume}%)`,
                  outline: "none",
                  width: 160
                }}
              />
              <span className="text-[11px] opacity-80 tabular-nums w-[28px] text-right">{volume}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpotifyPlayer;