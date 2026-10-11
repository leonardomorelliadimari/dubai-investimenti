"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildTowers, type Tower } from "./geo";
import { facadeMaterial } from "./facade";
import { seeded } from "@/lib/random";

type Part = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry?: number; c: number };

// palette "plastico": torri vetrate in toni freschi, residenziali in pastelli caldi
const GLASS_COLS = [0x7cc6e8, 0x8fd8d2, 0xa9c8f0, 0x6fb7d9, 0xb7e3f2, 0x9fc9b4, 0xc3b6ea, 0x86c5c9];
const STONE = [0xfbe3c4, 0xf7c9b5, 0xfff1d6, 0xf3d9e6, 0xe2efd9, 0xfde8b0, 0xf5f0e6, 0xe8dcf5];

function split(towers: Tower[]) {
  const r = seeded(99);
  const out = {
    podium: [] as Part[], glassBox: [] as Part[], glassOct: [] as Part[], glassRound: [] as Part[],
    resBox: [] as Part[], crown: [] as Part[], roof: [] as Part[], villa: [] as Part[], fins: [] as Part[],
    antenna: [] as Part[], pad: [] as Part[], garden: [] as Part[], tank: [] as Part[],
  };
  for (const t of towers) {
    if (t.h < 4) {
      out.villa.push({ x: t.x, y: t.h / 2, z: t.z, sx: t.w, sy: t.h, sz: t.d, c: STONE[Math.floor(r() * STONE.length)] });
      continue;
    }
    const glass = t.h > 18 ? r() < 0.75 : r() < 0.35;
    const pod = t.h > 12 ? Math.min(4.5, 1.6 + t.h * 0.06) : 0;
    const crownH = glass && t.h > 16 ? 1.6 + r() * 2.4 : 0;
    const shaftH = t.h - pod - crownH;
    const ry = r() < 0.25 ? (r() - 0.5) * 0.6 : 0;
    if (pod) out.podium.push({ x: t.x, y: pod / 2, z: t.z, sx: t.w * 1.35, sy: pod, sz: t.d * 1.35, ry, c: STONE[Math.floor(r() * STONE.length)] });
    const shaft: Part = { x: t.x, y: pod + shaftH / 2, z: t.z, sx: t.w, sy: shaftH, sz: t.d, ry, c: glass ? GLASS_COLS[Math.floor(r() * GLASS_COLS.length)] : STONE[Math.floor(r() * STONE.length)] };
    if (glass) {
      const shape = t.round ? "round" : t.h > 22 && r() < 0.22 ? "oct" : "box";
      if (shape === "round") out.glassRound.push({ ...shaft, sx: t.w * 0.55, sz: t.w * 0.55 });
      else if (shape === "oct") out.glassOct.push({ ...shaft, sx: t.w * 0.6, sz: t.w * 0.6 });
      else out.glassBox.push(shaft);
      if (crownH) {
        const k = shape === "box" ? 0.74 : 0.5;
        out.crown.push({ x: t.x, y: t.h - crownH / 2, z: t.z, sx: t.w * k, sy: crownH, sz: (shape === "box" ? t.d : t.w) * k, ry, c: [0xffffff, 0xffd27a, 0xff9e7a, 0xe9eef2][Math.floor(r() * 4)] });
        // pinne verticali sul coronamento (dettaglio tipico delle torri del Golfo)
        if (shape === "box" && r() < 0.5) out.fins.push({ x: t.x, y: t.h + 1.2, z: t.z, sx: t.w * 0.08, sy: 2.6, sz: t.d * 0.9, ry, c: 0xffffff });
      }
    } else {
      out.resBox.push(shaft);
    }
    // dettagli sul tetto: impianti, antenne, eliporti, giardini pensili, serbatoi
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      out.roof.push({ x: t.x + (r() - 0.5) * t.w * 0.5, y: t.h + 0.35, z: t.z + (r() - 0.5) * t.d * 0.5, sx: 0.6 + r() * 1.4, sy: 0.7, sz: 0.6 + r(), ry, c: [0xd9dde2, 0xc9ced6, 0xffffff][i % 3] });
    }
    if (t.h > 30 && r() < 0.6) out.antenna.push({ x: t.x, y: t.h + 3, z: t.z, sx: 0.12, sy: 6, sz: 0.12, c: 0xff6b5b });
    else if (t.h > 22 && r() < 0.35) out.pad.push({ x: t.x, y: t.h + 0.2, z: t.z, sx: Math.min(t.w, t.d) * 0.36, sy: 0.25, sz: Math.min(t.w, t.d) * 0.36, c: 0x3d4a5c });
    if (!glass && r() < 0.55) out.garden.push({ x: t.x + (r() - 0.5) * t.w * 0.3, y: t.h + 0.3, z: t.z + (r() - 0.5) * t.d * 0.3, sx: t.w * 0.45, sy: 0.6, sz: t.d * 0.4, c: [0x7fcf6a, 0x5fbf72, 0x9ad66b][Math.floor(r() * 3)] });
    if (!glass && r() < 0.4) out.tank.push({ x: t.x - t.w * 0.25, y: t.h + 0.9, z: t.z + t.d * 0.2, sx: 0.7, sy: 1.6, sz: 0.7, c: 0xf2f2f2 });
  }
  return out;
}

