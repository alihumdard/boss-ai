"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  STAGE_W,
  FULL_STAGE,
  COMPACT_STAGE,
  type StageGeometry,
} from "@/lib/network-layout";
import { ConnectionLines } from "./connection-lines";
import { AgentNode } from "./agent-node";
import { AgentGrid } from "./agent-grid";
import { cn } from "@/lib/utils";

interface AgentNetworkProps {
  /** The central hub. Section 5 passes the VoiceOrb here. */
  hub?: ReactNode;
  className?: string;
}

/** Measures the box the stage has to fit into. */
function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, box };
}

/** Viewport width, for breakpoint decisions. */
function useViewportWidth() {
  const [vw, setVw] = useState(0);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vw;
}

export function AgentNetwork({ hub, className }: AgentNetworkProps) {
  const { ref, box } = useBox();
  const vw = useViewportWidth();

  // Below 768px the arcs cannot hold their gaps: orb on top, cards in a
  // two-column grid, no connectors.
  const stacked = vw > 0 && vw < 768;
  // Below 1280px — or whenever the box is too short for the full arcs —
  // switch to the compact stage: shorter, with icon + name cards.
  // Compact only when the box genuinely cannot hold the full arcs. Width
  // alone is not the trigger: a 1366px window still has plenty of width, and
  // forcing compact there shrank the orb for no reason.
  const compact =
    vw > 0 && (vw < 1024 || (box.h > 0 && box.h < 330));

  const geo: StageGeometry = compact ? COMPACT_STAGE : FULL_STAGE;

  // Cards are centred on their coordinate, so they hang half their width and
  // height outside the nominal stage box. Fit that real extent, not the
  // nominal one, or the outermost cards are cut off.
  const scale = box.w
    ? Math.min(box.w / (STAGE_W + geo.cardW), box.h / (geo.height + geo.cardH))
    : 0;

  if (stacked) {
    return (
      <div ref={ref} className={cn("relative h-full min-h-0 w-full", className)}>
        <div className="flex h-full flex-col items-center gap-4 overflow-y-auto">
          <div className="shrink-0 scale-75">{hub}</div>
          <AgentGrid />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      // h-full: as a CSS grid row's child this has no flex-basis to size it,
      // so without an explicit height it collapses to content height (0,
      // since the inner stage is visibility:hidden until measured) and the
      // ResizeObserver never gets a real box to measure.
      className={cn(
        "relative grid h-full min-h-0 w-full place-items-center",
        className,
      )}
    >
      {/* The fixed design stage, scaled as a single unit. Everything inside
          is positioned in stage units, so nothing shifts relative to
          anything else at any viewport size.

          The outer box carries the *scaled* size so the flex parent lays out
          against what is actually drawn; the inner box keeps its design size
          and is scaled from its centre. */}
      <div
        className="relative grid place-items-center"
        style={{
          width: scale ? STAGE_W * scale : "100%",
          height: scale ? geo.height * scale : "100%",
          // Hidden until measured, so the first paint is not full-size.
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: STAGE_W,
            height: geo.height,
            // Pinned to the wrapper's centre and pulled back by half its own
            // design size, so the scale cannot drift the stage sideways.
            transform: `translate(-50%, -50%) scale(${scale || 1})`,
          }}
        >
          <ConnectionLines geo={geo} compact={compact} />

          {/* A fixed box centred on the hub coordinate, with the orb centred
              inside it. Sizing the box explicitly (rather than letting it
              shrink-wrap a scaled child) is what keeps the orb on the hub at
              every stage variant. */}
          {/* A plain box centred on the hub coordinate. No transform here:
              R3F measures the canvas parent with a ResizeObserver, which a CSS
              transform does not trigger, so a scaled ancestor leaves the
              canvas stuck at a stale size. The orb is handed its pixel size
              instead — see VoiceStage. */}
          <div
            className="absolute grid place-items-center"
            style={{
              left: geo.hub.x - geo.orbR,
              top: geo.hub.y - geo.orbR,
              width: geo.orbR * 2,
              height: geo.orbR * 2,
            }}
          >
            {hub}
          </div>

          {geo.nodes.map((node, i) => (
            <AgentNode
              key={node.id}
              node={node}
              index={i}
              geo={geo}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
