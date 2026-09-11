"use client";

import type { ReactNode } from "react";
import { useVoiceInput } from "@/lib/use-voice-input";
import { AgentNetwork } from "@/components/network/agent-network";
import { VoiceOrb } from "@/components/orb/voice-orb";
import { CommandBar } from "./command-bar";

/**
 * Owns the voice session so the orb and the command bar stay in sync: the
 * mic level the bar meters is the same value driving the orb's geometry.
 *
 * Content that sits between the network and the bar is passed as a slot.
 * (A render prop would be a function crossing the server/client boundary,
 * which React cannot serialize.)
 */
export function VoiceStage({ children }: { children?: ReactNode }) {
  const { listening, audioLevel, orbState, denied, toggle } = useVoiceInput();

  return (
    <>
      <AgentNetwork
        className="min-h-[330px] flex-1"
        hub={
          <VoiceOrb
            size={360}
            state={orbState}
            // Idle keeps a gentle floor so the orb never looks frozen.
            audioLevel={listening ? audioLevel : 0.28}
          />
        }
      />
      {children}
      <CommandBar
        listening={listening}
        audioLevel={audioLevel}
        denied={denied}
        onToggleListening={toggle}
      />
    </>
  );
}
