import { useSyncExternalStore } from "react";

let cached = 0;
let started = false;
const listeners = new Set<() => void>();

function ensureStarted() {
  if (started) return;
  started = true;
  cached = Date.now();
  cached = Date.now();
  setInterval(() => {
    cached = Date.now();
    listeners.forEach((l) => l());
  }, 60000); // refresh every 60s — sufficient for wait-time display
}

function subscribe(callback: () => void) {
  ensureStarted();
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function getSnapshot() {
  return cached;
}
function getServerSnapshot() {
  return 0;
}

/** Ticking clock value, refreshed every 30s. Returns 0 during SSR / before hydration. */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
