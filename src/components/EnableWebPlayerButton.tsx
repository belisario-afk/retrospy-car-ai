import React from "react";
import { initWebPlayback, transferToDevice } from "../lib/spotify/webPlaybackWrapper";
import { SpotifyAPI } from "../lib/spotify/api";

const EnableWebPlayerButton: React.FC = () => {
  const onEnable = async () => {
    // Must be user-initiated to satisfy autoplay policies
    const res = await initWebPlayback();
    if (res.ok) {
      try {
        await transferToDevice(res.deviceId);
        // Optional: start/resume playback on this device
        await SpotifyAPI.play({ device_id: res.deviceId });
      } catch (e) {
        console.warn("Transfer/play failed", e);
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
    >
      Enable in‑browser player
    </button>
  );
};

export default EnableWebPlayerButton;