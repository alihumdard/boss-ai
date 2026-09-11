import type { CSSProperties } from "react";
import type { AccentName, AgentStatus } from "./types";

/**
 * Resolves an accent name to the CSS variable declared in globals.css.
 * Components spread `accentStyle(accent)` and then reference
 * `var(--accent-color)` in class names, so no hex ever appears in a component.
 */
export function accentVar(accent: AccentName): string {
  return `var(--boss-${accent})`;
}

export function accentStyle(accent: AccentName): CSSProperties {
  return { "--accent-color": accentVar(accent) } as CSSProperties;
}

const STATUS_VAR: Record<AgentStatus, string> = {
  online: "var(--boss-emerald)",
  working: "var(--boss-amber)",
  "coming-soon": "var(--boss-slate)",
};

export function statusStyle(status: AgentStatus): CSSProperties {
  return { "--accent-color": STATUS_VAR[status] } as CSSProperties;
}

export const STATUS_LABEL: Record<AgentStatus, string> = {
  online: "Online",
  working: "Working",
  "coming-soon": "Coming soon",
};
