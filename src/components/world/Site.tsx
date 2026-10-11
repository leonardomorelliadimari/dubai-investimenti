"use client";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SITE } from "./geo";
import { buildJib, buildMast } from "./crane";
import { facadeMaterial } from "./facade";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

export const craneMat = new THREE.MeshStandardMaterial({ color: "#ffc233", roughness: 0.6 });

export function Crane({ x, z, base = 0, height, jib = 34, speed = 0.12, phase = 0, progressRef }: { x: number; z: number; base?: number; height: number; jib?: number; speed?: number; phase?: number; progressRef?: { current: number } }) {
  const mast = useMemo(() => buildMast(height), [height]);
  const arm = useMemo(() => buildJib(jib), [jib]);
  const rot = useRef<THREE.Group>(null);
  const trolley = useRef<THREE.Group>(null);
  const cable = useRef<THREE.Mesh>(null);
  const load = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pr = progressRef?.current ?? 0;
    if (rot.current) rot.current.rotation.y = phase + Math.sin(t * speed + phase) * 1.1 + pr * 2.5;
    const d = 8 + (Math.sin(t * speed * 1.7 + phase) * 0.5 + 0.5) * (jib - 12);
    const drop = 4 + (Math.sin(t * speed * 1.3 + phase * 2) * 0.5 + 0.5) * (height * 0.5);
    if (trolley.current) trolley.current.position.x = d;
    if (cable.current) { cable.current.scale.y = drop; cable.current.position.y = -drop / 2; }
    if (load.current) load.current.position.y = -drop - 0.5;
  });
  return (
    <group position={[x, base, z]}>
      <mesh geometry={mast} material={craneMat} />
      <group ref={rot} position={[0, height, 0]}>
        <mesh geometry={arm} material={craneMat} />
        <group ref={trolley} position={[10, 0, 0]}>
          <mesh position={[0, -0.2, 0]}><boxGeometry args={[1, 0.4, 1]} /><meshStandardMaterial color="#3b3b3b" /></mesh>
          <mesh ref={cable}><boxGeometry args={[0.05, 1, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh ref={load} castShadow><boxGeometry args={[2.6, 0.8, 1.2]} /><meshStandardMaterial color="#7d8a93" roughness={0.6} /></mesh>
        </group>
      </group>
    </group>
  );
}

const FLOORS = 34, FH = 1.15, FP = 17;

function MixerTruck({ x, z, ry }: { x: number; z: number; ry: number }) {
  const drum = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (drum.current) drum.current.rotation.x += dt * 1.5; });
  return (
    <group position={[x, 0, z]} rotation-y={ry}>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[3.4, 0.35, 0.9]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
      <mesh position={[1.35, 0.95, 0]} castShadow><boxGeometry args={[0.8, 0.85, 0.92]} /><meshStandardMaterial color="#f2f2ee" roughness={0.4} /></mesh>
      <group position={[-0.35, 1.15, 0]} rotation-z={0.22}>
        <mesh ref={drum} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.5, 0.62, 2.2, 14]} />
          <meshStandardMaterial color="#e86a1c" roughness={0.45} />
        </mesh>
      </group>
      {[-1.1, 0.2, 1.3].map((wx) => [-0.45, 0.45].map((wz) => (
        <mesh key={`${wx}${wz}`} position={[wx, 0.25, wz]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.25, 0.25, 0.18, 12]} /><meshStandardMaterial color="#151515" /></mesh>
      )))}
    </group>
  );
}

