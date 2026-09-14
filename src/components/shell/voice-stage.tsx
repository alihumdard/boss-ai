"use client";

import { useVoiceInput } from "@/lib/use-voice-input";
import { useVoiceSession } from "@/lib/use-voice-session";
import { AgentNetwork } from "@/components/network/agent-network";
import { VoiceOrb } from "@/components/orb/voice-orb";
import { VoiceConsole } from "@/components/panels/voice-console";

// LiveKit is only usable once the public URL is configured. Falls back to
// the mic-only visualiser (no agent, no transcript) otherwise.
const LIVEKIT_ENABLED = Boolean(process.env.NEXT_PUBLIC_LIVEKIT_URL);

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
  const fallback = useVoiceInput();
  const session = useVoiceSession();

  // Push-to-talk: the mic button reflects whether we're capturing this turn,
  // not merely whether the session is connected.
  const listening = LIVEKIT_ENABLED ? session.recording : fallback.listening;
  const orbState = LIVEKIT_ENABLED ? session.orbState : fallback.orbState;
  const audioLevel = LIVEKIT_ENABLED ? session.audioLevel : fallback.audioLevel;
  const denied = LIVEKIT_ENABLED
    ? session.state === "error" && /microphone/i.test(session.error ?? "")
    : fallback.denied;

  function toggle() {
    if (!LIVEKIT_ENABLED) {
      fallback.toggle();
      return;
    }
    session.toggleRecording();
  }

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
        sessionState={LIVEKIT_ENABLED ? session.state : undefined}
        sessionError={LIVEKIT_ENABLED ? session.error : null}
        sessionDisconnected={LIVEKIT_ENABLED ? session.disconnected : false}
        recording={LIVEKIT_ENABLED ? session.recording : false}
        recordingSeconds={LIVEKIT_ENABLED ? session.recordingSeconds : 0}
        transcript={LIVEKIT_ENABLED ? session.transcript : []}
        className="shrink-0"
      />
    </>
  );
}
