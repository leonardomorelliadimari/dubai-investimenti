"use client";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { AL_KHAIL, isWater, LAKE, PALM, SITE, SZR, type V2 } from "./geo";
import { facadeUniforms } from "./facade";
import { buildPalmGeometries } from "./palms";
import { seeded } from "@/lib/random";

type Road = { pts: V2[]; width: number; lanes: number; median: boolean };
const ROADS: Road[] = [
  { pts: SZR, width: 13, lanes: 4, median: true },
  { pts: AL_KHAIL, width: 9, lanes: 3, median: false },
];

function roadTexture(median: boolean) {
  const W = 256, H = 512;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d")!;
  c.fillStyle = "#3a3c40"; c.fillRect(0, 0, W, H);
  const r = seeded(5);
  for (let i = 0; i < 9000; i++) { c.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)"; c.fillRect(r() * W, r() * H, 1.5, 1.5); }
  c.fillStyle = "#e9e6dc";
  c.fillRect(W * 0.03, 0, 3, H); c.fillRect(W * 0.97 - 3, 0, 3, H);
  if (median) {
    c.fillStyle = "#c9c2b2"; c.fillRect(W * 0.46, 0, W * 0.08, H);
    c.fillStyle = "#6f8f45"; c.fillRect(W * 0.47, 0, W * 0.06, H);
  }
  c.fillStyle = "rgba(240,238,230,0.85)";
  const lanes = median ? [0.135, 0.245, 0.355, 0.645, 0.755, 0.865] : [0.25, 0.5, 0.75];
  for (const l of lanes) for (let y = 0; y < H; y += 64) c.fillRect(W * l - 1.5, y, 3, 32);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function ribbon(curve: THREE.CatmullRomCurve3, width: number, y = 0.14) {
  const len = curve.getLength();
  const n = Math.ceil(len / 3);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    curve.getPointAt(u, p); curve.getTangentAt(u, t);
    const nx = -t.z, nz = t.x;
    pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2);
    const v = (u * len) / 26;
    uv.push(0, v, 1, v);
    if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function carGeometries() {
  const body = mergeGeometries([
    new THREE.BoxGeometry(1.45, 0.4, 0.66).translate(0, 0.32, 0).toNonIndexed(),
    new THREE.BoxGeometry(0.8, 0.32, 0.58).translate(-0.08, 0.68, 0).toNonIndexed(),
  ])!;
  const lightsParts: THREE.BufferGeometry[] = [];
  const add = (x: number, z: number, col: THREE.Color) => {
    const g = new THREE.BoxGeometry(0.06, 0.1, 0.16).translate(x, 0.36, z).toNonIndexed();
    const c = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < c.length; i += 3) c.set([col.r, col.g, col.b], i);
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    g.deleteAttribute("uv");
    lightsParts.push(g);
  };
  const W = new THREE.Color(3, 2.8, 2.4), R = new THREE.Color(3, 0.15, 0.08);
  add(0.73, 0.22, W); add(0.73, -0.22, W); add(-0.73, 0.22, R); add(-0.73, -0.22, R);
  lightsParts.forEach((g) => g.deleteAttribute("normal"));
  return { body, lights: mergeGeometries(lightsParts)! };
}

const CAR_COLS = [0xf3f3f1, 0xd9dcdf, 0x1d1f22, 0x8c9399, 0xf3f3f1, 0x2b3f5c, 0xb3261e, 0xe8e2d4, 0x4a4f55];

type Car = { road: number; s: number; speed: number; lane: number; dir: 1 | -1 };

