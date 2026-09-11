import type { LucideIcon } from "lucide-react";

/** Named accent tokens declared in globals.css. Components map these to
 *  CSS variables rather than hard-coding colour values. */
export type AccentName =
  | "cyan"
  | "cyan-soft"
  | "blue"
  | "indigo"
  | "violet"
  | "magenta"
  | "emerald"
  | "teal"
  | "amber"
  | "rose";

/** Only website, whatsapp and support are live; everything else is upcoming. */
export type AgentStatus = "online" | "working" | "coming-soon";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Upcoming sections are visible but muted and non-interactive. */
  comingSoon?: boolean;
  badge?: number;
}
