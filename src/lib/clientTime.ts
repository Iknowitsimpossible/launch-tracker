import { useSyncExternalStore } from 'react';

/*
 * The pages are pre-rendered on the build machine, so anything that depends on
 * the visitor's clock or time zone must wait until the page is running in their
 * browser. useSyncExternalStore does exactly that: React uses the "server"
 * value while pre-rendering and while hydrating, then switches to the real one.
 */

const noopSubscribe = () => () => {};

/** false while pre-rendering and hydrating, true afterwards in the browser. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// One shared timer for every countdown on the page.
let nowSeconds = Math.floor(Date.now() / 1000);
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribeToClock(listener: () => void): () => void {
  listeners.add(listener);
  nowSeconds = Math.floor(Date.now() / 1000); // may be stale if nobody was listening
  if (timer === undefined) {
    timer = setInterval(() => {
      nowSeconds = Math.floor(Date.now() / 1000);
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** The current time in whole seconds since 1970, updated every second. null until the browser takes over. */
export function useNowSeconds(): number | null {
  return useSyncExternalStore<number | null>(
    subscribeToClock,
    () => nowSeconds,
    () => null,
  );
}
