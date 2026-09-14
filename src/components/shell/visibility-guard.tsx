"use client";

import { useEffect } from "react";
import { usePageVisible } from "@/lib/use-page-visible";

/**
 * Toggles a class on <body> that globals.css uses to pause every CSS
 * animation (starfield drift, pulse-glow, panel-enter, ...) while the tab is
 * hidden — cheaper than each animated component managing its own
 * play/pause, and it automatically covers new animations added later.
 */
export function VisibilityGuard() {
  const visible = usePageVisible();

  useEffect(() => {
    document.body.classList.toggle("tab-visible", visible);
  }, [visible]);

  return null;
}
