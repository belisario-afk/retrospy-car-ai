import React, { useCallback, useState } from "react";
import { isAndroid, isSamsung, isSMT227U } from "../lib/device";
import { useWakeLock } from "../hooks/useWakeLock";

function getScreenOrientation(): ScreenOrientation | null {
  const sc = screen as Screen & { orientation?: ScreenOrientation };
  return typeof sc.orientation !== "undefined" ? sc.orientation! : null;
}

const DeviceOptimization: React.FC = () => {
  const android = isAndroid();
  const samsung = isSamsung();
  const smt227u = isSMT227U();
  const { supported: wakeSupported, active: wakeActive, acquire, release } = useWakeLock();
  const [fsActive, setFsActive] = useState<boolean>(!!document.fullscreenElement);
  const [lockError, setLockError] = useState<string | null>(null);

  const toggleWake = useCallback(async () => {
    if (wakeActive) {
      await release();
    } else {
      await acquire();
    }
  }, [wakeActive, acquire, release]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          const vendor = document.documentElement as unknown as {
            webkitRequestFullscreen?: () => Promise<void> | void;
            msRequestFullscreen?: () => Promise<void> | void;
          };
          if (vendor.webkitRequestFullscreen) {
            await vendor.webkitRequestFullscreen();
          } else if (vendor.msRequestFullscreen) {
            await vendor.msRequestFullscreen();
          }
        }
        setFsActive(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else {
          const vendDoc = document as unknown as {
            webkitExitFullscreen?: () => Promise<void> | void;
            msExitFullscreen?: () => Promise<void> | void;
          };
          if (vendDoc.webkitExitFullscreen) {
            await vendDoc.webkitExitFullscreen();
          } else if (vendDoc.msExitFullscreen) {
            await vendDoc.msExitFullscreen();
          }
        }
        setFsActive(false);
      }
    } catch {
      setFsActive(!!document.fullscreenElement);
    }
  }, []);

  const lockLandscape = useCallback(async () => {
    setLockError(null);
    try {
      const orientation = getScreenOrientation();
      if (!orientation || !("lock" in orientation)) {
        setLockError("Orientation lock not supported on this browser.");
        return;
      }
      await orientation.lock("landscape");
    } catch {
      setLockError("Orientation lock requires fullscreen or is restricted by the browser.");
    }
  }, []);

  return (
    <section className="space-y-3 border border-neon-dim rounded p-3">
      <h2 className="text-lg">Device Optimization (Android)</h2>
      <div className="text-xs opacity-80">
        Tailored for Android tablets. On Samsung Galaxy Tab A7 Lite (SM‑T227U), these settings help keep the
        screen awake, prefer landscape, and ensure hardware buttons control playback.
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Keep screen awake</span>
          <button
            className={`px-3 py-1 rounded border border-neon-dim ${wakeActive ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
            onClick={toggleWake}
            disabled={!wakeSupported}
            title={wakeSupported ? "" : "Wake Lock API not supported in this browser"}
          >
            {wakeActive ? "On" : "Off"}
          </button>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Fullscreen</span>
          <button
            className={`px-3 py-1 rounded border border-neon-dim ${fsActive ? "bg-neon-green/20" : "hover:bg-neon-green/10"}`}
            onClick={toggleFullscreen}
          >
            {fsActive ? "On" : "Off"}
          </button>
        </label>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">Lock orientation to landscape</span>
          <button
            className="px-3 py-1 rounded border border-neon-dim hover:bg-neon-green/10"
            onClick={lockLandscape}
          >
            Lock
          </button>
        </label>
      </div>

      {lockError && <div className="text-xs text-red-400">{lockError}</div>}

      {android && (
        <div className="text-xs opacity-80 space-y-1">
          <div>Recommended on your device:</div>
          <ul className="list-disc list-inside">
            <li>Disable Battery optimization for your browser or the installed PWA.</li>
            <li>Turn off Adaptive brightness if the screen dims during night driving.</li>
            <li>In Developer options: consider “Stay awake” while charging; “Disable absolute volume” if your head unit clips.</li>
            <li>Bluetooth: set your car stereo as the default output and enable any built‑in Loudness/EQ there.</li>
          </ul>
          {samsung && smt227u && (
            <div className="pt-2">
              Samsung SM‑T227U tip: In Settings → Display → Navigation bar, prefer gesture navigation to reduce accidental taps.
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default DeviceOptimization;