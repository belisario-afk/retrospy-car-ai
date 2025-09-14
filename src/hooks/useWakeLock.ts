import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for Wake Lock
type WakeLockSentinel = {
  release: () => Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => void) | null;
};
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>;
  };
};

export function useWakeLock() {
  const [supported, setSupported] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    const nav = navigator as NavigatorWithWakeLock;
    setSupported(!!nav.wakeLock);
  }, []);

  const acquire = useCallback(async () => {
    const nav = navigator as NavigatorWithWakeLock;
    if (!nav.wakeLock) return false;
    try {
      // If already active, do nothing
      if (sentinelRef.current) return true;
      const sentinel = await nav.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      sentinel.onrelease = () => {
        sentinelRef.current = null;
        setActive(false);
      };
      setActive(true);
      return true;
    } catch {
      setActive(false);
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    try {
      if (sentinelRef.current) {
        await sentinelRef.current.release();
        sentinelRef.current = null;
      }
      setActive(false);
    } catch {
      // ignore
    }
  }, []);

  // Re-acquire when tab becomes visible again (Android sometimes drops it)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && sentinelRef.current) {
        // still active
        setActive(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return { supported, active, acquire, release };
}