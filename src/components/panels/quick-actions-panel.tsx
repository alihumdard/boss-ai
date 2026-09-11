import { QUICK_ACTIONS, TAGLINE } from "@/lib/mock";
import { accentStyle } from "@/lib/accent";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { cn } from "@/lib/utils";

export function QuickActionsPanel({ className }: { className?: string }) {
  return (
    <PanelCard
      className={className}
      title="Quick Actions"
      action={
        <button
          type="button"
          className="text-[11px] text-cyan transition-opacity hover:opacity-80"
        >
          Edit
        </button>
      }
      bodyClassName="px-3 py-3"
    >
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              disabled={!action.live}
              style={accentStyle(action.accent)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left text-[11.5px] transition-colors",
                action.live
                  ? "border-panel-border bg-card/50 text-foreground hover:border-[var(--accent-color)]/45 hover:bg-accent/50"
                  : "cursor-not-allowed border-panel-border/50 bg-muted/20 text-muted-foreground/50",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0",
                  action.live
                    ? "text-[var(--accent-color)]"
                    : "text-muted-foreground/40",
                )}
              />
              <span className="min-w-0 truncate">{action.label}</span>
              {!action.live && (
                <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wide">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 border-t border-hairline px-1 pt-3 text-center text-[11px] italic leading-snug text-muted-foreground">
        &ldquo;{TAGLINE}&rdquo;
      </p>
    </PanelCard>
  );
}
