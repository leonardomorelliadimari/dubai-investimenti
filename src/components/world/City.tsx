"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildTowers, type Tower } from "./geo";
import { facadeMaterial } from "./facade";
import { seeded } from "@/lib/random";

type Part = { x: number; y: number; z: number; sx: number; sy: number; sz: number; ry?: number; c: number };

const GLASS_COLS = [0x6f97b0, 0x5f8ea0, 0x7fa9bd, 0x4e7f95, 0x8db3c4, 0x6d9a8f, 0x93a9b8];
const STONE = [0xf4efe6, 0xeee3d0, 0xf7f3ec, 0xe6dccb, 0xfaf6ee, 0xe9e2d6];

function split(towers: Tower[]) {
  const r = seeded(99);
  const out = {
    podium: [] as Part[], glassBox: [] as Part[], glassOct: [] as Part[], glassRound: [] as Part[],
    resBox: [] as Part[], crown: [] as Part[], roof: [] as Part[], villa: [] as Part[], fins: [] as Part[],
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
        out.crown.push({ x: t.x, y: t.h - crownH / 2, z: t.z, sx: t.w * k, sy: crownH, sz: (shape === "box" ? t.d : t.w) * k, ry, c: 0xc9d1d6 });
        // pinne verticali sul coronamento (dettaglio tipico delle torri del Golfo)
        if (shape === "box" && r() < 0.5) out.fins.push({ x: t.x, y: t.h + 1.2, z: t.z, sx: t.w * 0.08, sy: 2.6, sz: t.d * 0.9, ry, c: 0xe2e6e8 });
      }
    } else {
      out.resBox.push(shaft);
    }
    // impianti sul tetto
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      out.roof.push({ x: t.x + (r() - 0.5) * t.w * 0.5, y: t.h + 0.35, z: t.z + (r() - 0.5) * t.d * 0.5, sx: 0.6 + r() * 1.4, sy: 0.7, sz: 0.6 + r(), ry, c: 0xb9bcbd });
    }
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
    round: new THREE.CylinderGeometry(1, 1, 1, 28),
  }), []);
  const mats = useMemo(() => ({
    glass: facadeMaterial({ color: "#ffffff", roughness: 0.35, metalness: 0.35 }, { style: "glass", floorH: 0.95, colW: 0.9, glass: "#ffffff", litRatio: 0.28 }),
    res: facadeMaterial({ color: "#ffffff", roughness: 0.7, metalness: 0.05 }, { style: "residential", floorH: 1.0, colW: 1.25, glass: "#56717f", litRatio: 0.34 }),
    podium: facadeMaterial({ color: "#ffffff", roughness: 0.6, metalness: 0.1 }, { style: "glass", floorH: 1.4, colW: 1.8, glass: "#2f4552", litRatio: 0.5 }),
    villa: facadeMaterial({ color: "#ffffff", roughness: 0.8, metalness: 0 }, { style: "residential", floorH: 1.1, colW: 1.6, glass: "#384c56", litRatio: 0.4 }),
    metal: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.75, metalness: 0.2 }),
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
    </group>
  );
}