function Instances({ parts, geometry, material, shadows = true }: { parts: Part[]; geometry: THREE.BufferGeometry; material: THREE.Material; shadows?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!;
    const o = new THREE.Object3D(), c = new THREE.Color();
    parts.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z); o.scale.set(p.sx, p.sy, p.sz); o.rotation.set(0, p.ry ?? 0, 0); o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.setHex(p.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [parts]);
  if (!parts.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, parts.length]} castShadow={shadows} receiveShadow />;
}

export function City({ density }: { density: number }) {
  const parts = useMemo(() => split(buildTowers(density)), [density]);
  const geo = useMemo(() => ({
    box: new THREE.BoxGeometry(1, 1, 1),
    oct: new THREE.CylinderGeometry(1, 1, 1, 8).rotateY(Math.PI / 8),
    round: new THREE.CylinderGeometry(1, 1, 1, 16),
    rod: new THREE.CylinderGeometry(1, 1, 1, 6),
    disc: new THREE.CylinderGeometry(1, 1, 1, 18),
  }), []);
  const mats = useMemo(() => ({
    glass: facadeMaterial({ color: "#ffffff" }, { style: "glass", floorH: 0.95, colW: 0.9, glass: "#3f8fc2", litRatio: 0.3 }),
    res: facadeMaterial({ color: "#ffffff" }, { style: "residential", floorH: 1.0, colW: 1.25, glass: "#5b86a8", litRatio: 0.36 }),
    podium: facadeMaterial({ color: "#ffffff" }, { style: "glass", floorH: 1.4, colW: 1.8, glass: "#3a6f8f", litRatio: 0.5 }),
    villa: facadeMaterial({ color: "#ffffff" }, { style: "residential", floorH: 1.1, colW: 1.6, glass: "#5b86a8", litRatio: 0.4 }),
    metal: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, metalness: 0.1 }),
    roof: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85 }),
  }), []);

  return (
    <group>
      <Instances parts={parts.podium} geometry={geo.box} material={mats.podium} />
      <Instances parts={parts.glassBox} geometry={geo.box} material={mats.glass} />
      <Instances parts={parts.glassOct} geometry={geo.oct} material={mats.glass} />
      <Instances parts={parts.glassRound} geometry={geo.round} material={mats.glass} />
      <Instances parts={parts.resBox} geometry={geo.box} material={mats.res} />
      <Instances parts={parts.crown} geometry={geo.box} material={mats.metal} />
      <Instances parts={parts.fins} geometry={geo.box} material={mats.metal} shadows={false} />
      <Instances parts={parts.roof} geometry={geo.box} material={mats.roof} shadows={false} />
      <Instances parts={parts.villa} geometry={geo.box} material={mats.villa} />
      <Instances parts={parts.antenna} geometry={geo.rod} material={mats.roof} shadows={false} />
      <Instances parts={parts.pad} geometry={geo.disc} material={mats.roof} shadows={false} />
      <Instances parts={parts.garden} geometry={geo.box} material={mats.roof} shadows={false} />
      <Instances parts={parts.tank} geometry={geo.disc} material={mats.roof} shadows={false} />
    </group>
  );
}
