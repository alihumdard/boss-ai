import { AGENTS } from "@/lib/mock";
import { accentStyle } from "@/lib/accent";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { StatusDot } from "@/components/ui-kit/status-dot";
import { cn } from "@/lib/utils";

export function ActiveAgents({ className }: { className?: string }) {
  // Live agents lead the list; upcoming ones follow, visibly muted.
  const ordered = [...AGENTS].sort((a, b) =>
    a.status === "coming-soon" ? 1 : b.status === "coming-soon" ? -1 : 0,
  );

  return (
    <PanelCard
      className={className}
      title="Active Agents"
      action={
        <button
          type="button"
          className="text-[11px] text-cyan transition-opacity hover:opacity-80"
        >
          View All
        </button>
      }
      bodyClassName="scrollbar-none overflow-y-auto px-2 py-1.5"
    >
      <ul className="space-y-0.5">
        {ordered.map((agent) => {
          const Icon = agent.icon;
          const isSoon = agent.status === "coming-soon";
          return (
            <li
              key={agent.id}
              style={accentStyle(agent.accent)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors",
                !isSoon && "hover:bg-accent/40",
              )}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg border",
                  isSoon
                    ? "border-panel-border bg-muted/40"
                    : "border-[var(--accent-color)]/30 bg-[var(--accent-color)]/12",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isSoon
                      ? "text-muted-foreground/50"
                      : "text-[var(--accent-color)]",
                  )}
                />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[12.5px]",
                  isSoon ? "text-muted-foreground/60" : "text-foreground",
                )}
              >
                {agent.name}
              </span>
              <StatusDot status={agent.status} className="shrink-0" />
            </li>
          );
        })}
      </ul>
    </PanelCard>
  );
}
