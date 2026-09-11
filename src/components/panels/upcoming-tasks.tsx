"use client";

import { useState } from "react";
import { CalendarCheck, Check } from "lucide-react";
import { UPCOMING_TASKS } from "@/lib/mock";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { cn } from "@/lib/utils";

export function UpcomingTasks({ className }: { className?: string }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(UPCOMING_TASKS.map((t) => [t.id, t.done])),
  );

  return (
    <PanelCard
      className={className}
      title="Upcoming Tasks"
      icon={<CalendarCheck className="size-4 text-violet" />}
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
        {UPCOMING_TASKS.map((task) => {
          const isDone = done[task.id];
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() =>
                  setDone((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                }
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/40"
              >
                <span
                  className={cn(
                    "grid size-[16px] shrink-0 place-items-center rounded border transition-colors",
                    isDone
                      ? "border-status-online bg-status-online/20"
                      : "border-muted-foreground/40",
                  )}
                >
                  {isDone && <Check className="size-3 text-status-online" />}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[12px]",
                    isDone
                      ? "text-muted-foreground line-through"
                      : "text-foreground/90",
                  )}
                >
                  {task.title}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {task.due}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </PanelCard>
  );
}
