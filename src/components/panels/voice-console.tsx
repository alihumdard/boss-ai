"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, Square, Terminal } from "lucide-react";
import type { OrbState } from "@/components/orb/types";
import type { VoiceSessionState, TranscriptLine } from "@/lib/use-voice-session";
import {
  CONSOLE_LINES,
  CONSOLE_EVENT_POOL,
  type ConsoleLine,
  type ConsoleLineKind,
} from "@/lib/mock";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { usePageVisible } from "@/lib/use-page-visible";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<OrbState, string> = {
  idle: "Tap to talk, or type below",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
};

/** Symmetric waveform either side of the mic, driven by the real audioLevel. */
function Waveform({ level, active }: { level: number; active: boolean }) {
  const BARS = 40;
  return (
    <div className="flex h-10 items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: BARS }).map((_, i) => {
        const centre = (BARS - 1) / 2;
        const weight = 1 - Math.abs(i - centre) / centre;
        const jitter = 0.75 + 0.5 * Math.abs(Math.sin(i * 12.9898));
        const h = active ? 4 + level * 34 * (0.25 + weight * 0.9) * jitter : 3;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-cyan"
            animate={{ height: h, opacity: active ? 1 : 0.25 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{ boxShadow: active ? "0 0 10px var(--boss-cyan)" : "none" }}
          />
        );
      })}
    </div>
  );
}

const KIND_CLASS: Record<ConsoleLineKind, string> = {
  success: "text-status-online",
  agent: "text-violet",
  info: "text-cyan",
  warning: "text-amber",
};

const MAX_LINES = 50;
// Module-scoped counter, so a dev-mode Fast Refresh remount (which re-runs
// this module but not a full page reload) can't collide with ids already
// rendered from before the reload — a plain per-mount counter did.
let lineSeq = Date.now();
function nextId() {
  lineSeq += 1;
  return `line-${lineSeq}`;
}

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

/** One character at a time, so the newest line reads as being typed live. */
function Typewriter({
  text,
  onDone,
  reducedMotion,
}: {
  text: string;
  onDone: () => void;
  reducedMotion: boolean;
}) {
  const [shown, setShown] = useState(reducedMotion ? text.length : 0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reducedMotion) return;
    if (shown >= text.length) {
      const id = setTimeout(() => onDoneRef.current(), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setShown((n) => n + 1), 15);
    return () => clearTimeout(id);
  }, [shown, text, reducedMotion]);

  const finished = reducedMotion || shown >= text.length;

  return (
    <span>
      {text.slice(0, shown)}
      {!finished && (
        <span className="inline-block h-3 w-[6px] translate-y-0.5 animate-pulse-glow bg-current" />
      )}
    </span>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 pl-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-current"
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function useConsoleLines(orbState: OrbState) {
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  const [lines, setLines] = useState<ConsoleLine[]>(CONSOLE_LINES);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const orbStateRef = useRef(orbState);
  useEffect(() => {
    orbStateRef.current = orbState;
  }, [orbState]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    function schedule() {
      const delay = 2000 + Math.random() * 3000;
      timer = setTimeout(() => {
        if (cancelled) return;
        const pool = CONSOLE_EVENT_POOL[orbStateRef.current];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const id = nextId();
        setLines((prev) => [
          ...prev.slice(-(MAX_LINES - 1)),
          { id, timestamp: timestamp(), message: pick.message, kind: pick.kind },
        ]);
        setPendingId(id);
        schedule();
      }, delay);
    }

    schedule();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible]);

  const pushLine = useCallback((message: string, kind: ConsoleLineKind) => {
    const id = nextId();
    setLines((prev) => [
      ...prev.slice(-(MAX_LINES - 1)),
      { id, timestamp: timestamp(), message, kind },
    ]);
  }, []);

  return { lines, pendingId, setPendingId, reducedMotion, pushLine };
}

export interface VoiceConsoleProps {
  orbState: OrbState;
  listening: boolean;
  audioLevel: number;
  denied: boolean;
  onToggleListening: () => void;
  /** LiveKit connection state, when the real agent is wired up. */
  sessionState?: VoiceSessionState;
  sessionError?: string | null;
  /** True once the agent has disconnected after a connected session. */
  sessionDisconnected?: boolean;
  /** Push-to-talk: the mic is open and capturing this turn. */
  recording?: boolean;
  recordingSeconds?: number;
  transcript?: TranscriptLine[];
  className?: string;
}

const SESSION_STATUS_LABEL: Partial<Record<VoiceSessionState, string>> = {
  connecting: "Connecting to BOSS...",
};

/**
 * Plain vertical stack, normal document flow — no absolute positioning, no
 * overlapping layers, no panel background/border. Each block is its own
 * full-width row with margin between them:
 *   1. waveform + mic, centred
 *   2. status line
 *   3. console log (transparent, 5 lines, auto-scroll)
 *   4. text input row
 * The stat rings used to live here as a fourth block; they now live in
 * Recent Activity instead.
 */
