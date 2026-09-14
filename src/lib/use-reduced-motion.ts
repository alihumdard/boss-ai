"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion`, live — unlike a one-time check at mount,
 * this reacts if the user flips the OS setting while the tab is open.
 *
 * Always starts `false`, even on the client's first render. The server has no
 * `window.matchMedia` and must render `false`; if the lazy initializer read
 * the real value on the client, a user with the OS preference on would
 * hydrate to `true` while the server-rendered markup says `false` — a
 * hydration mismatch. Reading the true value only inside the effect (which
 * never runs during SSR or the hydration render) keeps both in sync, at the
 * cost of one extra render right after mount to pick up the real value.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    // Deferred to a frame rather than called synchronously in the effect
    // body: this is the effect's own subscription callback pattern (like
    // "change" above), just fired once immediately to pick up the current
    // value, not a render-time state sync.
    const id = requestAnimationFrame(() => setReduced(mq.matches));
    return () => {
      mq.removeEventListener("change", onChange);
      cancelAnimationFrame(id);
    };
  }, []);

  return reduced;
}
