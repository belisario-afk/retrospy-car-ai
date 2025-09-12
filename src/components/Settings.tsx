import React from "react";
import TTSController from "./TTSController";

const Settings: React.FC = () => {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-lg">Appearance</h2>
        <div className="text-sm opacity-80">
          Retro green-on-black theme is default. A light configuration mode is available by browser
          accessibility tools. High contrast is preserved.
        </div>
      </section>
      <TTSController />
      <section aria-labelledby="bt-guide" className="space-y-2">
        <h2 id="bt-guide" className="text-lg">
          Device Pairing (Bluetooth)
        </h2>
        <ol className="list-decimal list-inside opacity-90 space-y-1 text-sm">
          <li>Open your tablet’s Bluetooth settings and pair with your car stereo.</li>
          <li>Set the car stereo as the default audio output device in the OS.</li>
          <li>
            If using Spotify Connect (phone playback), route audio to the car stereo from your
            phone, or switch to the car stereo device in Spotify.
          </li>
        </ol>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg">Debug</h2>
        <button
          className="px-3 py-1 border border-neon-dim rounded hover:bg-neon-green/10"
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
        >
          Clear local storage (logout/reset)
        </button>
      </section>
    </div>
  );
};

export default Settings;