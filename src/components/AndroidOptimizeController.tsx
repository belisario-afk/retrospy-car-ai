import React, { useEffect } from "react";
import { isAndroid, isSamsung, isSMT227U } from "../lib/device";
import { useWakeLock } from "../hooks/useWakeLock";
import { SpotifyAPI } from "../lib/spotify/api";

function getScreenOrientation(): ScreenOrientation | null {
  const sc = screen as Screen & { orientation?: ScreenOrientation };
  return typeof sc.orientation !== "undefined" ? sc.orientation! : null;
}

// Best-effort landscape lock (requires fullscreen on many Androids)
async function lockLandscape() {
  try {
    const orientation = getScreenOrientation();
    if (orientation && "lock" in orientation) {
      await orientation.lock("landscape");
    }
  } catch {
    // ignore (not supported or requires fullscreen)
  }
}

async function requestFullscreen(el: HTMLElement) {
  try {
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        const vendor = el as unknown as {
          webkitRequestFullscreen?: () => Promise<void> | void;
          msRequestFullscreen?: () => Promise<void> | void;
        };
        if (vendor.webkitRequestFullscreen) {
          await vendor.webkitRequestFullscreen();
        } else if (vendor.msRequestFullscreen) {
          await vendor.msRequestFullscreen();
        }
      }
    }
  } catch {
    // ignore
  }
}

const AndroidOptimizeController: React.FC = () => {
  const { acquire } = useWakeLock();

  useEffect(() => {
    if (!isAndroid()) return;

    // Acquire wake lock ASAP
    void acquire();

    // Try Media Session hardware button mapping for Spotify controls
    try {
      if ("mediaSession" in navigator) {
        navigator.mediaSession?.setActionHandler?.("previoustrack", () => {
          void SpotifyAPI.previous().catch(() => {});
        });
        navigator.mediaSession?.setActionHandler?.("nexttrack", () => {
          void SpotifyAPI.next().catch(() => {});
        });
        navigator.mediaSession?.setActionHandler?.("pause", () => {
          void SpotifyAPI.pause().catch(() => {});
        });
        navigator.mediaSession?.setActionHandler?.("play", () => {
          void SpotifyAPI.play().catch(() => {});
        });
      }
    } catch {
      // ignore
    }

    // If it's Samsung Tab A7 Lite, try to go landscape and fullscreen once
    const container = document.documentElement;
    if (isSamsung() && isSMT227U()) {
      void requestFullscreen(container).then(() => lockLandscape());
    } else {
      // Attempt a landscape lock even if not fullscreen; many devices just ignore safely
      void lockLandscape();
    }
  }, [acquire]);

  return null;
};

export default AndroidOptimizeController;