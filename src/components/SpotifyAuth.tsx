import React, { useEffect, useState } from "react";
import { usePKCE } from "../hooks/usePKCE";
import { getStoredToken } from "../lib/spotify/api";

const SpotifyAuth: React.FC<{ onAuthed: () => void }> = ({ onAuthed }) => {
  const { startLogin } = usePKCE();
  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    setConnecting(false);
    if (token) onAuthed();
  }, [onAuthed]);

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="text-3xl mb-4">RetroSpy Car AI</div>
        <div className="animate-pulse text-neon-green/80">Connecting…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-6">
      <div className="text-3xl drop-shadow-neon">RetroSpy Car AI</div>
      <p className="max-w-md opacity-90">
        Sign in to Spotify to enable playback and remote control. Playback inside the browser requires a Spotify Premium account. If you do not have Premium,
        you can still control another Spotify device (e.g., your phone) using this dashboard.
      </p>
      <button
        className="px-6 py-3 border border-neon-dim rounded hover:bg-neon-green/10 text-xl"
        onClick={() => startLogin()}
        aria-label="Sign in to Spotify"
      >
        Sign in to Spotify
      </button>
      <div className="text-xs opacity-75 max-w-md">
        This app uses the Authorization Code with PKCE flow. No client secret is stored in the browser.
      </div>
    </div>
  );
};

export default SpotifyAuth;