import React from "react";
import { useTTS } from "../lib/tts";

type Props = {
  currentRoute: "dash" | "settings" | "bezel" | "callback" | "connect";
  authed: boolean;
  onNavigate: (route: Props["currentRoute"]) => void;
};

const AppShell: React.FC<Props> = ({ currentRoute, onNavigate, authed }) => {
  const { settings } = useTTS();

  return (
    <header
      className="w-full px-4 py-3 sm:px-6 sticky top-0 bg-black/60 backdrop-blur z-20 border-b border-neon-dim"
      role="banner"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div
          className="text-2xl sm:text-3xl text-neon-green drop-shadow-neon glitch select-none"
          aria-label="RetroSpy Car AI"
        >
          RetroSpy Car AI
        </div>
        <nav aria-label="Main" className="flex gap-2 sm:gap-3">
          <button
            className={`px-3 py-1 rounded border border-neon-dim hover:bg-neon-green/10 ${
              currentRoute === "dash" ? "bg-neon-green/20" : ""
            }`}
            onClick={() => onNavigate("dash")}
          >
            Dash
          </button>
          <button
            className={`px-3 py-1 rounded border border-neon-dim hover:bg-neon-green/10 ${
              currentRoute === "bezel" ? "bg-neon-green/20" : ""
            }`}
            onClick={() => onNavigate("bezel")}
          >
            Bezel
          </button>
          <button
            className={`px-3 py-1 rounded border border-neon-dim hover:bg-neon-green/10 ${
              currentRoute === "settings" ? "bg-neon-green/20" : ""
            }`}
            onClick={() => onNavigate("settings")}
            aria-label="Open settings"
          >
            Settings
          </button>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-1 text-xs opacity-70">
        <span>Voice: {settings.voiceURI || "Auto"}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(57,255,20,.5),transparent)]"></div>
    </header>
  );
};

export default AppShell;