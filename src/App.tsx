import React, { useEffect, useMemo, useState } from "react";
import AppShell from "./components/AppShell";
import DashScreen from "./components/DashScreen";
import SpotifyAuth from "./components/SpotifyAuth";
import SpotifyPlayer from "./components/SpotifyPlayer";
import Settings from "./components/Settings";
import PrintableBezel from "./components/PrintableBezel";
import { usePKCE } from "./hooks/usePKCE";
import { getStoredToken } from "./lib/spotify/api";
import { TTSProvider } from "./lib/tts";
import { AudioFXProvider } from "./lib/audiofx";
import { create } from "zustand";
import classNames from "classnames";

type Route = "dash" | "settings" | "bezel" | "callback" | "connect";

interface NavState {
  route: Route;
  setRoute: (r: Route) => void;
}
export const useNav = create<NavState>((set) => ({ route: "dash", setRoute: (r) => set({ route: r }) }));

const App: React.FC = () => {
  const { handleRedirectCallback, isRedirectCallback } = usePKCE();
  const [authed, setAuthed] = useState<boolean>(!!getStoredToken());
  const nav = useNav();

  useEffect(() => {
    // Detect PKCE redirect callback
    if (isRedirectCallback()) {
      nav.setRoute("callback");
      handleRedirectCallback().then(
        () => {
          setAuthed(true);
          nav.setRoute("dash");
        },
        () => {
          setAuthed(false);
          nav.setRoute("dash");
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = useMemo(() => {
    if (!authed) {
      return <SpotifyAuth onAuthed={() => setAuthed(true)} />;
    }
    if (nav.route === "settings") return <Settings />;
    if (nav.route === "bezel") return <PrintableBezel />;
    return (
      <>
        <SpotifyPlayer />
        <DashScreen />
      </>
    );
  }, [authed, nav.route]);

  return (
    <AudioFXProvider>
      <TTSProvider>
        <div className={classNames("min-h-screen text-neon-green font-mono", "crt relative")}>
          <div className="crt-scanline" aria-hidden="true"></div>
          <AppShell onNavigate={(route) => nav.setRoute(route)} currentRoute={nav.route} />
          <main className="double-din p-3 sm:p-4 md:p-6 mt-2">{content}</main>
        </div>
      </TTSProvider>
    </AudioFXProvider>
  );
};

export default App;