import { STATS, STATS_PERIOD, type Stat } from "@/lib/mock";
import { accentStyle } from "@/lib/accent";
import { PanelCard } from "@/components/ui-kit/panel-card";

const SIZE = 62;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** 1,284 stays as-is; 12,900 compacts to 12.9K. */
function formatValue(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return value.toLocaleString("en-US");
}

/**
 * A meter: one ratio against its total. The unfilled track is a lighter step
 * of the same hue (not neutral grey) so the state reads across the whole ring.
 */
function StatDial({ stat }: { stat: Stat }) {
  const ratio = stat.total ? Math.min(stat.value / stat.total, 1) : 1;
  const pct = Math.round(ratio * 100);

  return (
    <div
      style={accentStyle(stat.accent)}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          role="img"
          aria-label={`${stat.label}: ${stat.value.toLocaleString("en-US")}${
            stat.total ? ` of ${stat.total.toLocaleString("en-US")} (${pct}%)` : ""
          }`}
        >
          {/* Track: same hue, low opacity */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--accent-color)"
            strokeOpacity={0.16}
            strokeWidth={STROKE}
          />
          {/* Fill */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--accent-color)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
            style={{ filter: "drop-shadow(0 0 5px var(--accent-color))" }}
          />
        </svg>
        {/* Value sits in ink, not the series colour */}
        <span className="absolute inset-0 grid place-items-center text-[14px] font-semibold text-foreground">
          {formatValue(stat.value)}
        </span>
      </div>
      <p className="text-center text-[10.5px] leading-tight text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}

export function StatsPanel({ className }: { className?: string }) {
  return (
    <PanelCard
      className={className}
      title="System Status"
      action={
        <span className="flex items-center gap-1.5 text-[11px] text-status-online">
          <span className="size-1.5 rounded-full bg-status-online animate-pulse-glow" />
          All Systems Operational
        </span>
      }
      bodyClassName="px-4 py-4"
    >
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((stat) => (
          <StatDial key={stat.id} stat={stat} />
        ))}
      </div>
      <p className="mt-3 text-center text-[10.5px] text-muted-foreground/70">
        {STATS_PERIOD}
      </p>
    </PanelCard>
  );
}
