"use client";

import { useEffect, useState } from "react";
import { Search, Sun, Bell, ChevronDown } from "lucide-react";

const NOTIFICATION_COUNT = 3;

/** Renders after mount so the server and client never disagree on the clock. */
function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Set on the next frame rather than synchronously in the effect body,
    // which would trigger a cascading render.
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  if (!now) {
    return <div className="h-5 w-[190px]" aria-hidden />;
  }

  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-muted-foreground">{date}</span>
      <span className="text-[17px] font-medium tabular-nums text-foreground">
        {time}
      </span>
    </div>
  );
}

export function TopBar() {
  return (
    <header className="relative z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-panel-border px-6 backdrop-blur-xl">
      {/* Search */}
      <div className="group relative w-full max-w-[620px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search anything... (apps, files, messages, tasks, web...)"
          className="h-11 w-full rounded-full border border-panel-border bg-card/50 pl-11 pr-20 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-cyan/40 focus:shadow-[0_0_24px_-8px_var(--boss-cyan)]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] text-muted-foreground">
          <span className="rounded border border-panel-border bg-muted/60 px-1.5 py-0.5">
            Ctrl
          </span>
          <span className="rounded border border-panel-border bg-muted/60 px-1.5 py-0.5">
            K
          </span>
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-label="Toggle theme"
          className="grid size-10 place-items-center rounded-full border border-panel-border bg-card/50 text-amber transition-colors hover:bg-accent"
        >
          <Sun className="size-[18px]" />
        </button>

        <button
          type="button"
          aria-label={`Notifications (${NOTIFICATION_COUNT} unread)`}
          className="relative grid size-10 place-items-center rounded-full border border-panel-border bg-card/50 text-cyan transition-colors hover:bg-accent"
        >
          <Bell className="size-[18px]" />
          <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-rose text-[10px] font-semibold text-foreground">
            {NOTIFICATION_COUNT}
          </span>
        </button>

        <div className="ml-2 flex items-center gap-2">
          <Clock />
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
