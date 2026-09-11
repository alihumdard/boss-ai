"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VoiceOrbProps } from "./types";

/**
 * The WebGL canvas is client-only: it is meaningless during SSR and pulls in
 * three.js, which we keep out of the initial payload. Until it loads (and on
 * any device where it cannot), the static fallback stands in — so the hub of
 * the network is never an empty hole.
 */
const OrbFallback = ({ size }: { size: number }) => (
  <Image
    src="/orb-fallback.svg"
    alt=""
    width={size}
    height={size}
    priority
    className="size-full select-none object-contain"
  />
);

const VoiceOrbCanvas = dynamic(() => import("./voice-orb-canvas"), {
  ssr: false,
  loading: () => <OrbFallback size={260} />,
});

export function VoiceOrb({
  state = "listening",
  audioLevel = 0.35,
  size = 300,
  label = "BOSS",
  className,
}: VoiceOrbProps) {
  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Soft ground glow behind the canvas */}
      <div
        className="pointer-events-none absolute inset-[12%] rounded-full bg-blue/25 blur-2xl"
        aria-hidden
      />

      <div className="absolute inset-0">
        <VoiceOrbCanvas state={state} audioLevel={audioLevel} />
      </div>

      {/* Wordmark sits over the orb, as in the reference */}
      <div className="pointer-events-none relative text-center">
        <p className="font-heading text-[22px] leading-none tracking-[0.34em] text-foreground drop-shadow-[0_0_18px_var(--boss-cyan)]">
          {label}
        </p>
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.3em] text-cyan/80">
          AI Assistant
        </p>
      </div>
    </div>
  );
}
