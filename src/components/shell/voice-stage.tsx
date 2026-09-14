"use client";

import { useVoiceInput } from "@/lib/use-voice-input";
import { AgentNetwork } from "@/components/network/agent-network";
import { VoiceOrb } from "@/components/orb/voice-orb";
import { VoiceConsole } from "@/components/panels/voice-console";

/**
 * Owns the voice session so the orb and the Voice Console stay in sync: the
 * mic level the console meters is the same value driving the orb's geometry.
 *
 * Renders the centre column in plain document flow: network (flex-1, takes
 * whatever height is left — the greeting lives in the top bar, not here) ->
 * voice console (content-sized, sits below in normal flow, no absolute
 * positioning).
 */
export function VoiceStage() {
  const { listening, audioLevel, orbState, denied, toggle } = useVoiceInput();

  return (
    <>
      <AgentNetwork
        className="min-h-0 flex-1"
        hub={
          <VoiceOrb
            // Fills the hub box the stage gives it (sized from that variant's
            // ORB_R), so the connectors land on the visible disc's edge.
            fill
            state={orbState}
            // Idle keeps a gentle floor so the orb never looks frozen.
            audioLevel={listening ? audioLevel : 0.28}
          />
        }
      />

      <VoiceConsole
        orbState={orbState}
        listening={listening}
        audioLevel={audioLevel}
        denied={denied}
        onToggleListening={toggle}
        className="shrink-0"
      />
    </>
  );
}
