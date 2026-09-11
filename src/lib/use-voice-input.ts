"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbState } from "@/components/orb/types";

interface VoiceInput {
  listening: boolean;
  /** Smoothed 0-1 level, suitable for driving the orb. */
  audioLevel: number;
  orbState: OrbState;
  /** True when the browser denied or has no microphone. */
  denied: boolean;
  toggle: () => void;
  stop: () => void;
}

/**
 * Owns microphone capture and reduces it to a single normalised level.
 *
 * The mic is only requested when the user actually starts listening, never on
 * mount. If permission is refused we fall back to a synthesised level so the
 * orb still animates rather than freezing.
 */
export function useVoiceInput(): VoiceInput {
  const [listening, setListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [denied, setDenied] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    setAudioLevel(0);
  }, []);

  const stop = useCallback(() => {
    setListening(false);
    teardown();
  }, [teardown]);

  useEffect(() => {
    if (!listening) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const ctx = new AudioContext();
        ctxRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);

        const buf = new Uint8Array(analyser.frequencyBinCount);
        let smoothed = 0;

        const tick = () => {
          analyser.getByteFrequencyData(buf);
          // RMS across the spectrum, normalised to roughly 0-1.
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length) / 255;
          const boosted = Math.min(rms * 2.6, 1);
          smoothed += (boosted - smoothed) * 0.25;
          setAudioLevel(smoothed);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (cancelled) return;
        setDenied(true);
        // No mic: drive a gentle synthetic waveform so the orb still reacts.
        const started = performance.now();
        const tick = () => {
          const t = (performance.now() - started) / 1000;
          const v = 0.35 + Math.sin(t * 2.1) * 0.16 + Math.sin(t * 5.3) * 0.09;
          setAudioLevel(Math.max(0, Math.min(v, 1)));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      }
    }

    void start();
    return () => {
      cancelled = true;
      teardown();
    };
  }, [listening, teardown]);

  const toggle = useCallback(() => setListening((v) => !v), []);

  return {
    listening,
    audioLevel,
    orbState: listening ? "listening" : "idle",
    denied,
    toggle,
    stop,
  };
}
