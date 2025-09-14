import React, { useEffect } from "react";
import { isAndroid, isSamsung, isSMT227U } from "../lib/device";
import { useWakeLock } from "../hooks/useWakeLock";
import { SpotifyAPI } from "../lib/spotify/api";

function getScreenOrientation(): ScreenOrientation | null {
  const sc = screen as Screen & { orientation?: ScreenOrientation };
  return typeof sc.orientation !== "undefined" ? sc.orientation! : null;
}

async function lockLandscape() {
  try {
    const orientation = getScreenOrientation();
    if (orientation && "lock" in orientation) {
      await orientation.lock("landscape");
    }
  } catch {
    // ignore
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

    void acquire();

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

    // Best: request fullscreen and lock orientation on first user tap
    const onFirstTap = () => {
      const container = document.documentElement;
      void requestFullscreen(container).then(() => lockLandscape());
      window.removeEventListener("click", onFirstTap);
      window.removeEventListener("touchstart", onFirstTap);
    };
    window.addEventListener("click", onFirstTap, { once: true });
    window.addEventListener("touchstart", onFirstTap, { once: true });

    // If it's Samsung Tab A7 Lite, prefer landscape as well (some devices honor it without fullscreen)
    if (isSamsung() && isSMT227U()) {
      void lockLandscape();
    }

    return () => {
      window.removeEventListener("click", onFirstTap);
      window.removeEventListener("touchstart", onFirstTap);
    };
  }, [acquire]);

  return null;
};

export default AndroidOptimizeController;