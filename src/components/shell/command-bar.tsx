"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  listening: boolean;
  audioLevel: number;
  denied: boolean;
  onToggleListening: () => void;
}

/** Twelve bars driven by the live level, mirrored around the centre. */
function LevelMeter({ level }: { level: number }) {
  const BARS = 12;
  return (
    <div className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: BARS }).map((_, i) => {
        // Centre bars react most, edges least.
        const weight = 1 - Math.abs(i - (BARS - 1) / 2) / ((BARS - 1) / 2);
        const h = 3 + level * 20 * (0.35 + weight * 0.65);
        return (
          <motion.span
            key={i}
            className="w-[2.5px] rounded-full bg-cyan"
            animate={{ height: h }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{ boxShadow: "0 0 8px var(--boss-cyan)" }}
          />
        );
      })}
    </div>
  );
}

export function CommandBar({
  listening,
  audioLevel,
  denied,
  onToggleListening,
}: CommandBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Space toggles listening — but never while the user is typing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;

      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (typing) return;

      e.preventDefault();
      onToggleListening();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleListening]);

  function submit() {
    if (!value.trim()) return;
    setValue("");
    inputRef.current?.blur();
  }

  return (
    <div className="mt-3 shrink-0">
      <div
        className={cn(
          "panel flex items-center gap-3 rounded-full py-2 pl-2 pr-2.5 transition-colors",
          listening && "border-cyan/45 shadow-[0_0_36px_-10px_var(--boss-cyan)]",
        )}
      >
        {/* Mic */}
        <button
          type="button"
          onClick={onToggleListening}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : "Start listening"}
          className={cn(
            "relative grid size-10 shrink-0 place-items-center rounded-full transition-colors",
            listening
              ? "bg-cyan text-primary-foreground"
              : "bg-cyan/15 text-cyan hover:bg-cyan/25",
          )}
        >
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-full border border-cyan"
              animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          {listening ? (
            <Square className="size-4 fill-current" />
          ) : (
            <Mic className="size-[18px]" />
          )}
        </button>

        {/* Input, or the live meter while listening */}
        {listening ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <LevelMeter level={audioLevel} />
            <p className="truncate text-[13px] text-cyan">
              {denied
                ? "No microphone — showing a simulated level"
                : "Listening..."}
            </p>
          </div>
        ) : (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Ask BOSS anything..."
            aria-label="Ask BOSS anything"
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        )}

        {/* Space hint */}
        {!listening && (
          <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
            Press
            <kbd className="rounded border border-panel-border bg-muted/60 px-2 py-0.5 font-sans text-[11px] text-foreground/80">
              Space
            </kbd>
            to talk
          </span>
        )}

        {/* Send */}
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || listening}
          aria-label="Send message"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full transition-colors",
            value.trim() && !listening
              ? "bg-cyan text-primary-foreground hover:opacity-90"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Send className="size-[17px]" />
        </button>
      </div>
    </div>
  );
}
