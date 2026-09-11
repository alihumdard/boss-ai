import { Activity } from "lucide-react";
import { RECENT_ACTIVITY } from "@/lib/mock";
import { accentStyle } from "@/lib/accent";
import { PanelCard } from "@/components/ui-kit/panel-card";

export function RecentActivity({ className }: { className?: string }) {
  return (
    <PanelCard
      className={className}
      title="Recent Activity"
      icon={<Activity className="size-4 text-cyan" />}
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
        {RECENT_ACTIVITY.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              style={accentStyle(item.accent)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/40"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-[var(--accent-color)]/25 bg-[var(--accent-color)]/12">
                <Icon className="size-3.5 text-[var(--accent-color)]" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[12px] text-foreground/90">
                {item.text}
              </p>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {item.timeAgo}
              </span>
            </li>
          );
        })}
      </ul>
    </PanelCard>
  );
}
