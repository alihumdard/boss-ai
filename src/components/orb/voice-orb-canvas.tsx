"use client";

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
  return (
    <Canvas
      camera={{ position: [0, 0, 3.1], fov: 45 }}
      // Transparent so the dashboard background shows through.
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ background: "transparent" }}
    >
      <OrbScene state={state} audioLevel={audioLevel} />
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
