"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import { CONSOLE_LINES } from "@/lib/mock";
import { PanelCard } from "@/components/ui-kit/panel-card";
import { cn } from "@/lib/utils";

const LEVEL_CLASS = {
  success: "text-status-online",
  info: "text-cyan",
  muted: "text-muted-foreground",
} as const;

export function LiveConsole({ className }: { className?: string }) {
  // Reveal lines one at a time, then hold the full log.
  const [shown, setShown] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shown >= CONSOLE_LINES.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), 900);
    return () => clearTimeout(id);
  }, [shown]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  return (
    <PanelCard
      className={className}
      title="Live Console"
      icon={<Terminal className="size-4 text-status-online" />}
      action={
        <span className="flex items-center gap-1.5 rounded-full border border-status-online/30 bg-status-online/10 px-2 py-0.5 text-[10px] text-status-online">
          <span className="size-1.5 rounded-full bg-status-online animate-pulse-glow" />
          Running
        </span>
      }
      bodyClassName="scrollbar-none overflow-hidden px-3 py-2.5"
    >
      <div ref={scrollRef} className="scrollbar-none h-full overflow-y-auto">
        <pre className="font-mono text-[11px] leading-[1.75]">
          {CONSOLE_LINES.slice(0, shown).map((line) => (
            <div key={line.id} className="flex gap-2">
              <span className="shrink-0 text-muted-foreground/70">
                [{line.timestamp}]
              </span>
              <span className={cn("min-w-0", LEVEL_CLASS[line.level])}>
                {line.message}
              </span>
            </div>
          ))}
          {shown >= CONSOLE_LINES.length && (
            <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-status-online animate-pulse-glow" />
          )}
        </pre>
      </div>
    </PanelCard>
  );
}
