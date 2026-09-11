"use client";

import { motion } from "framer-motion";
import { NETWORK_NODES, connectorPath, HUB } from "@/lib/network-layout";
import { accentVar } from "@/lib/accent";

/**
 * One SVG overlay drawing every card-to-hub connector.
 *
 * The viewBox is a 0-100 square with preserveAspectRatio="none", so path
 * coordinates are the same percentages the cards are positioned with.
 * Stroke widths are therefore given in vector-effect="non-scaling-stroke"
 * to stay visually even after the non-uniform scale.
 */
export function ConnectionLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {NETWORK_NODES.map((node) => {
          const color = accentVar(node.accent);
          return (
            <linearGradient
              key={node.id}
              id={`trace-${node.id}`}
              gradientUnits="userSpaceOnUse"
              x1={node.pos.x}
              y1={node.pos.y}
              x2={HUB.x}
              y2={HUB.y}
            >
              {/* Bright at the card, fading into the orb's own glow */}
              <stop offset="0%" stopColor={color} stopOpacity={0.75} />
              <stop offset="55%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          );
        })}
      </defs>

      {NETWORK_NODES.map((node, i) => {
        const d = connectorPath(node.pos);
        const dim = node.status === "coming-soon";

        return (
          <g key={node.id} opacity={dim ? 0.28 : 1}>
            {/* Static trace */}
            <path
              d={d}
              fill="none"
              stroke={`url(#trace-${node.id})`}
              strokeWidth={1.1}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* Pulse travelling toward the hub. Live agents only. */}
            {!dim && (
              <motion.path
                d={d}
                fill="none"
                stroke={accentVar(node.accent)}
                strokeWidth={1.8}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                pathLength={1}
                strokeDasharray="0.12 0.88"
                initial={{ strokeDashoffset: 1, opacity: 0 }}
                animate={{ strokeDashoffset: [1, 0], opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 3.2,
                  delay: i * 0.55,
                  repeat: Infinity,
                  repeatDelay: 1.4,
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
