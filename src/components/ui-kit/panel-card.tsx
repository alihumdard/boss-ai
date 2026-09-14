import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelCardProps {
  title?: string;
  icon?: ReactNode;
  /** Rendered top-right — a "View All" link, a running pill, etc. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Stagger for the mount fade+rise, in ms — e.g. 0, 60, 120 for a row of
   * panels appearing in sequence. */
  enterDelayMs?: number;
}

/** The frosted card used by every dashboard panel. */
export function PanelCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  enterDelayMs = 0,
}: PanelCardProps) {
  return (
    <section
      className={cn("panel panel-enter flex flex-col rounded-xl", className)}
      style={{ "--panel-delay": `${enterDelayMs}ms` } as CSSProperties}
    >
      {title && (
        <header className="flex shrink-0 items-center gap-2 border-b border-hairline px-4 py-3">
          {icon}
          <h2 className="text-[13px] font-medium text-foreground">{title}</h2>
          <div className="ml-auto">{action}</div>
        </header>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