function Traffic({ curves, density }: { curves: { curve: THREE.CatmullRomCurve3; len: number; road: Road }[]; density: number }) {
  const { body, lights } = useMemo(carGeometries, []);
  const cars = useMemo<Car[]>(() => {
    const r = seeded(11);
    const out: Car[] = [];
    curves.forEach((c, road) => {
      const n = Math.round((c.len / 9) * density);
      for (let i = 0; i < n; i++) {
        const dir = r() > 0.5 ? 1 : -1;
        out.push({ road, s: r() * c.len, speed: 9 + r() * 7, lane: Math.floor(r() * c.road.lanes), dir });
      }
    });
    return out;
  }, [curves, density]);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const lightMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, toneMapped: false }), []);
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.25, metalness: 0.6 }), []);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    cars.forEach((_, i) => bodyRef.current!.setColorAt(i, c.setHex(CAR_COLS[i % CAR_COLS.length])));
    if (bodyRef.current!.instanceColor) bodyRef.current!.instanceColor.needsUpdate = true;
  }, [cars]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    cars.forEach((car, i) => {
      const cv = curves[car.road];
      car.s = (car.s + car.speed * d) % cv.len;
      const u = car.dir > 0 ? car.s / cv.len : 1 - car.s / cv.len;
      cv.curve.getPointAt(u, p); cv.curve.getTangentAt(u, t);
      const w = cv.road.width;
      const laneW = (w * (cv.road.median ? 0.4 : 0.45)) / cv.road.lanes;
      const off = (cv.road.median ? w * 0.07 : w * 0.04) + laneW * (car.lane + 0.5);
      const side = car.dir > 0 ? -1 : 1;
      o.position.set(p.x + -t.z * off * side, 0.15, p.z + t.x * off * side);
      o.rotation.set(0, Math.atan2(-t.z, t.x) + (car.dir > 0 ? 0 : Math.PI), 0);
      o.updateMatrix();
      bodyRef.current!.setMatrixAt(i, o.matrix);
      lightRef.current!.setMatrixAt(i, o.matrix);
    });
    bodyRef.current!.instanceMatrix.needsUpdate = true;
    lightRef.current!.instanceMatrix.needsUpdate = true;
    lightMat.opacity = facadeUniforms.uNight.value;
  });
  return (
    <>
      <instancedMesh ref={bodyRef} args={[body, bodyMat, cars.length]} frustumCulled={false} />
      <instancedMesh ref={lightRef} args={[lights, lightMat, cars.length]} frustumCulled={false} />
    </>
  );
}

function StreetLights({ curves }: { curves: { curve: THREE.CatmullRomCurve3; len: number; road: Road }[] }) {
  const pts = useMemo(() => {
    const out: { x: number; z: number; ry: number }[] = [];
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    for (const c of curves) {
      for (let s = 0; s < c.len; s += 16) {
        c.curve.getPointAt(s / c.len, p); c.curve.getTangentAt(s / c.len, t);
        for (const side of [-1, 1]) {
          const off = c.road.width / 2 + 0.6;
          out.push({ x: p.x - t.z * off * side, z: p.z + t.x * off * side, ry: Math.atan2(-t.z, t.x) + (side > 0 ? Math.PI / 2 : -Math.PI / 2) });
        }
      }
    }
    return out;
  }, [curves]);
  const pole = useMemo(() => mergeGeometries([
    new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6).translate(0, 1.6, 0).toNonIndexed(),
    new THREE.BoxGeometry(0.9, 0.05, 0.05).translate(0.45, 3.15, 0).toNonIndexed(),
  ])!, []);
  const head = useMemo(() => new THREE.BoxGeometry(0.35, 0.08, 0.16).translate(0.85, 3.1, 0), []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccce", roughness: 0.4, metalness: 0.8 }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#eeeeee", emissive: "#ffb766", emissiveIntensity: 0 }), []);
  const a = useRef<THREE.InstancedMesh>(null), b = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    pts.forEach((q, i) => { o.position.set(q.x, 0, q.z); o.rotation.set(0, q.ry, 0); o.updateMatrix(); a.current!.setMatrixAt(i, o.matrix); b.current!.setMatrixAt(i, o.matrix); });
    a.current!.instanceMatrix.needsUpdate = true; b.current!.instanceMatrix.needsUpdate = true;
    a.current!.computeBoundingSphere(); b.current!.computeBoundingSphere();
  }, [pts]);
  useFrame(() => { headMat.emissiveIntensity = facadeUniforms.uNight.value * 4; });
  return (
    <>
      <instancedMesh ref={a} args={[pole, poleMat, pts.length]} />
      <instancedMesh ref={b} args={[head, headMat, pts.length]} />
    </>
  );
}

