import React, { useEffect, useState } from "react";
import SpotifyPlayer from "./components/SpotifyPlayer";
import PlaylistManager from "./components/PlaylistManager";
import EnableWebPlayerButton from "./components/EnableWebPlayerButton";
import { SpotifyAPI } from "./lib/spotify/api";
import type { Device } from "./lib/spotify/types";

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await SpotifyAPI.devices();
        if (active) setDevices(d?.devices || null);
      } catch {
        if (active) setDevices(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">RetroSpy Car AI</h1>
        <EnableWebPlayerButton />
      </div>

      <SpotifyPlayer />

      <PlaylistManager fallbackDevices={devices} />
    </div>
  );
};

export default App;