"use client";

import { motion } from "framer-motion";
import {
  connectorPath,
  connectorEnd,
  cardAnchor,
  STAGE_W,
  FULL_STAGE,
  type StageGeometry,
} from "@/lib/network-layout";
import { accentVar } from "@/lib/accent";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * One SVG overlay drawing every card-to-orb connector.
 *
 * The viewBox is the design stage itself, so path coordinates are the very
 * same stage units the cards are positioned with — a connector can never
 * drift away from the card it belongs to, at any scale.
 */
export function ConnectionLines({
  compact,
  geo = FULL_STAGE,
}: {
  compact?: boolean;
  geo?: StageGeometry;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox={`0 0 ${STAGE_W} ${geo.height}`}
      aria-hidden
    >
      <defs>
        {geo.nodes.map((node) => {
          const color = accentVar(node.accent);
          const start = cardAnchor(node.pos, geo);
          const end = connectorEnd(node.pos, geo);
          return (
            <linearGradient
              key={node.id}
              id={`trace-${node.id}`}
              gradientUnits="userSpaceOnUse"
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
            >
              {/* The agent's own colour at the card, fading to the orb's cyan.
                  Fully opaque at both ends now (was 0.7-1) so the trace reads
                  as a bright, saturated line rather than a translucent one. */}
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="55%" stopColor={color} stopOpacity={0.95} />
              <stop
                offset="100%"
                stopColor="var(--boss-cyan)"
                stopOpacity={0.9}
              />
            </linearGradient>
          );
        })}

        {/* Bloom so the traces read as glowing light, not thin hairlines —
            two blur passes layered (a wide soft halo plus a tighter core)
            reads brighter than one wide blur at the same total spread. */}
        <filter id="trace-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="wide" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="tight" />
          <feMerge>
            <feMergeNode in="wide" />
            <feMergeNode in="tight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {geo.nodes.map((node, i) => {
        const d = connectorPath(node.pos, geo);
        const start = cardAnchor(node.pos, geo);
        const end = connectorEnd(node.pos, geo);
        const dim = node.status === "coming-soon";
        const color = accentVar(node.accent);
        const working = node.status === "working";

        return (
          <g key={node.id} opacity={dim ? 0.75 : 1}>
            {/* Coming-soon links: dashed, dim neutral, no glow — visible but
                clearly secondary. A plain slate stroke rather than the
                agent's own gradient, since that colour is what read as
                "glowing" before. Still drifts gently so the network doesn't
                look half-dead. */}
            {dim && !reducedMotion ? (
              <motion.path
                d={d}
                fill="none"
                stroke="var(--boss-slate)"
                strokeOpacity={0.55}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeDasharray="5 6"
                vectorEffect="non-scaling-stroke"
                animate={{ strokeDashoffset: [0, -22] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ) : dim ? (
              <path
                d={d}
                fill="none"
                stroke="var(--boss-slate)"
                strokeOpacity={0.55}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeDasharray="5 6"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <path
                d={d}
                fill="none"
                stroke={`url(#trace-${node.id})`}
                strokeWidth={2.6}
                strokeLinecap="round"
                filter="url(#trace-glow)"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Terminal dots at the card edge and on the orb's rim, glowing
                like the line itself rather than sitting as flat fills. */}
            {!dim && (
              <>
                <circle
                  cx={start.x}
                  cy={start.y}
                  r={3.5}
                  fill={color}
                  filter="url(#trace-glow)"
                />
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={3}
                  fill="var(--boss-cyan)"
                  filter="url(#trace-glow)"
                />
              </>
            )}

            {/* A light pulse travelling card -> orb. Live agents only,
                staggered so the network never flashes in unison, and skipped
                entirely under reduced motion. */}
            {!dim && !compact && !reducedMotion && (
              <motion.path
                d={d}
                fill="none"
                stroke="var(--orb-dot)"
                strokeWidth={3.2}
                strokeLinecap="round"
                filter="url(#trace-glow)"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="0.12 0.88"
                initial={{ strokeDashoffset: 1, opacity: 0 }}
                animate={{ strokeDashoffset: [1, 0], opacity: [0, 1, 1, 0] }}
                transition={{
                  // A working agent's line pulses noticeably faster.
                  duration: working ? 1.6 : 3.2,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: working ? 0.3 : 1.4,
                  ease: "easeInOut",
                  times: [0, 0.15, 0.85, 1],
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
