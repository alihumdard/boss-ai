"use client";

import { motion } from "framer-motion";
import {
  FULL_STAGE,
  type NetworkNode,
  type StageGeometry,
} from "@/lib/network-layout";
import { accentStyle } from "@/lib/accent";
import { StatusDot } from "@/components/ui-kit/status-dot";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

interface AgentNodeProps {
  node: NetworkNode;
  index: number;
  /** Icon + name only, for narrow viewports. */
  compact?: boolean;
  geo?: StageGeometry;
}

export function AgentNode({
  node,
  index,
  compact,
  geo = FULL_STAGE,
}: AgentNodeProps) {
  const Icon = node.icon;
  const isSoon = node.status === "coming-soon";
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      style={{
        ...accentStyle(node.accent),
        left: node.pos.x,
        top: node.pos.y,
        width: geo.cardW,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        // Cards drift a couple of px so the network feels alive. Kept small
        // enough that it never eats into the gap between neighbours. Dropped
        // to a fixed 0 under reduced motion rather than looping.
        y: reducedMotion ? 0 : [0, index % 2 === 0 ? -3 : 3, 0],
      }}
      transition={{
        opacity: { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.1 + index * 0.06 },
        scale: { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.1 + index * 0.06 },
        y: reducedMotion
          ? { duration: 0 }
          : {
              duration: 5 + (index % 3),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            },
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl backdrop-blur-md transition-colors",
          compact ? "px-2.5 py-2" : "px-3 py-2.5",
          isSoon
            ? // Coming soon: visible card background (a step lighter than the
              // page) with a dim dashed border — legible, not near-invisible,
              // but clearly secondary to a live card. Never below 0.75 opacity
              // on the card as a whole.
              "border border-dashed border-border-soon bg-card-soon opacity-75"
            : // Active: solid panel, border in the agent's own colour, soft
              // outer glow — this is the card that should read as dominant.
              "border border-[var(--accent-color)]/50 bg-panel-strong shadow-[0_0_28px_-8px_var(--accent-color)] hover:border-[var(--accent-color)]/75",
        )}
      >
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full",
            compact ? "size-9" : "size-11",
            isSoon
              ? // Desaturated (not simply grey) so the agent's own colour
                // still identifies it, just muted.
                "bg-[var(--accent-color)]/18 saturate-[0.35]"
              : // Round icon chip with the agent's own colour gradient + glow.
                "bg-[radial-gradient(circle_at_30%_25%,var(--accent-color),transparent_70%)] shadow-[0_0_22px_-3px_var(--accent-color)] ring-1 ring-[var(--accent-color)]/60",
          )}
        >
          <Icon
            className={cn(
              compact ? "size-[17px]" : "size-[19px]",
              isSoon ? "text-[var(--accent-color)]/70 saturate-[0.35]" : "text-foreground",
            )}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              // Declared larger than the visual target (13px/11px minimums):
              // the whole network stage is drawn at design size and then
              // scaled down with a CSS transform, which shrinks rendered text
              // below its declared size. These values are picked so the
              // *visual* result still clears 13px/11px at the scales the
              // stage actually renders at — see network-layout.ts's Step 3
              // notes if you need to re-derive them.
              compact ? "text-[15px]" : "text-[16px]",
              "leading-tight",
              isSoon
                ? "font-medium text-muted-foreground"
                : "font-semibold text-foreground",
            )}
          >
            {node.name}
          </p>
          {!compact && (
            <>
              {/* No truncation: the card is sized to fit the longest tagline.
                  Dropped entirely in compact mode instead of shrinking further
                  or truncating, per the legibility rule. */}
              <p
                className={cn(
                  "mt-0.5 text-[13px] leading-tight",
                  isSoon ? "text-muted-foreground-dim" : "text-muted-foreground",
                )}
              >
                {node.tagline}
              </p>
              <StatusDot status={node.status} className="mt-1" />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
