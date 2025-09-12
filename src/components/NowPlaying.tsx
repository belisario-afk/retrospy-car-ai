import React, { useEffect, useState } from "react";
import { SpotifyAPI } from "../lib/spotify/api";
import type { CurrentPlayback } from "../lib/spotify/types";

const NowPlaying: React.FC<{
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ onPlay, onPause, onNext, onPrev }) => {
  const [state, setState] = useState<CurrentPlayback | null>(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const st = await SpotifyAPI.playbackState();
        if (active) setState(st);
      } catch {
        // ignore
      } finally {
        if (active) setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      active = false;
    };
  }, []);

  const isPlaying = !!state?.is_playing;
  const track = state?.item as SpotifyApi.TrackObjectFull | undefined;

  return (
    <section aria-label="Now Playing" className="border border-neon-dim rounded p-3">
      <div className="flex items-center gap-3">
        {track?.album?.images?.[1]?.url && (
          <img
            src={track.album.images[1].url}
            alt=""
            className="w-20 h-20 rounded"
            loading="lazy"
          />
        )}
        <div className="flex-1">
          <div className="text-xl">{track?.name || "—"}</div>
          <div className="text-sm opacity-80">
            {(track?.artists || []).map((a) => a.name).join(", ")}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
              onClick={onPrev}
              aria-label="Previous track"
            >
              ◀◀
            </button>
            {isPlaying ? (
              <button
                className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
                onClick={onPause}
                aria-label="Pause"
                title="Playback paused."
              >
                Pause
              </button>
            ) : (
              <button
                className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
                onClick={onPlay}
                aria-label="Play"
                title="Playback started."
              >
                Play
              </button>
            )}
            <button
              className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
              onClick={onNext}
              aria-label="Next track"
            >
              ▶▶
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 h-1 bg-neon-green/30 rounded">
        <div
          className="h-full bg-neon-green rounded"
          style={{
            width:
              state?.progress_ms && track?.duration_ms
                ? `${Math.min(100, (100 * state.progress_ms) / track.duration_ms)}%`
                : "0%"
          }}
        />
      </div>
    </section>
  );
};

export default NowPlaying;