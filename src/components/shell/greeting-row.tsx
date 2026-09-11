"use client";

import { Globe, Mail, PenLine, BarChart3, MoreHorizontal } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import type { AccentName } from "@/lib/types";
import { accentStyle } from "@/lib/accent";

const QUICK_ACTIONS: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: AccentName;
  live: boolean;
}[] = [
  { label: "Send WhatsApp", icon: FaWhatsapp, accent: "emerald", live: true },
  { label: "Manage Website", icon: Globe, accent: "blue", live: true },
  { label: "Check Emails", icon: Mail, accent: "rose", live: false },
  { label: "Create Content", icon: PenLine, accent: "violet", live: false },
  { label: "View Reports", icon: BarChart3, accent: "cyan", live: false },
];

export function GreetingRow() {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight text-foreground">
            Good Afternoon, Ali{" "}
            <span className="inline-block origin-[70%_70%] animate-pulse-glow">
              👋
            </span>
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your AI agents are ready. What would you like to do today?
          </p>
        </div>

        {/* Listening status pill */}
        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-panel-border bg-card/50 px-4 py-2.5">
          <div className="flex h-7 items-end gap-[2px]">
            {[6, 12, 20, 14, 24, 10, 18, 8, 16, 22, 9, 13].map((h, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-cyan animate-pulse-glow"
                style={{
                  height: h,
                  animationDelay: `${i * 0.11}s`,
                }}
              />
            ))}
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">
              BOSS is Online
            </p>
            <p className="text-[11px] text-muted-foreground">Listening...</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              title={action.live ? undefined : "Coming soon"}
              style={accentStyle(action.accent)}
              className="flex items-center gap-2.5 rounded-xl border border-panel-border bg-card/50 px-4 py-2.5 text-[13px] text-foreground transition-colors hover:border-[var(--accent-color)]/45 hover:bg-accent/60 disabled:cursor-not-allowed"
            >
              <Icon className="size-[17px] text-[var(--accent-color)]" />
              {action.label}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="More actions"
          className="grid size-10 place-items-center rounded-xl border border-panel-border bg-card/50 text-muted-foreground transition-colors hover:bg-accent/60"
        >
          <MoreHorizontal className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}