export function ConstructionSite({ progressRef }: { progressRef: { current: number } }) {
  const slabs = useRef<THREE.InstancedMesh>(null);
  const cols = useRef<THREE.InstancedMesh>(null);
  const panels = useRef<THREE.InstancedMesh>(null);
  const bars = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const top = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Group>(null);
  const climb = useRef<THREE.Group>(null);
  const hoistCage = useRef<THREE.Mesh>(null);
  const glassMat = useMemo(() => facadeMaterial({ color: "#bfe6f5" }, { style: "glass", floorH: FH, colW: 1.05, glass: "#2f8fd0", litRatio: 0.3 }), []);
  const concrete = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e4ddd2", roughness: 0.95 }), []);
  const rebar = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7a4b32", roughness: 0.6, metalness: 0.6 }), []);
  const hoistMast = useMemo(() => buildMast(FLOORS * FH + 4, 1.1, 1.4), []);
  const [sx, sz] = SITE;
  const colPts = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) if (i === 0 || j === 0 || i === 4 || j === 4 || (i === 2 && j === 2)) pts.push([-FP / 2 + (i * FP) / 4, -FP / 2 + (j * FP) / 4]);
    return pts;
  }, []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let f = 0; f < FLOORS; f++) {
      o.rotation.set(0, 0, 0);
      o.position.set(sx, (f + 1) * FH, sz); o.scale.set(FP + 1, 0.28, FP + 1); o.updateMatrix();
      slabs.current!.setMatrixAt(f, o.matrix);
      colPts.forEach(([a, b], k) => {
        o.position.set(sx + a, f * FH + FH / 2, sz + b); o.scale.set(0.45, FH, 0.45); o.updateMatrix();
        cols.current!.setMatrixAt(f * colPts.length + k, o.matrix);
      });
      for (let s = 0; s < 4; s++) {
        const ang = (s * Math.PI) / 2;
        o.position.set(sx + Math.sin(ang) * (FP / 2 + 0.55), f * FH + FH / 2 + 0.14, sz + Math.cos(ang) * (FP / 2 + 0.55));
        o.rotation.set(0, ang, 0); o.scale.set(FP + 1.1, FH, 0.18); o.updateMatrix();
        panels.current!.setMatrixAt(f * 4 + s, o.matrix);
      }
    }
    colPts.forEach(([a, b], k) => {
      for (let q = 0; q < 4; q++) {
        o.rotation.set(0, 0, 0);
        o.position.set(a + (q % 2 ? 0.15 : -0.15), 0.9, b + (q > 1 ? 0.15 : -0.15)); o.scale.set(0.04, 1.8, 0.04); o.updateMatrix();
        bars.current!.setMatrixAt(k * 4 + q, o.matrix);
      }
    });
    [slabs, cols, panels, bars].forEach((r) => { r.current!.instanceMatrix.needsUpdate = true; });
  }, [sx, sz, colPts]);

  useFrame(({ clock }) => {
    const p = progressRef.current;
    const structure = range(p, 0.06, 0.66);
    const facade = range(p, 0.32, 0.92);
    const n = Math.floor(structure * FLOORS);
    slabs.current!.count = n;
    cols.current!.count = structure > 0 ? Math.min(FLOORS, n + 1) * colPts.length : 0;
    panels.current!.count = Math.floor(facade * FLOORS) * 4;
    const h = structure > 0 ? Math.min(FLOORS, n + 1) * FH : 0.01;
    core.current!.scale.y = Math.max(0.01, h + 1.2);
    core.current!.position.y = (h + 1.2) / 2;
    const done = p > 0.9;
    top.current!.visible = structure > 0 && !done;
    top.current!.position.y = h;
    crown.current!.visible = done;
    climb.current!.position.y = Math.max(0, h - 5);
    const hh = Math.max(2, h - 2);
    hoistCage.current!.position.y = 1 + (Math.sin(clock.elapsedTime * 0.35) * 0.5 + 0.5) * hh;
  });

  return (
    <group>
      {/* area di cantiere */}
      <mesh rotation-x={-Math.PI / 2} position={[sx, 0.1, sz]} receiveShadow>
        <planeGeometry args={[72, 64]} />
        <meshStandardMaterial color="#e8c48f" roughness={1} />
      </mesh>
      {/* recinzione con pannelli */}
      {[[0, 32, 72, 0], [0, -32, 72, 0], [36, 0, 64, Math.PI / 2], [-36, 0, 64, Math.PI / 2]].map(([x, z, l, r], i) => (
        <mesh key={i} position={[sx + x, 0.9, sz + z]} rotation-y={r} castShadow>
          <boxGeometry args={[l, 1.8, 0.12]} />
          <meshStandardMaterial color={i % 2 ? "#0f4c5c" : "#f3f1ea"} roughness={0.6} />
        </mesh>
      ))}
      {/* container e baracche */}
      {[[-26, 22, "#1f6f8b"], [-26, 19.4, "#d9480f"], [-20, 22, "#f3f1ea"], [26, 24, "#2f7d4f"], [26, 21.4, "#f3f1ea"]].map(([x, z, c], i) => (
        <mesh key={i} position={[sx + (x as number), i === 1 ? 2.1 : 0.7, sz + (z as number)]} castShadow receiveShadow>
          <boxGeometry args={[5, 1.4, 2.2]} />
          <meshStandardMaterial color={c as string} roughness={0.6} />
        </mesh>
      ))}
      {/* materiali */}
      {[[18, -24], [21, -24], [18, -21]].map(([x, z], i) => (
        <mesh key={i} position={[sx + x, 0.35, sz + z]} castShadow><boxGeometry args={[2.4, 0.7, 2.4]} /><meshStandardMaterial color="#9a8f7f" roughness={0.9} /></mesh>
      ))}
      <MixerTruck x={sx - 16} z={sz + 25} ry={0.2} />
      <MixerTruck x={sx + 8} z={sz + 26} ry={-0.1} />

      {/* nucleo, solai, pilastri, facciata */}
      <mesh ref={core} position={[sx, 0, sz]} material={concrete} castShadow><boxGeometry args={[6, 1, 6]} /></mesh>
      <instancedMesh ref={slabs} args={[undefined, concrete, FLOORS]} frustumCulled={false} castShadow receiveShadow><boxGeometry args={[1, 1, 1]} /></instancedMesh>
      <instancedMesh ref={cols} args={[undefined, concrete, FLOORS * 17]} frustumCulled={false} castShadow><boxGeometry args={[1, 1, 1]} /></instancedMesh>
      <instancedMesh ref={panels} args={[undefined, glassMat, FLOORS * 4]} frustumCulled={false} castShadow><boxGeometry args={[1, 1, 1]} /></instancedMesh>

      {/* piano in costruzione: casseforme, reti di protezione, ferri */}
      <group ref={top} position={[sx, 0, sz]} visible={false}>
        {[0, 1, 2, 3].map((s) => {
          const ang = (s * Math.PI) / 2;
          return (
            <group key={s} rotation-y={ang}>
              <mesh position={[0, 0.55, FP / 2 + 0.9]} castShadow>
                <boxGeometry args={[FP + 2.6, 3.4, 0.12]} />
                <meshStandardMaterial color="#f2c230" roughness={0.7} transparent opacity={0.92} />
              </mesh>
              <mesh position={[0, 0.15, FP / 2 + 0.2]}>
                <boxGeometry args={[FP + 0.6, 0.5, 0.6]} />
                <meshStandardMaterial color="#e2611b" roughness={0.6} />
              </mesh>
            </group>
          );
        })}
        <instancedMesh ref={bars} args={[undefined, rebar, 17 * 4]} frustumCulled={false}><boxGeometry args={[1, 1, 1]} /></instancedMesh>
      </group>
      <group ref={crown} visible={false}>
        <mesh position={[sx, FLOORS * FH + 1.6, sz]} castShadow>
          <boxGeometry args={[13, 3.2, 13]} />
          <meshStandardMaterial color="#dfe5e8" metalness={0.1} roughness={0.5} />
        </mesh>
        <mesh position={[sx, FLOORS * FH + 4.8, sz]} castShadow>
          <boxGeometry args={[0.4, 3.4, 0.4]} />
          <meshStandardMaterial color="#dfe5e8" metalness={0.1} roughness={0.5} />
        </mesh>
      </group>

      {/* ascensore di cantiere */}
      <group position={[sx + FP / 2 + 1.9, 0, sz + 3]}>
        <mesh geometry={hoistMast} material={craneMat} />
        <mesh ref={hoistCage} position={[1.1, 1, 0]} castShadow><boxGeometry args={[1.4, 1.8, 1.4]} /><meshStandardMaterial color="#e9e9e2" roughness={0.5} metalness={0.4} /></mesh>
      </group>

      {/* gru: una che sale con l'edificio, una fissa */}
      <group ref={climb}>
        <Crane x={sx + 4} z={sz - 4} height={16} jib={30} speed={0.22} phase={0.4} progressRef={progressRef} />
      </group>
      <Crane x={sx - 23} z={sz + 6} height={58} jib={38} speed={0.16} phase={2.1} progressRef={progressRef} />
    </group>
  );
}
