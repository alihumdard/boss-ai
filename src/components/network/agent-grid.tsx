"use client";

import { NETWORK_NODES } from "@/lib/network-layout";
import { accentStyle } from "@/lib/accent";
import { StatusDot } from "@/components/ui-kit/status-dot";
import { cn } from "@/lib/utils";

/**
 * Narrow-viewport fallback. Below 768px the arcs cannot keep their gaps, so
 * the agents become a plain two-column grid under the orb and the connector
 * layer is dropped entirely.
 */
export function AgentGrid() {
  return (
    <div className="grid w-full grid-cols-2 gap-2 px-2 pb-2">
      {NETWORK_NODES.map((node) => {
        const Icon = node.icon;
        const isSoon = node.status === "coming-soon";

        return (
          <div
            key={node.id}
            style={accentStyle(node.accent)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-2.5 py-2 backdrop-blur-md",
              isSoon
                ? "border-panel-border/50 bg-card/30 opacity-55 saturate-50"
                : "border-[var(--accent-color)]/35 bg-card/75",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                isSoon
                  ? "bg-muted/25"
                  : "bg-[radial-gradient(circle_at_30%_25%,var(--accent-color),transparent_70%)] ring-1 ring-[var(--accent-color)]/45",
              )}
            >
              <Icon
                className={cn(
                  "size-4",
                  isSoon ? "text-muted-foreground/50" : "text-foreground",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-[11.5px] font-medium leading-tight",
                  isSoon ? "text-muted-foreground/85" : "text-foreground",
                )}
              >
                {node.name}
              </p>
              <StatusDot status={node.status} className="mt-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
