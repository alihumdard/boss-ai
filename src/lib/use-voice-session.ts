"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  LocalAudioTrack,
  Room,
  RoomEvent,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Track,
  TranscriptionSegment,
  Participant,
} from "livekit-client";
import type { OrbState } from "@/components/orb/types";

export type VoiceSessionState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface TranscriptLine {
  role: "user" | "agent";
  text: string;
  final: boolean;
}

interface VoiceSession {
  state: VoiceSessionState;
  orbState: OrbState;
  audioLevel: number;
  transcript: TranscriptLine[];
  error: string | null;
  /** True once the agent disconnected after a connected session — distinguishes
   *  "never started" idle from "the call ended" idle so the UI can prompt a
   *  reconnect instead of looking like a fresh, never-used mic. */
  disconnected: boolean;
  /** Push-to-talk: the mic track is live and capturing this turn. */
  recording: boolean;
  /** Seconds elapsed in the current recording, 0 when not recording. */
  recordingSeconds: number;
  /** Connects if needed, then toggles the mic track on/off. Stopping commits
   *  the captured turn to the agent. */
  toggleRecording: () => void;
  disconnect: () => void;
}

const SESSION_TO_ORB: Record<VoiceSessionState, OrbState> = {
  idle: "idle",
  connecting: "idle",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  error: "idle",
};

/**
 * Owns a LiveKit room connection to the BOSS voice agent: publishes the mic,
 * reads back the agent's audio + transcription events, and reduces both
 * sides to a single level meter so the orb reacts to whoever is talking.
 */
export function useVoiceSession(): VoiceSession {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const rafRef = useRef<number | null>(null);
  const speakingRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const levelCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guards the async connect+enable path so a double-press can't open two
  // rooms or interleave enable/disable out of order.
  const busyRef = useRef(false);

  const stopLevelLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    void levelCtxRef.current?.close();
    levelCtxRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecordingSeconds(0);
  }, []);

  /** Meters whichever MediaStream is passed — the local mic while recording. */
  const startLevelLoop = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    levelCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    const buf = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));

    let smoothed = 0;
    const tick = () => {
      analyser.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length) / 255;
      const boosted = Math.min(rms * 2.6, 1);
      smoothed += (boosted - smoothed) * 0.25;
      setAudioLevel(smoothed);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const disconnect = useCallback(() => {
    stopLevelLoop();
    stopTimer();
    setRecording(false);
    roomRef.current?.disconnect();
    roomRef.current = null;
    setState("idle");
    setDisconnected(wasConnectedRef.current);
  }, [stopLevelLoop, stopTimer]);

  /** Joins the room with the mic published but muted — push-to-talk enables
   *  it per turn. Resolves with the connected Room, or null on failure. */
  const connect = useCallback(async (): Promise<Room | null> => {
    if (roomRef.current) return roomRef.current;
    setError(null);
    setDisconnected(false);
    wasConnectedRef.current = false;
    setState("connecting");

    try {
      const res = await fetch("/api/livekit-token", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not reach the voice agent.");
      }
      const { token, url } = (await res.json()) as {
        token: string;
        url: string;
      };

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Disconnected, () => {
        stopLevelLoop();
        roomRef.current = null;
        setState((s) => (s === "error" ? s : "idle"));
        setDisconnected(wasConnectedRef.current);
      });

      room.on(RoomEvent.ConnectionStateChanged, (connState) => {
        if (connState === ConnectionState.Reconnecting) setState("connecting");
      });

      room.on(
        RoomEvent.TrackSubscribed,
        (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind !== Track.Kind.Audio) return;
          attachAgentAudio(track);
          void participant;
        },
      );

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        const agentSpeaking = speakers.some((p) => !p.isLocal);
        speakingRef.current = agentSpeaking;
        setState((s) => {
          if (s === "error" || s === "connecting" || s === "idle") return s;
          // "listening" doubles as the resting state for a connected
          // session: the mic track is muted between turns, so audioLevel
          // sits at 0 and the orb idles rather than reacting.
          return agentSpeaking ? "speaking" : "listening";
        });
      });

      room.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          const role: TranscriptLine["role"] =
            participant?.isLocal === false ? "agent" : "user";
          for (const seg of segments) {
            setTranscript((prev) => {
              const idx = prev.findIndex(
                (l) => l.role === role && !l.final && seg.id,
              );
              const line: TranscriptLine = {
                role,
                text: seg.text,
                final: seg.final,
              };
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = line;
                return next;
              }
              return [...prev.slice(-19), line];
            });
            if (role === "agent" && !seg.final) setState("thinking");
          }
        },
      );

      function attachAgentAudio(track: RemoteTrack) {
        const el = track.attach();
        el.style.display = "none";
        document.body.appendChild(el);
      }

      await room.connect(url, token);

      // Publish the mic up front so permission is granted once, at connect
      // time, then immediately mute it: nothing reaches the agent until the
      // user presses record.
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(false);
      } catch {
        throw new Error("Microphone access was denied.");
      }

      wasConnectedRef.current = true;
      setState("listening");
      return room;
    } catch (err) {
      stopLevelLoop();
      roomRef.current?.disconnect();
      roomRef.current = null;
      setError(err instanceof Error ? err.message : "Connection failed.");
      setState("error");
      return null;
    }
  }, [stopLevelLoop]);

  const toggleRecording = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      if (recording) {
        // Stop: mute the mic, then commit the captured turn. The agent only
        // replies here — never on silence, since turn detection is manual.
        const room = roomRef.current;
        stopLevelLoop();
        stopTimer();
        setRecording(false);
        if (!room) return;
        await room.localParticipant.setMicrophoneEnabled(false);
        setState("thinking");

        const agent = [...room.remoteParticipants.values()][0];
        if (!agent) {
          setError("BOSS isn't in the room yet.");
          setState("error");
          return;
        }
        try {
          await room.localParticipant.performRpc({
            destinationIdentity: agent.identity,
            method: "commit_user_turn",
            payload: "",
          });
        } catch {
          setError("Couldn't send your message to BOSS.");
          setState("error");
        }
        return;
      }

      // Start: connect on first use, then unmute and meter the mic.
      const room = roomRef.current ?? (await connect());
      if (!room) return;

      const pub = await room.localParticipant.setMicrophoneEnabled(true);
      const track = pub?.track as LocalAudioTrack | undefined;
      const mediaTrack = track?.mediaStreamTrack;
      if (!mediaTrack) {
        setError("Microphone access was denied.");
        setState("error");
        return;
      }

      startLevelLoop(new MediaStream([mediaTrack]));
      setRecording(true);
      setState("listening");
      setRecordingSeconds(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 250);
    } finally {
      busyRef.current = false;
    }
  }, [recording, connect, startLevelLoop, stopLevelLoop, stopTimer]);

  useEffect(() => {
    return () => {
      stopLevelLoop();
      stopTimer();
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, [stopLevelLoop, stopTimer]);

  return {
    state,
    orbState: SESSION_TO_ORB[state],
    audioLevel,
    transcript,
    error,
    disconnected,
    recording,
    recordingSeconds,
    toggleRecording,
    disconnect,
  };
}
