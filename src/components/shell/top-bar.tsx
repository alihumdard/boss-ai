"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";

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
    <header className="relative z-20 flex h-[72px] shrink-0 items-center gap-4 border-b border-panel-border px-6 backdrop-blur-xl">
      {/* Greeting back in the top bar, freeing the centre column's height for
          the orb/network. */}
      <div className="min-w-0">
        <h1 className="truncate text-[19px] font-semibold leading-tight text-foreground">
          Good Afternoon, Ali{" "}
          <span className="inline-block origin-[70%_70%] animate-pulse-glow">
            👋
          </span>
        </h1>
        <p className="truncate text-[12px] text-muted-foreground">
          Your AI agents are ready. What would you like to do today?
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
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
