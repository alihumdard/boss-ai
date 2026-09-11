import { statusStyle, STATUS_LABEL } from "@/lib/accent";
import type { AgentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: AgentStatus;
  /** Hide the text label and show only the dot. */
  iconOnly?: boolean;
  className?: string;
}

export function StatusDot({ status, iconOnly, className }: StatusDotProps) {
  return (
    <span
      style={statusStyle(status)}
      className={cn("flex items-center gap-1.5 text-[11px]", className)}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-[var(--accent-color)]",
          status !== "coming-soon" &&
            "shadow-[0_0_8px_var(--accent-color)] animate-pulse-glow",
        )}
      />
      {!iconOnly && (
        <span
          className={cn(
            status === "coming-soon"
              ? "text-muted-foreground"
              : "text-[var(--accent-color)]",
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      )}
    </span>
  );
}
