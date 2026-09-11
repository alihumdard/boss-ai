"use client";

import { motion } from "framer-motion";
import type { NetworkNode } from "@/lib/network-layout";
import { accentStyle } from "@/lib/accent";
import { StatusDot } from "@/components/ui-kit/status-dot";
import { cn } from "@/lib/utils";

interface AgentNodeProps {
  node: NetworkNode;
  index: number;
}

export function AgentNode({ node, index }: AgentNodeProps) {
  const Icon = node.icon;
  const isSoon = node.status === "coming-soon";

  return (
    <motion.div
      style={{
        ...accentStyle(node.accent),
        left: `${node.pos.x}%`,
        top: `${node.pos.y}%`,
      }}
      // Anchored so the card's connector edge sits on its coordinate.
      className={cn(
        "absolute -translate-y-1/2",
        node.pos.anchor === "right" ? "-translate-x-full" : "translate-x-0",
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06 }}
    >
      <div
        className={cn(
          "group flex w-[212px] items-center gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-md transition-colors",
          isSoon
            ? "border-panel-border/60 bg-card/35"
            : "border-[var(--accent-color)]/30 bg-card/70 hover:border-[var(--accent-color)]/55",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border",
            isSoon
              ? "border-panel-border bg-muted/30"
              : "border-[var(--accent-color)]/35 bg-[var(--accent-color)]/15 shadow-[0_0_16px_-4px_var(--accent-color)]",
          )}
        >
          <Icon
            className={cn(
              "size-[18px]",
              isSoon ? "text-muted-foreground/50" : "text-[var(--accent-color)]",
            )}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-[12.5px] font-medium leading-tight",
              isSoon ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            {node.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
            {node.tagline}
          </p>
          <StatusDot status={node.status} className="mt-1" />
        </div>
      </div>
    </motion.div>
  );
}
