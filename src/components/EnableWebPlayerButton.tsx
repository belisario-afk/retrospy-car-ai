// Optional helper. Safe to keep or remove from your layout.
// No layout changes are required as Play button now initializes the SDK on demand.
import React from "react";
import { initWebPlayback, transferToDevice } from "../lib/spotify/webPlaybackWrapper";
import { SpotifyAPI } from "../lib/spotify/api";

const EnableWebPlayerButton: React.FC = () => {
  const onEnable = async () => {
    const res = await initWebPlayback();
    if (res.ok) {
      try {
        await transferToDevice(res.deviceId);
        await SpotifyAPI.play({ device_id: res.deviceId });
      } catch {
        // non-fatal
      }
      alert("Browser player enabled. This device is now active in Spotify.");
    } else {
      alert(res.reason || "Failed to initialize Spotify Web Playback SDK");
    }
  };

  return (
    <button
      onClick={onEnable}
      className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
      aria-label="Enable in-browser Spotify player"
      title="Enable in-browser Spotify player"
      type="button"
    >
      Enable in‑browser player
    </button>
  );
};

export default EnableWebPlayerButton;