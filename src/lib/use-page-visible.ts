"use client";

import { useEffect, useState } from "react";

/**
 * True while the tab is visible. Lets intervals/animations pause when hidden.
 *
 * Always starts `true`, matching what the server renders (there is no
 * `document` during SSR). `document.hidden` is read only inside the effect,
 * which never runs during SSR or the hydration render, so the client's first
 * paint always agrees with the server's — even for the rare case of a page
 * that loads in a backgrounded tab.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    // Deferred to a frame for the same reason as useReducedMotion: this is
    // the subscription's own callback, fired once to pick up the current
    // value, not a synchronous state sync in the effect body.
    const id = requestAnimationFrame(onChange);
    return () => {
      document.removeEventListener("visibilitychange", onChange);
      cancelAnimationFrame(id);
    };
  }, []);

  return visible;
}
