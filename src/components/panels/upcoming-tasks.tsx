"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, Check } from "lucide-react";
import { UPCOMING_TASKS } from "@/lib/mock";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

export function UpcomingTasks({
  className,
  enterDelayMs,
}: {
  className?: string;
  enterDelayMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(UPCOMING_TASKS.map((t) => [t.id, t.done])),
  );

  // Open tasks first, done tasks sink to the bottom — checking a task moves
  // it there once its strike-through/fade has had a moment to read.
  const ordered = [...UPCOMING_TASKS].sort((a, b) =>
    done[a.id] === done[b.id] ? 0 : done[a.id] ? 1 : -1,
  );
  const openCount = UPCOMING_TASKS.filter((t) => !done[t.id]).length;

  return (
    <PanelCard
      className={className}
      enterDelayMs={enterDelayMs}
      title="Upcoming Tasks"
      icon={<CalendarCheck className="size-4 text-violet" />}
      action={
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-muted-foreground">
            {openCount} open
          </span>
          <button
            type="button"
            className="text-[11px] text-cyan transition-opacity hover:opacity-80"
          >
            View all
          </button>
        </div>
      }
      bodyClassName="scrollbar-none overflow-y-auto px-2 py-1.5"
    >
      <ul className="space-y-0.5">
        <AnimatePresence initial={false}>
          {ordered.map((task) => {
            const isDone = done[task.id];
            return (
              <motion.li
                key={task.id}
                layout={!reducedMotion}
                transition={{ duration: reducedMotion ? 0 : 0.35 }}
              >
                <label
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/40",
                    isDone && "opacity-55",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() =>
                      setDone((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                    }
                    aria-label={`Mark "${task.title}" as ${isDone ? "not done" : "done"}`}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-[16px] shrink-0 place-items-center rounded border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan",
                      isDone
                        ? "border-status-online bg-status-online/20"
                        : "border-muted-foreground/40",
                    )}
                  >
                    {isDone && <Check className="size-3 text-status-online" />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[12px] transition-all",
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
                </label>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </PanelCard>
  );
}
