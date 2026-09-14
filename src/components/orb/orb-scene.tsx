"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbState } from "./types";

/**
 * Reads a design token and converts it to a THREE.Color.
 *
 * The tokens are authored in OKLCH, which getComputedStyle resolves to a
 * `lab()` / `oklch()` string that three.js cannot parse — it would silently
 * fall back to black and an additively-blended orb would vanish. So we let
 * the browser do the conversion: painting the colour onto a 1x1 2D canvas
 * yields plain sRGB bytes that three understands.
 */
function readToken(name: string, fallback: string): THREE.Color {
  if (typeof window === "undefined") return new THREE.Color(fallback);

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (!raw) return new THREE.Color(fallback);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return new THREE.Color(fallback);

    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

    return new THREE.Color().setRGB(
      r / 255,
      g / 255,
      b / 255,
      THREE.SRGBColorSpace,
    );
  } catch {
    return new THREE.Color(fallback);
  }
}

/** Deterministic PRNG — the globe must be identical on every render. */
function makeRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function usePrefersReducedMotion() {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
}

/* Per-state tuning. `spin` is radians/sec; `rim` scales the fresnel edge. */
const STATE = {
  idle: { spin: (Math.PI * 2) / 60, rim: 1, halo: 1 },
  listening: { spin: (Math.PI * 2) / 48, rim: 1.35, halo: 1.15 },
  thinking: { spin: (Math.PI * 2) / 18, rim: 1.15, halo: 1.05 },
  speaking: { spin: (Math.PI * 2) / 34, rim: 1.5, halo: 1.3 },
} satisfies Record<OrbState, { spin: number; rim: number; halo: number }>;

const GLOBE_R = 1;
const SURFACE_R = 1.012;

/* ------------------------------------------------------------------ */
/* Inner globe: solid deep-blue body with a bright fresnel rim         */
/* ------------------------------------------------------------------ */

const globeVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const globeFragment = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uRim;
  uniform float uRimPower;
  uniform float uTime;
  uniform float uShimmer;

  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    // Fresnel against the view vector, so the rim stays put as the globe
    // spins — this is what makes it read as a sphere rather than a blob.
    float fres = 1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
    float rim = pow(fres, 3.4) * uRimPower;

    // "thinking" sweeps a shimmer band across the body.
    float band = smoothstep(0.16, 0.0, abs(vNormal.y - sin(uTime * 1.6) * 0.9));

    // The body stays dark and only slightly translucent; nearly all the light
    // lives in the rim. Without this the sphere blows out into a flat disc and
    // swallows the dot network drawn just above its surface.
    // Darken toward the centre of the disc so the globe has depth: a flat
    // core reads as a sticker, not a sphere.
    float depth = mix(0.45, 1.0, fres);
    vec3 col = uCore * depth + uRim * rim * 0.85 + uRim * band * uShimmer * 0.3;

    // Alpha rides the fresnel so the centre of the sphere stays see-through
    // and the surface dot network drawn above it remains visible. A flat
    // alpha here is what turned the globe into a solid disc.
    float alpha = 0.55 + rim * 0.45 + band * uShimmer * 0.2;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function Globe({
  spin,
  rimPower,
  shimmer,
  reduced,
}: {
  spin: React.RefObject<number>;
  rimPower: React.RefObject<number>;
  shimmer: React.RefObject<number>;
  reduced: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uCore: { value: readToken("--orb-core", "#0b1f4d") },
      uRim: { value: readToken("--boss-cyan", "#22d3ee") },
      uRimPower: { value: 1 },
      uTime: { value: 0 },
      uShimmer: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value += delta;
      mat.current.uniforms.uRimPower.value = rimPower.current;
      mat.current.uniforms.uShimmer.value = shimmer.current;
    }
    if (mesh.current && !reduced) mesh.current.rotation.y += delta * spin.current;
  });

  return (
    <mesh ref={mesh}>
      {/* A real sphere with no vertex displacement: always perfectly round. */}
      <sphereGeometry args={[GLOBE_R, 96, 96]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={globeVertex}
        fragmentShader={globeFragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Surface dot network: Fibonacci points + faint neighbour links       */
/* ------------------------------------------------------------------ */

// Reduced by about a third (was 2000) so the mesh reads as a network of
// points rather than a dense, busy haze that competes with the label.
const POINT_COUNT = 1350;

const pointsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uLevel;
  attribute float aPhase;
  varying float vTwinkle;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Twinkle: each point breathes on its own phase.
    vTwinkle = 0.45 + 0.55 * sin(uTime * 1.7 + aPhase * 6.2831);
    gl_PointSize = uSize * (1.0 + uLevel * 0.6) * (300.0 / -mv.z) * (0.6 + vTwinkle * 0.6);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointsFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;

  void main() {
    // Round, soft-edged sprite — square points would read as noise.
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float falloff = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor, falloff * vTwinkle * uOpacity);
  }
`;

/** Fibonacci sphere — the only even distribution that needs no rejection. */
function fibonacciSphere(count: number, radius: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push(
      new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius,
        Math.sin(theta) * r * radius,
      ),
    );
  }
  return pts;
}

function SurfaceNetwork({
  spin,
  level,
  reduced,
}: {
  spin: React.RefObject<number>;
  level: React.RefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const dotMat = useRef<THREE.ShaderMaterial>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);

  const { positions, phases, linePositions, cyan } = useMemo(() => {
    const pts = fibonacciSphere(POINT_COUNT, SURFACE_R);
    const positions = new Float32Array(POINT_COUNT * 3);
    const phases = new Float32Array(POINT_COUNT);
    const rand = makeRand(0x5bf03635);

    for (let i = 0; i < POINT_COUNT; i++) {
      positions[i * 3] = pts[i].x;
      positions[i * 3 + 1] = pts[i].y;
      positions[i * 3 + 2] = pts[i].z;
      phases[i] = rand();
    }

    // Link each point to a couple of near neighbours. Fibonacci ordering puts
    // spatial neighbours close in index, so a short index window finds them
    // without an O(n^2) sweep — and the links stay short and even.
    // Only a sparse subset gets links — every point linked to its neighbours
    // produces a solid mesh that hides the individual points entirely.
    const segs: number[] = [];
    const maxDist = 0.11 * SURFACE_R;
    for (let i = 0; i < POINT_COUNT; i++) {
      if (rand() > 0.14) continue;
      let made = 0;
      for (let j = i + 1; j < Math.min(i + 18, POINT_COUNT) && made < 1; j++) {
        if (pts[i].distanceTo(pts[j]) < maxDist) {
          segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
          made++;
        }
      }
    }

    return {
      positions,
      phases,
      linePositions: new Float32Array(segs),
      cyan: readToken("--orb-dot", "#a5f3fc"),
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 0.026 },
      uLevel: { value: 0 },
      uColor: { value: cyan },
      uOpacity: { value: 0.85 },
    }),
    [cyan],
  );

  useFrame((_, delta) => {
    if (dotMat.current) {
      if (!reduced) dotMat.current.uniforms.uTime.value += delta;
      dotMat.current.uniforms.uLevel.value = level.current;
    }
    if (lineMat.current) {
      lineMat.current.opacity = 0.12 + level.current * 0.16;
    }
    if (group.current && !reduced) group.current.rotation.y += delta * spin.current;
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={dotMat}
          uniforms={uniforms}
          vertexShader={pointsVertex}
          fragmentShader={pointsFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMat}
          color={cyan}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Atmosphere: back-face sphere with an additive fresnel glow          */
/* ------------------------------------------------------------------ */

const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    float fres = 1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
    // Rendered back-face, so the fresnel peak lands just outside the globe's
    // silhouette and falls off outward into the background.
    // Tight exponent keeps the halo a thin ring hugging the silhouette; a
    // broad one washes additively over the whole globe and blows it out.
    float glow = pow(fres, 5.0) * uStrength * 0.55;
    gl_FragColor = vec4(uColor * glow, glow);
  }
`;

function Atmosphere({ halo }: { halo: React.RefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: readToken("--boss-cyan", "#22d3ee") },
      uStrength: { value: 1 },
    }),
    [],
  );

  useFrame(() => {
    if (mat.current) mat.current.uniforms.uStrength.value = halo.current;
    // Max 3% scale change, per spec — the silhouette must stay stable.
    if (mesh.current) mesh.current.scale.setScalar(1 + (halo.current - 1) * 0.03);
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[GLOBE_R * 1.22, 64, 64]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={globeVertex}
        fragmentShader={haloFragment}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Pedestal: concentric rings, a light disc and an upward beam         */
/* ------------------------------------------------------------------ */

const PEDESTAL_Y = -1.32;
const RING_RADII = [1.05, 1.38, 1.68, 1.96];

function Pedestal({
  level,
  halo,
  reduced,
}: {
  level: React.RefObject<number>;
  halo: React.RefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const cyan = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);
  const blue = useMemo(() => readToken("--boss-blue", "#3b82f6"), []);
  // Ripple progress 0..1, restarted on a voice peak.
  const t = useRef(0);
  const prevLevel = useRef(0);

  useFrame((_, delta) => {
    if (!group.current) return;

    group.current.children.forEach((child, i) => {
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (!m?.isMaterial) return;
      // Rings further out sit fainter, and all of them lift with the level.
      const base = 0.5 - i * 0.09;
      m.opacity = Math.max(0, base * (0.55 + level.current * 0.85));
    });

    if (reduced) return;

    // Ripple: a peak (a rising edge above the running level) relaunches it.
    const rising = level.current - prevLevel.current;
    prevLevel.current = level.current;
    if (rising > 0.06 && t.current > 0.35) t.current = 0;
    t.current = Math.min(1, t.current + delta * 0.9);

    if (ripple.current) {
      const s = 0.9 + t.current * 1.6;
      ripple.current.scale.set(s, s, s);
      const m = ripple.current.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - t.current) * 0.5 * halo.current;
    }
  });

  return (
    <group position={[0, PEDESTAL_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={group}>
        {RING_RADII.map((r, i) => (
          <mesh key={r}>
            <ringGeometry args={[r, r + 0.022 + i * 0.004, 128]} />
            <meshBasicMaterial
              color={cyan}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Expanding ripple launched by voice peaks. */}
      <mesh ref={ripple}>
        <ringGeometry args={[1.0, 1.03, 128]} />
        <meshBasicMaterial
          color={cyan}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Soft light disc pooling under the globe. */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[1.9, 64]} />
        <meshBasicMaterial
          color={blue}
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Faint cone of light rising from the pedestal into the globe. */
function Beam({ halo }: { halo: React.RefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const cyan = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);

  useFrame(() => {
    if (!mesh.current) return;
    const m = mesh.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.035 + Math.max(0, halo.current - 1) * 0.08;
  });

  return (
    <mesh ref={mesh} position={[0, PEDESTAL_Y + 0.65, 0]}>
      <cylinderGeometry args={[0.35, 1.7, 1.3, 48, 1, true]} />
      <meshBasicMaterial
        color={cyan}
        transparent
        opacity={0.06}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Orbit rings with a travelling light dot                             */
/* ------------------------------------------------------------------ */

function OrbitRing({
  radius,
  tilt,
  speed,
  color,
  reduced,
}: {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  color: THREE.Color;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const dot = useRef<THREE.Mesh>(null);
  const angle = useRef(0);

  useFrame((_, delta) => {
    if (reduced || !dot.current) return;
    angle.current += delta * speed;
    dot.current.position.set(
      Math.cos(angle.current) * radius,
      Math.sin(angle.current) * radius,
      0,
    );
  });

  return (
    <group ref={group} rotation={tilt}>
      <mesh>
        <torusGeometry args={[radius, 0.004, 8, 160]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={dot} position={[radius, 0, 0]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function OrbScene({
  state,
  audioLevel,
}: {
  state: OrbState;
  audioLevel: number;
}) {
  const reduced = usePrefersReducedMotion();
  const invalidate = useThree((s) => s.invalidate);

  // Shared animated values, held in refs so no frame triggers a React render.
  const level = useRef(0);
  const spin = useRef(STATE.idle.spin);
  const rimPower = useRef(1);
  const halo = useRef(1);
  const shimmer = useRef(0);
  const clock = useRef(0);

  const cyan = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);
  const violet = useMemo(() => readToken("--boss-violet", "#a855f7"), []);

  useFrame((_, delta) => {
    const cfg = STATE[state];
    clock.current += delta;

    // Smooth the mic so a spiky signal never jitters the visuals.
    level.current += (audioLevel - level.current) * Math.min(delta * 5, 1);

    // Idle breathing on a ~4s cycle; louder states ride the mic instead.
    const breathe = 0.5 + 0.5 * Math.sin((clock.current / 4) * Math.PI * 2);
    const drive = state === "idle" ? breathe * 0.35 : level.current;

    spin.current = cfg.spin;
    rimPower.current = cfg.rim * (0.85 + drive * 0.6);
    halo.current = cfg.halo * (0.9 + drive * 0.45);
    shimmer.current += ((state === "thinking" ? 1 : 0) - shimmer.current) * Math.min(delta * 3, 1);

    // Reduced motion: colour still responds, geometry does not move.
    if (reduced) {
      spin.current = 0;
    }
    invalidate();
  });

  return (
    <>
      <Globe spin={spin} rimPower={rimPower} shimmer={shimmer} reduced={reduced} />
      <SurfaceNetwork spin={spin} level={level} reduced={reduced} />
      <Atmosphere halo={halo} />
      <Pedestal level={level} halo={halo} reduced={reduced} />
      <Beam halo={halo} />
      <OrbitRing
        radius={1.42}
        tilt={[Math.PI / 2.6, 0.35, 0.2]}
        speed={0.5}
        color={cyan}
        reduced={reduced}
      />
      <OrbitRing
        radius={1.62}
        tilt={[Math.PI / 2.2, -0.5, -0.35]}
        speed={-0.34}
        color={violet}
        reduced={reduced}
      />
    </>
  );
}
