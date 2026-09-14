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
  fill = false,
  label = "BOSS",
  className,
}: VoiceOrbProps) {
  return (
    <div
      className={cn(
        // @container so the wordmark can size itself in cqw against this box.
        "@container relative grid place-items-center",
        fill && "size-full",
        className,
      )}
      style={fill ? undefined : { width: size, height: size }}
    >
      {/* Soft ground glow behind the canvas */}
      <div
        className="pointer-events-none absolute inset-[18%] rounded-full bg-blue/20 blur-3xl"
        aria-hidden
      />

      {/* The canvas is drawn larger than the layout box so the pedestal rings
          and halo have room to fall off before the masked edge. The mask lives
          on this wrapper: bloom writes non-transparent pixels into the corners
          of its render target, which would otherwise show as a box edge. */}
      {/* The canvas overhangs its box so the pedestal rings and halo have room
          to fade before the mask. Keep this inset and GLOBE_PAINT_SCALE in
          network-layout.ts in step — that constant is what stops cards from
          overlapping the painted globe. */}
      <div className="pointer-events-none absolute -inset-[12%] [&_canvas]:!size-full">
        <VoiceOrbCanvas state={state} audioLevel={audioLevel} />
      </div>

      {/* Wordmark sits over the orb, as in the reference. Absolutely centred
          rather than in flow: in flow its box contributes to the parent grid's
          sizing and pushes the orb off-centre. */}
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        {/* indent-[Xem] cancels the trailing letter-space that tracking adds
            after the last glyph, which would otherwise push the text right of
            the orb's true centre. */}
        {/* Sized in cqw so the wordmark scales with the orb box rather than
            staying a fixed size when the stage variant changes. */}
        <p className="font-heading text-[9cqw] leading-none tracking-[0.38em] indent-[0.38em] text-foreground drop-shadow-[0_0_22px_var(--boss-cyan)]">
          {label}
        </p>
        <p className="mt-[2cqw] text-[3.6cqw] uppercase tracking-[0.32em] indent-[0.32em] text-cyan/85 drop-shadow-[0_0_12px_var(--boss-cyan)]">
          AI Assistant
        </p>
      </div>
    </div>
  );
}