export function Palms({ density }: { density: number }) {
  const { trunk, crown } = useMemo(buildPalmGeometries, []);
  const spots = useMemo(() => {
    const r = seeded(77);
    const out: { x: number; z: number; s: number; ry: number }[] = [];
    const push = (x: number, z: number) => { if (!isWater(x, z, 1)) out.push({ x, z, s: 0.8 + r() * 0.45, ry: r() * Math.PI * 2 }); };
    // spartitraffico Sheikh Zayed Road
    const szr = new THREE.CatmullRomCurve3(SZR.map(([x, z]) => new THREE.Vector3(x, 0, z)));
    const L = szr.getLength(), p = new THREE.Vector3();
    for (let s = 0; s < L; s += 8 / density) { szr.getPointAt(s / L, p); if (Math.abs(p.x) < 900) push(p.x, p.z); }
    // anello attorno al Burj e al lago
    for (let a = 0; a < Math.PI * 2; a += 0.12 / density) { push(Math.cos(a) * 30, Math.sin(a) * 30); push(LAKE.x + Math.cos(a) * (LAKE.rx + 5), LAKE.z + Math.sin(a) * (LAKE.rz + 5)); }
    // Palm Jumeirah: tronco centrale
    for (let z = PALM.z + 15; z > PALM.trunkEnd; z -= 6 / density) { push(PALM.x - 5, z); push(PALM.x + 5, z); }
    // Dubai Hills e parchi
    for (let i = 0; i < 160 * density; i++) push(-175 + (r() - 0.5) * 110, 140 + (r() - 0.5) * 40);
    // ingresso del cantiere
    for (let i = 0; i < 8; i++) push(SITE[0] - 30 + i * 8, SITE[1] + 38);
    return out;
  }, [density]);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8b6a4b", roughness: 0.95 }), []);
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5d8c33", roughness: 0.7, side: THREE.DoubleSide }), []);
  const a = useRef<THREE.InstancedMesh>(null), b = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    spots.forEach((q, i) => {
      o.position.set(q.x, 0, q.z); o.rotation.set(0, q.ry, 0); o.scale.setScalar(q.s); o.updateMatrix();
      a.current!.setMatrixAt(i, o.matrix); b.current!.setMatrixAt(i, o.matrix);
      b.current!.setColorAt(i, c.setHSL(0.24 + (i % 5) * 0.012, 0.5, 0.32 + (i % 3) * 0.04));
    });
    for (const m of [a.current!, b.current!]) { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); }
    if (b.current!.instanceColor) b.current!.instanceColor.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={a} args={[trunk, trunkMat, spots.length]} castShadow />
      <instancedMesh ref={b} args={[crown, leafMat, spots.length]} castShadow />
    </>
  );
}

export function Streets({ density }: { density: number }) {
  const curves = useMemo(() => ROADS.map((road) => {
    const curve = new THREE.CatmullRomCurve3(road.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, "centripetal");
    curve.arcLengthDivisions = 600;
    return { curve, len: curve.getLength(), road };
  }), []);
  const geos = useMemo(() => curves.map((c) => ribbon(c.curve, c.road.width)), [curves]);
  const mats = useMemo(() => ROADS.map((r) => new THREE.MeshStandardMaterial({ map: roadTexture(r.median), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 })), []);
  return (
    <group>
      {geos.map((g, i) => <mesh key={i} geometry={g} material={mats[i]} receiveShadow />)}
      <StreetLights curves={curves} />
      <Traffic curves={curves} density={density} />
    </group>
  );
}
