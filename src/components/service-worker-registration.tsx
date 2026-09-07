"use client";

import { useEffect } from "react";

// Registers the PWA service worker. This has to run from a client component
// since navigator.serviceWorker only exists in the browser.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Best-effort — a failed registration (e.g. unsupported browser) should
        // never block the app itself.
      });
    }
  }, []);

  return null;
}
