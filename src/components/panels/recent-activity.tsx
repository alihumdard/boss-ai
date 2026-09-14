"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";
import { RECENT_ACTIVITY, STATS } from "@/lib/mock";
import { accentStyle } from "@/lib/accent";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const MINI_RING_SIZE = 32;
const MINI_RING_STROKE = 3;
const MINI_RING_RADIUS = (MINI_RING_SIZE - MINI_RING_STROKE) / 2;
const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS;

function formatValue(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return value.toLocaleString("en-US");
}

/** Tiny static ring: no glow, no count-up — just the current value. */
function MiniStatRing({ stat }: { stat: (typeof STATS)[number] }) {
  const ratio = stat.total ? Math.min(stat.value / stat.total, 1) : 1;
  return (
    <div
      style={accentStyle(stat.accent)}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative" style={{ width: MINI_RING_SIZE, height: MINI_RING_SIZE }}>
        <svg width={MINI_RING_SIZE} height={MINI_RING_SIZE} className="-rotate-90">
          <circle
            cx={MINI_RING_SIZE / 2}
            cy={MINI_RING_SIZE / 2}
            r={MINI_RING_RADIUS}
            fill="none"
            stroke="var(--accent-color)"
            strokeOpacity={0.18}
            strokeWidth={MINI_RING_STROKE}
          />
          <circle
            cx={MINI_RING_SIZE / 2}
            cy={MINI_RING_SIZE / 2}
            r={MINI_RING_RADIUS}
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth={MINI_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={MINI_RING_CIRCUMFERENCE}
            strokeDashoffset={MINI_RING_CIRCUMFERENCE * (1 - ratio)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[9px] font-semibold text-foreground">
          {formatValue(stat.value)}
        </span>
      </div>
      <p className="whitespace-nowrap text-[9px] leading-tight text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}

export function RecentActivity({
  className,
  enterDelayMs,
}: {
  className?: string;
  enterDelayMs?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <PanelCard
      className={className}
      enterDelayMs={enterDelayMs}
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
      <div className="flex items-start justify-between gap-1 border-b border-hairline px-1 pb-2">
        {STATS.map((stat) => (
          <MiniStatRing key={stat.id} stat={stat} />
        ))}
      </div>

      <ul className="mt-2 space-y-0.5">
        <AnimatePresence initial={false}>
          {RECENT_ACTIVITY.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.id}
                // The newest (first) row slides in from above with a brief
                // highlight; older rows fade in without the slide so the
                // whole list doesn't drop in at once.
                initial={
                  reducedMotion
                    ? false
                    : i === 0
                      ? { opacity: 0, y: -12 }
                      : { opacity: 0 }
                }
                animate={
                  i === 0
                    ? {
                        opacity: 1,
                        y: 0,
                        backgroundColor: reducedMotion
                          ? "transparent"
                          : [
                              "color-mix(in oklch, var(--accent-color) 16%, transparent)",
                              "transparent",
                            ],
                      }
                    : { opacity: 1 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.3,
                  backgroundColor: { duration: 1.2, delay: 0.2 },
                }}
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
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </PanelCard>
  );
}
