"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { OrbScene } from "./orb-scene";
import type { OrbState } from "./types";

/**
 * The R3F canvas. Loaded only on the client via next/dynamic — WebGL has no
 * meaning during SSR, and three pulls in a large bundle we do not want in the
 * initial payload.
 */
export default function VoiceOrbCanvas({
  state,
  audioLevel,
}: {
  state: OrbState;
  audioLevel: number;
}) {
  // A hidden tab should not burn GPU on an orb nobody is looking at.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);

  return (
    <Canvas
      // Far enough back that the pedestal rings and orbit rings stay in frame.
      camera={{ position: [0, 0.3, 4.15], fov: 42 }}
      // Transparent so the dashboard background shows through.
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
      // Capped at 1.5: bloom is fill-rate bound and 2x buys nothing visible.
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "never"}
      // R3F sizes the canvas from its parent via ResizeObserver, which can
      // settle at a stale size when an ancestor is scaled — leaving the orb
      // pinned to one edge. Filling the parent explicitly avoids that.
      style={{ background: "transparent", width: "100%", height: "100%" }}
      // Bloom writes opaque pixels into the corners of its render target, which
      // shows up as a rectangle over the dashboard. The mask fades the canvas
      // edges out so the orb sits on the page with no visible box.
      // [&>canvas]:!size-full targets the canvas element itself: R3F writes an
      // inline pixel width/height onto it from a ResizeObserver, which a CSS
      // transform on an ancestor never re-triggers, so under a scaled stage it
      // sticks at a stale size and the orb sits pinned to one edge.
      className="size-full [&>canvas]:!size-full [mask-image:radial-gradient(circle_closest-side_at_50%_50%,black_62%,transparent_99%)]"
    >
      <OrbScene state={state} audioLevel={audioLevel} />
      <EffectComposer>
        <Bloom
          intensity={0.85}
          // High threshold: only the rim, dots and rings bloom — not the body.
          // Lower than this and the saturated body blooms into a flat disc.
          luminanceThreshold={0.78}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
