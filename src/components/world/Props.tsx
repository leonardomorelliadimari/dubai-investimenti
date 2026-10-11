"use client";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { coastZ, isWater, LAKE, PALM } from "./geo";
import { facadeUniforms } from "./facade";
import { seeded } from "@/lib/random";

/** Alberi tondeggianti low-poly (chioma + tronco) nei parchi e nei quartieri. */
export function Trees({ density }: { density: number }) {
  const geo = useMemo(() => {
    const crown = new THREE.IcosahedronGeometry(1.4, 0).toNonIndexed();
    crown.translate(0, 2.4, 0);
    const trunk = new THREE.CylinderGeometry(0.16, 0.22, 1.6, 5).toNonIndexed();
    trunk.translate(0, 0.8, 0);
    // colori per vertice: chioma verde, tronco marrone
    const paint = (g: THREE.BufferGeometry, c: THREE.Color) => {
      const a = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < a.length; i += 3) a.set([c.r, c.g, c.b], i);
      g.setAttribute("color", new THREE.BufferAttribute(a, 3));
      g.deleteAttribute("uv");
      return g;
    };
    const m = mergeGeometries([paint(crown, new THREE.Color(1, 1, 1)), paint(trunk, new THREE.Color(0.55, 0.38, 0.26))])!;
    m.computeVertexNormals();
    return m;
  }, []);
  const spots = useMemo(() => {
    const r = seeded(123);
    const out: { x: number; z: number; s: number }[] = [];
    const add = (x: number, z: number, s = 1) => { if (!isWater(x, z, 2)) out.push({ x, z, s: s * (0.8 + r() * 0.5) }); };
    // Dubai Hills: parco e golf
    for (let i = 0; i < 260 * density; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); add(-175 + Math.cos(a) * 58 * d, 140 + Math.sin(a) * 24 * d); }
    // Burj Park attorno al lago
    for (let i = 0; i < 90 * density; i++) { const a = r() * Math.PI * 2; add(LAKE.x + Math.cos(a) * (LAKE.rx + 6 + r() * 6), LAKE.z + Math.sin(a) * (LAKE.rz + 6 + r() * 6), 0.9); }
    // Safa Park e alberature sparse nei quartieri
    for (let i = 0; i < 70 * density; i++) add(-130 + (r() - 0.5) * 36, 80 + (r() - 0.5) * 20);
    const hoods: [number, number, number][] = [[15, -15, 90], [110, -45, 60], [-505, -60, 70], [-420, 90, 70], [-650, 70, 90], [340, -250, 50], [-250, 20, 80]];
    for (const [hx, hz, hr] of hoods) for (let i = 0; i < 40 * density; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * hr; add(hx + Math.cos(a) * d, hz + Math.sin(a) * d * 0.8, 0.75); }
    return out;
  }, [density]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!, o = new THREE.Object3D(), c = new THREE.Color();
    const greens = [0x6cc04a, 0x4fae5b, 0x8fd14f, 0x3e9e57, 0xa3d977];
    spots.forEach((q, i) => {
      o.position.set(q.x, 0, q.z); o.scale.setScalar(q.s); o.rotation.set(0, i * 1.7, 0); o.updateMatrix();
      m.setMatrixAt(i, o.matrix); m.setColorAt(i, c.setHex(greens[i % greens.length]));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [spots]);
  return <instancedMesh ref={ref} args={[geo, mat, spots.length]} castShadow receiveShadow />;
}

type Boat = { kind: "loop" | "line"; cx: number; cz: number; r: number; a: number; v: number; x0?: number; x1?: number; color: number };

/** Barche e yacht che navigano: giri attorno alla Palm, rotte lungo costa e Marina. */
export function Boats({ density }: { density: number }) {
  const geo = useMemo(() => {
    const hull = new THREE.CylinderGeometry(0.55, 0.3, 3.2, 6, 1);
    hull.rotateZ(Math.PI / 2);
    hull.scale(1, 0.55, 1);
    hull.translate(0, 0.25, 0);
    const cabin = new THREE.BoxGeometry(1.3, 0.55, 0.75);
    cabin.translate(-0.25, 0.75, 0);
    const deck = new THREE.BoxGeometry(0.6, 0.35, 0.55);
    deck.translate(-0.3, 1.15, 0);
    const g = mergeGeometries([hull.toNonIndexed(), cabin.toNonIndexed(), deck.toNonIndexed()])!;
    g.computeVertexNormals();
    return g;
  }, []);
  const boats = useMemo<Boat[]>(() => {
    const r = seeded(55);
    const cols = [0xffffff, 0xffffff, 0xf7f3ea, 0x2f6fb0, 0xff7a59, 0xfdd36a];
    const out: Boat[] = [];
    const n = Math.round(40 * density);
    for (let i = 0; i < n; i++) {
      const t = r();
      if (t < 0.4) out.push({ kind: "loop", cx: PALM.x, cz: PALM.crescentZ, r: PALM.crescentR + 18 + r() * 40, a: r() * Math.PI * 2, v: (0.02 + r() * 0.03) * (r() > 0.5 ? 1 : -1), color: cols[i % cols.length] });
      else if (t < 0.75) out.push({ kind: "line", cx: 0, cz: 0, r: 0, a: r(), v: 0.004 + r() * 0.006, x0: -900, x1: 600, color: cols[i % cols.length] });
      else out.push({ kind: "loop", cx: -505, cz: -150, r: 25 + r() * 35, a: r() * Math.PI * 2, v: 0.04 + r() * 0.04, color: cols[i % cols.length] });
    }
    return out;
  }, [density]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, flatShading: true }), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current!, c = new THREE.Color();
    boats.forEach((b, i) => m.setColorAt(i, c.setHex(b.color)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [boats]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    const m = ref.current!;
    const t = clock.elapsedTime;
    boats.forEach((b, i) => {
      if (b.kind === "loop") {
        b.a += b.v * Math.min(dt, 0.05);
        o.position.set(b.cx + Math.cos(b.a) * b.r, -0.45 + Math.sin(t * 2 + i) * 0.05, b.cz + Math.sin(b.a) * b.r * 0.8);
        o.rotation.set(0, -b.a - (b.v > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
      } else {
        b.a = (b.a + b.v * Math.min(dt, 0.05)) % 1;
        const x = b.x0! + (b.x1! - b.x0!) * b.a;
        o.position.set(x, -0.45, coastZ(x) - 30 - (i % 5) * 14);
        o.rotation.set(0, Math.atan2(coastZ(x + 1) - coastZ(x), 1) * -1, 0);
      }
      o.scale.setScalar(i % 4 === 0 ? 1.6 : 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    mat.emissiveIntensity = facadeUniforms.uNight.value * 0.2;
  });
  return <instancedMesh ref={ref} args={[geo, mat, boats.length]} frustumCulled={false} castShadow />;
}
