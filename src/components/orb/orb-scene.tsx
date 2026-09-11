"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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

const STATE_INTENSITY: Record<OrbState, number> = {
  idle: 0.35,
  listening: 1,
  thinking: 0.7,
  speaking: 1.25,
};

/* ------------------------------------------------------------------ */
/* Core globe: a displaced icosahedron with a fresnel rim              */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormal;
  varying float vDisp;

  // Classic 3D simplex-ish noise (cheap value noise is enough here).
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    float n = snoise(normal * 1.8 + vec3(0.0, uTime * 0.25, 0.0));
    float disp = n * uAmp;
    vDisp = disp;
    vec3 pos = position + normal * disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying float vDisp;

  void main() {
    // Fresnel: bright at grazing angles, dark face-on, so the sphere reads
    // as a shell of light rather than a solid ball.
    float fres = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 1.8);
    vec3 col = mix(uColorA, uColorB, clamp(vDisp * 3.0 + 0.5, 0.0, 1.0));
    // A floor of body brightness keeps the sphere legible over the bright
    // nebula behind the network stage, not only on a dark ground.
    float a = (fres * 0.95 + 0.18) * uOpacity;
    gl_FragColor = vec4(col * (fres * 1.1 + 0.5), a);
  }
`;

function Globe({
  state,
  audioLevel,
}: {
  state: OrbState;
  audioLevel: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  // Smoothed level so the geometry never jitters on a spiky signal.
  const level = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmp: { value: 0.06 },
      uOpacity: { value: 1 },
      uColorA: { value: readToken("--boss-cyan", "#22d3ee") },
      uColorB: { value: readToken("--boss-violet", "#a855f7") },
    }),
    [],
  );

  useFrame((_, delta) => {
    const target = STATE_INTENSITY[state] * (0.35 + audioLevel * 0.9);
    level.current += (target - level.current) * Math.min(delta * 4, 1);

    if (mat.current) {
      mat.current.uniforms.uTime.value += delta;
      mat.current.uniforms.uAmp.value = 0.045 + level.current * 0.085;
    }
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.12;
      const s = 1 + level.current * 0.06;
      mesh.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, 24]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Wireframe lat/long grid — the defining feature of the reference orb  */
/* ------------------------------------------------------------------ */

function WireGlobe({ audioLevel }: { audioLevel: number }) {
  const group = useRef<THREE.Group>(null);
  const color = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);

  // Latitude circles (rings stacked up the Y axis) plus longitude circles
  // (rings rotated around Y) drawn as line loops.
  const { lats, longs } = useMemo(() => {
    const SEG = 96;
    const unit: number[] = [];
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      unit.push(Math.cos(a), 0, Math.sin(a));
    }

    const lats: { y: number; r: number }[] = [];
    const LAT_COUNT = 7;
    for (let i = 1; i <= LAT_COUNT; i++) {
      const phi = (i / (LAT_COUNT + 1)) * Math.PI;
      lats.push({ y: Math.cos(phi), r: Math.sin(phi) });
    }

    const longs: number[] = [];
    const LONG_COUNT = 12;
    for (let i = 0; i < LONG_COUNT; i++) {
      longs.push((i / LONG_COUNT) * Math.PI);
    }

    return { lats, longs, unit };
  }, []);

  const circle = useMemo(() => {
    const SEG = 96;
    const pts = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      pts[i * 3] = Math.cos(a);
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = Math.sin(a);
    }
    return pts;
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
  });

  const opacity = 0.32 + audioLevel * 0.3;

  return (
    <group ref={group}>
      {/* Latitudes */}
      {lats.map((lat, i) => (
        <line key={`lat-${i}`} position={[0, lat.y, 0]} scale={[lat.r, 1, lat.r]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[circle, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      ))}
      {/* Longitudes: the same circle stood upright and spun around Y */}
      {longs.map((rot, i) => (
        <line key={`long-${i}`} rotation={[Math.PI / 2, 0, rot]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[circle, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Bright nodes sitting on the globe surface                           */
/* ------------------------------------------------------------------ */

function SurfaceNodes({ audioLevel }: { audioLevel: number }) {
  const points = useRef<THREE.Points>(null);
  const COUNT = 90;

  const { positions, color } = useMemo(() => {
    let seed = 0x2545f491;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = 2 * Math.PI * rand();
      const phi = Math.acos(2 * rand() - 1);
      // Pinned to the shell so they read as points *on* the globe.
      const r = 1.005;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return { positions, color: readToken("--boss-cyan", "#22d3ee") };
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.12;
    const m = points.current.material as THREE.PointsMaterial;
    m.opacity = 0.7 + audioLevel * 0.3;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Base platform rings under the orb                                   */
/* ------------------------------------------------------------------ */

function BaseRings({ audioLevel }: { audioLevel: number }) {
  const group = useRef<THREE.Group>(null);
  const cyan = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);
  const violet = useMemo(() => readToken("--boss-violet", "#a855f7"), []);

  // Flat concentric rings, tilted to read as a platform in perspective.
  const RINGS = [
    { r: 1.5, w: 0.008, c: cyan, o: 0.55, speed: 0.5 },
    { r: 1.78, w: 0.005, c: cyan, o: 0.35, speed: -0.33 },
    { r: 2.05, w: 0.004, c: violet, o: 0.26, speed: 0.22 },
  ];

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      child.rotation.z += delta * RINGS[i].speed;
    });
  });

  return (
    <group ref={group} position={[0, -1.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
      {RINGS.map((ring, i) => (
        <mesh key={i}>
          <torusGeometry args={[ring.r, ring.w, 8, 128]} />
          <meshBasicMaterial
            color={ring.c}
            transparent
            opacity={ring.o + audioLevel * 0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Orbiting particle shell                                             */
/* ------------------------------------------------------------------ */

function Particles({ audioLevel }: { audioLevel: number }) {
  const points = useRef<THREE.Points>(null);
  const COUNT = 700;

  const { positions, color } = useMemo(() => {
    // Seeded PRNG: the shell must be identical on every render, and
    // Math.random() during render is neither pure nor reproducible.
    let seed = 0x9e3779b9;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Even distribution on a sphere shell, slightly varied in radius.
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 1.35 + rand() * 0.5;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return { positions, color: readToken("--boss-cyan", "#22d3ee") };
  }, []);

  useFrame((_, delta) => {
    if (!points.current) return;
    points.current.rotation.y -= delta * 0.06;
    points.current.rotation.x += delta * 0.02;
    const m = points.current.material as THREE.PointsMaterial;
    m.opacity = 0.35 + audioLevel * 0.45;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.022}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Equator ring                                                        */
/* ------------------------------------------------------------------ */

function Ring({ audioLevel }: { audioLevel: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const color = useMemo(() => readToken("--boss-cyan", "#22d3ee"), []);

  useFrame((_, delta) => {
    if (!ring.current) return;
    ring.current.rotation.z += delta * 0.25;
    const m = ring.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.18 + audioLevel * 0.3;
  });

  return (
    <mesh ref={ring} rotation={[Math.PI / 2.1, 0, 0]}>
      <torusGeometry args={[1.62, 0.006, 8, 128]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export function OrbScene({
  state,
  audioLevel,
}: {
  state: OrbState;
  audioLevel: number;
}) {
  return (
    <>
      <Globe state={state} audioLevel={audioLevel} />
      <Particles audioLevel={audioLevel} />
      <Ring audioLevel={audioLevel} />
    </>
  );
}
