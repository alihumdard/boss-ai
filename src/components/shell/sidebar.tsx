"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Sidebar() {
  const [active, setActive] = useState("/");

  return (
    <aside className="relative z-20 flex h-full w-[248px] shrink-0 flex-col border-r border-panel-border bg-sidebar/70 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4">
        <BrandMark />
        <div className="min-w-0">
          <p className="font-heading text-[19px] leading-none tracking-[0.22em] text-foreground">
            BOSS
          </p>
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            Your Personal AI Assistant
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="scrollbar-none min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href && !item.comingSoon;

          // Upcoming sections render as static rows carrying their own
          // "Coming soon" label, so there is no dead button to click.
          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground/45"
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
                <span className="ml-auto shrink-0 rounded-full border border-panel-border px-1.5 py-px text-[9px] uppercase tracking-wide text-muted-foreground/60">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => setActive(item.href)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg border border-cyan/35 bg-cyan/12 shadow-[0_0_22px_-8px_var(--boss-cyan)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  "relative size-[18px] shrink-0",
                  isActive && "text-cyan",
                )}
              />
              <span className="relative truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="mx-3 mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-panel-border bg-card/60 px-3 py-2.5">
        <Avatar className="size-9 border border-cyan/30">
          <AvatarFallback className="bg-cyan/15 text-[12px] font-medium text-cyan">
            FR
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground">
            Ali 
          </p>
          <p className="text-[11px] text-muted-foreground">Owner</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>

      {/* Tagline */}
      <div className="relative mx-3 mb-4 shrink-0 overflow-hidden rounded-xl border border-panel-border bg-card/40 px-4 py-3.5">
        <div className="pointer-events-none absolute -bottom-8 -left-6 h-20 w-40 rounded-full bg-rose/25 blur-2xl" />
        <p className="relative text-[13px] leading-snug text-foreground/90">
          &ldquo;Smarter Tools
          <br />A More Productive You&rdquo;
        </p>
      </div>
    </aside>
  );
}