export function VoiceConsole({
  orbState,
  listening,
  audioLevel,
  denied,
  onToggleListening,
  sessionState,
  sessionError,
  sessionDisconnected,
  recording,
  recordingSeconds = 0,
  transcript,
  className,
}: VoiceConsoleProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = orbState !== "idle";
  const { lines, pendingId, setPendingId, reducedMotion, pushLine } =
    useConsoleLines(orbState);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const lastSessionStateRef = useRef<VoiceSessionState | undefined>(undefined);
  useEffect(() => {
    if (!sessionState || sessionState === lastSessionStateRef.current) return;
    lastSessionStateRef.current = sessionState;
    if (sessionState === "connecting") {
      pushLine("Connecting to BOSS agent...", "info");
    } else if (sessionState === "listening") {
      pushLine("Connected to BOSS agent.", "success");
    } else if (sessionState === "error" && sessionError) {
      pushLine(sessionError, "warning");
    } else if (sessionState === "idle" && sessionDisconnected) {
      pushLine("BOSS disconnected.", "warning");
    }
  }, [sessionState, sessionError, sessionDisconnected, pushLine]);

  const latestTranscript = transcript?.length
    ? transcript[transcript.length - 1]
    : null;

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
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* 1. Waveform + mic, centred */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <div className={cn("flex-1 transition-opacity", !active && "opacity-0")}>
          <Waveform level={audioLevel} active={active} />
        </div>

        <button
          type="button"
          onClick={onToggleListening}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : "Start listening"}
          className={cn(
            "relative grid size-14 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
            listening
              ? "bg-cyan text-primary-foreground"
              : "bg-cyan/15 text-cyan hover:bg-cyan/25",
          )}
        >
          {listening && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border border-cyan"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border border-cyan"
                animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.8,
                }}
              />
            </>
          )}
          {listening ? (
            <Square className="size-5 fill-current" />
          ) : (
            <Mic className="size-6" />
          )}
        </button>

        <div className={cn("flex-1 transition-opacity", !active && "opacity-0")}>
          <Waveform level={audioLevel} active={active} />
        </div>
      </div>

      {/* 2. Status line — while recording it becomes a live indicator with an
          elapsed timer; otherwise inline errors take priority so the panel
          never shows a blank/frozen state when the mic or the agent fails. */}
      {recording ? (
        <p className="mt-2 flex items-center justify-center gap-2 text-[12.5px] font-medium text-rose">
          <span className="size-2 rounded-full bg-rose animate-pulse-glow" />
          Recording
          <span className="tabular-nums text-foreground">
            {formatElapsed(recordingSeconds)}
          </span>
          <span className="text-muted-foreground">— press again to send</span>
        </p>
      ) : (
        <p
          className={cn(
            "mt-2 text-center text-[12.5px] font-medium transition-opacity",
            sessionState === "error" || sessionDisconnected
              ? "text-rose"
              : active
                ? "text-cyan drop-shadow-[0_0_10px_var(--boss-cyan)]"
                : "text-muted-foreground",
          )}
        >
          {sessionState === "error"
            ? (sessionError ?? "Couldn't reach the BOSS agent. Is it running?")
            : sessionState === "idle" && sessionDisconnected
              ? "BOSS disconnected — tap to reconnect"
              : sessionState && SESSION_STATUS_LABEL[sessionState]
                ? SESSION_STATUS_LABEL[sessionState]
                : listening && denied
                  ? "No microphone — showing a simulated level"
                  : STATE_LABEL[orbState]}
        </p>
      )}

      {/* 3. Console log — transparent, 5 lines, auto-scroll */}
      <div className="mt-3 flex items-stretch gap-3">
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-status-online">
          <span className="size-1.5 rounded-full bg-status-online animate-pulse-glow" />
          Running
        </div>
        <Terminal className="size-4 shrink-0 text-muted-foreground/60" />
        <div
          ref={scrollRef}
          className="scrollbar-none h-[95px] min-w-0 flex-1 overflow-y-auto"
        >
          <div className="font-mono text-[11px] leading-[1.85]">
            <AnimatePresence initial={false}>
              {lines.map((line) => (
                <motion.div
                  key={line.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25 }}
                  className="flex gap-2 whitespace-nowrap"
                >
                  <span className="shrink-0 text-muted-foreground">
                    [{line.timestamp}]
                  </span>
                  <span className={cn("min-w-0", KIND_CLASS[line.kind])}>
                    {line.id === pendingId ? (
                      <Typewriter
                        text={line.message}
                        onDone={() => setPendingId(null)}
                        reducedMotion={reducedMotion}
                      />
                    ) : (
                      line.message
                    )}
                    {line.id === pendingId && !reducedMotion && <ThinkingDots />}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Live transcript, shown above the input while the agent session has
          something to say — the latest line only, so it reads like a caption
          rather than a growing chat log. */}
      {latestTranscript && (
        <p className="mt-2 truncate text-[12px] text-muted-foreground">
          <span
            className={cn(
              "mr-1.5 font-medium",
              latestTranscript.role === "agent" ? "text-violet" : "text-cyan",
            )}
          >
            {latestTranscript.role === "agent" ? "BOSS:" : "You:"}
          </span>
          {latestTranscript.text}
          {!latestTranscript.final && <ThinkingDots />}
        </p>
      )}

      {/* 4. Text input row */}
      <div className="mt-3 flex items-center gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Ask BOSS anything..."
          aria-label="Ask BOSS anything"
          className="min-w-0 flex-1 bg-transparent px-2 text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
        />

        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          Press
          <kbd className="rounded border border-panel-border bg-muted/60 px-2 py-0.5 font-sans text-[11px] text-foreground/80">
            Space
          </kbd>
          to talk
        </span>

        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || listening}
          aria-label="Send message"
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
            value.trim() && !listening
              ? "bg-cyan text-primary-foreground hover:opacity-90"
              : "bg-muted/50 text-muted-foreground",
          )}
        >
          <Send className="size-[15px]" />
        </button>
      </div>
    </div>
  );
}
