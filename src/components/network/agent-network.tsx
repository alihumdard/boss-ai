"use client";

import type { ReactNode } from "react";
import { NETWORK_NODES, HUB } from "@/lib/network-layout";
import { ConnectionLines } from "./connection-lines";
import { AgentNode } from "./agent-node";
import { cn } from "@/lib/utils";

interface AgentNetworkProps {
  /** The central hub. Section 5 passes the VoiceOrb here. */
  hub?: ReactNode;
  className?: string;
}

export function AgentNetwork({ hub, className }: AgentNetworkProps) {
  return (
    <div className={cn("relative min-h-0 w-full", className)}>
      {/* Connectors sit under the cards but over the background. */}
      <ConnectionLines />

      {/* Hub slot, centred on the same coordinate the traces converge on. */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${HUB.x}%`, top: `${HUB.y}%` }}
      >
        {hub}
      </div>

      {NETWORK_NODES.map((node, i) => (
        <AgentNode key={node.id} node={node} index={i} />
      ))}
    </div>
  );
}
