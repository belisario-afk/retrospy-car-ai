import React, { useEffect, useMemo, useRef, useState } from "react";
import { initWebPlayback, transferToDevice, getDevices } from "../lib/spotify/webPlaybackWrapper";
import { SpotifyAPI } from "../lib/spotify/api";
import NowPlaying from "./NowPlaying";
import SearchBar from "./SearchBar";
import PlaylistManager from "./PlaylistManager";
import MouthVisualizer from "./MouthVisualizer";

const SpotifyPlayer: React.FC = () => {
  const [status, setStatus] = useState<"init" | "webplayback" | "fallback" | "error">("init");
  const [message, setMessage] = useState<string>("");
  const playerRef = useRef<Spotify.Player | null>(null);
  const [fallbackDevices, setFallbackDevices] = useState<SpotifyApi.DeviceObject[] | null>(null);
  const [volume, setVolume] = useState<number>(80);
  const [amplitude, setAmplitude] = useState(0.04);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const init = await initWebPlayback();
      if (!mounted) return;
      if (init.ok) {
        playerRef.current = init.player;
        setStatus("webplayback");
        // Transfer playback
        try {
          await transferToDevice(init.deviceId);
        } catch {
          // Likely nothing playing yet; ignore
        }
        init.player.addListener("player_state_changed", (state) => {
          // simple amplitude pulse from progress
          if (state) {
            const p = state.position / Math.max(1, state.duration);
            const amp = 0.08 + 0.1 * Math.sin(p * Math.PI * 2 * 2);
            setAmplitude((prev) => prev * 0.7 + amp * 0.3);
          }
        });
      } else {
        setStatus("fallback");
        setMessage(
          init.requiresPremium
            ? "Spotify Premium is required for in-browser playback (Web Playback SDK). You can still control another device."
            : `Web Playback unavailable: ${init.reason}`
        );
        // Fetch available devices for fallback control
        const devices = await getDevices();
        setFallbackDevices(devices.devices as unknown as SpotifyApi.DeviceObject[]);
      }
    })();
    return () => {
      mounted = false;
      playerRef.current?.disconnect();
    };
  }, []);

  const premiumNote = useMemo(
    () =>
      status === "fallback" ? (
        <div className="text-sm opacity-80 border border-neon-dim rounded p-2">
          {message}
          <div className="mt-2">
            Open Spotify on your phone or another device, start any track, then return here to
            control playback. If no device appears, press play on your phone to wake it up.
          </div>
        </div>
      ) : null,
    [message, status]
  );

  const onVolumeChange = async (v: number) => {
    setVolume(v);
    try {
      await SpotifyAPI.setVolume(v);
    } catch {
      if (playerRef.current) {
        playerRef.current.setVolume(v / 100);
      }
    }
  };

  return (
    <section aria-label="Playback" className="space-y-3">
      {premiumNote}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <NowPlaying
            onPlay={() => SpotifyAPI.play()}
            onPause={() => SpotifyAPI.pause()}
            onNext={() => SpotifyAPI.next()}
            onPrev={() => SpotifyAPI.previous()}
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs opacity-80" htmlFor="vol">
              Volume
            </label>
            <input
              id="vol"
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <MouthVisualizer externalAmplitude={amplitude} />
        </div>
        <div className="space-y-4">
          <SearchBar />
          <PlaylistManager fallbackDevices={fallbackDevices} />
        </div>
      </div>
    </section>
  );
};

export default SpotifyPlayer;