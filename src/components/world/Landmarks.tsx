"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { facadeMaterial, facadeUniforms } from "./facade";
import { PALM } from "./geo";

/** Superficie a vela (Burj Al Arab): griglia parametrica curva. */
function sailGeometry(H = 30, W = 15, bulge = 4.2, lean = 7) {
  const nu = 18, nv = 30;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const w = W * (1 - Math.pow(v, 1.35) * 0.9);
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const x = (u - 0.5) * w;
      const z = Math.sin(Math.PI * u) * bulge * (1 - v * 0.55) + lean * (1 - Math.cos((v * Math.PI) / 2));
      pos.push(x, v * H, z);
      uv.push(u, v);
    }
  }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function BurjAlArab() {
  const sail = useMemo(() => sailGeometry(), []);
  const body = useMemo(() => {
    const parts = [
      new THREE.BoxGeometry(12, 26, 1.2).translate(0, 13, -2.5).toNonIndexed(),
      new THREE.CylinderGeometry(0.45, 0.6, 34, 10).translate(-6.5, 17, -4).toNonIndexed(),
      new THREE.CylinderGeometry(0.45, 0.6, 34, 10).translate(6.5, 17, -4).toNonIndexed(),
      new THREE.CylinderGeometry(0.25, 0.4, 8, 8).translate(0, 31, -1).toNonIndexed(),
      new THREE.CylinderGeometry(2.4, 2.4, 0.3, 24).translate(5.5, 22, -6).toNonIndexed(),
    ];
    return mergeGeometries(parts)!;
  }, []);
  const sailMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbfbf8", roughness: 0.45, metalness: 0, side: THREE.DoubleSide, emissive: "#ffffff", emissiveIntensity: 0 }), []);
  const glassMat = useMemo(() => facadeMaterial({ color: "#e9f3f8" }, { style: "landmark", floorH: 0.9, colW: 0.8, glass: "#5bb4e0", litRatio: 0.55 }), []);
  const hue = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const n = facadeUniforms.uNight.value;
    hue.setHSL((clock.elapsedTime * 0.03) % 1, 0.65, 0.55);
    sailMat.emissive.copy(hue);
    sailMat.emissiveIntensity = n * 0.9;
  });
  return (
    <group position={[-205, 0, -262]} rotation-y={Math.PI * 0.86}>
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[11, 12, 1.2, 40]} />
        <meshStandardMaterial color="#f6dfb2" roughness={0.9} />
      </mesh>
      <mesh geometry={sail} material={sailMat} castShadow position={[0, 0.2, 0]} />
      <mesh geometry={body} material={glassMat} castShadow />
    </group>
  );
}

function EmiratesTowers() {
  const mat = useMemo(() => facadeMaterial({ color: "#d9e6f2" }, { style: "landmark", floorH: 0.55, colW: 0.6, glass: "#3f7fb8", litRatio: 0.4 }), []);
  return (
    <group position={[58, 0, -86]}>
      {[[0, 0, 36], [9, 9, 31]].map(([x, z, h], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={0.4}>
          <mesh position={[0, h / 2, 0]} material={mat} castShadow receiveShadow>
            <cylinderGeometry args={[4.2, 4.6, h, 3]} />
          </mesh>
          <mesh position={[0, h + 2.4, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.2, 4.2, 4.8, 3]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MuseumOfTheFuture() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dfe9f1", roughness: 0.4, metalness: 0.2, emissive: "#9fd0ff", emissiveIntensity: 0, flatShading: true }), []);
  useFrame(() => { mat.emissiveIntensity = facadeUniforms.uNight.value * 0.35; });
  return (
    <group position={[22, 0, -86]} rotation-y={0.5}>
      <mesh position={[0, 1, 0]} receiveShadow>
        <sphereGeometry args={[9, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7fcf6a" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 8.6, 0]} scale={[1, 1.3, 0.75]} material={mat} castShadow>
        <torusGeometry args={[4.6, 1.75, 24, 64]} />
      </mesh>
    </group>
  );
}

function DubaiFrame() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f2c14e", roughness: 0.4, metalness: 0.15, emissive: "#ffcc66", emissiveIntensity: 0 }), []);
  useFrame(() => { mat.emissiveIntensity = facadeUniforms.uNight.value * 0.5; });
  return (
    <group position={[128, 0, -152]} rotation-y={0.6}>
      <mesh position={[-5.2, 8, 0]} material={mat} castShadow><boxGeometry args={[2.2, 16, 1.6]} /></mesh>
      <mesh position={[5.2, 8, 0]} material={mat} castShadow><boxGeometry args={[2.2, 16, 1.6]} /></mesh>
      <mesh position={[0, 16.6, 0]} material={mat} castShadow><boxGeometry args={[12.6, 2, 1.6]} /></mesh>
    </group>
  );
}

function CayanTower() {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const n = 44, h = 0.78;
    for (let i = 0; i < n; i++) {
      const b = new THREE.BoxGeometry(5.2, h, 5.2);
      b.rotateY((i / n) * (Math.PI / 2));
      b.translate(0, i * h + h / 2, 0);
      parts.push(b.toNonIndexed());
    }
    return mergeGeometries(parts)!;
  }, []);
  const mat = useMemo(() => facadeMaterial({ color: "#9fdcd0" }, { style: "landmark", floorH: 0.78, colW: 0.7, glass: "#2f8f9f", litRatio: 0.45 }), []);
  return <mesh geometry={geo} material={mat} position={[-470, 0, -100]} castShadow receiveShadow />;
}

function DubaiMall() {
  const mat = useMemo(() => facadeMaterial({ color: "#fbe7c8" }, { style: "residential", floorH: 1.6, colW: 2.4, glass: "#4f86a8", litRatio: 0.6 }), []);
  return (
    <group position={[78, 0, 62]}>
      <mesh position={[0, 3, 0]} material={mat} castShadow receiveShadow><boxGeometry args={[58, 6, 30]} /></mesh>
      <mesh position={[0, 6.4, 0]} castShadow><boxGeometry args={[46, 0.8, 4]} /><meshStandardMaterial color="#9fd6ee" roughness={0.4} /></mesh>
      <mesh position={[-18, 5, 16]} castShadow material={mat}><boxGeometry args={[14, 10, 8]} /></mesh>
    </group>
  );
}

function Atlantis() {
  const mat = useMemo(() => facadeMaterial({ color: "#f7b2a0" }, { style: "residential", floorH: 0.8, colW: 0.9, glass: "#4d7fa3", litRatio: 0.55 }), []);
  const z = PALM.crescentZ - PALM.crescentR + 2;
  return (
    <group position={[PALM.x, 0, z]}>
      {[-7, 7].map((x) => <mesh key={x} position={[x, 8, 0]} material={mat} castShadow><boxGeometry args={[7, 16, 6]} /></mesh>)}
      <mesh position={[0, 14, 0]} material={mat} castShadow><boxGeometry args={[7.2, 4, 5]} /></mesh>
      {[-14, 14].map((x) => <mesh key={x} position={[x, 4.5, 1]} material={mat} castShadow><boxGeometry args={[9, 9, 5]} /></mesh>)}
    </group>
  );
}

export function Landmarks() {
  const g = useRef<THREE.Group>(null);
  return (
    <group ref={g}>
      <BurjAlArab />
      <EmiratesTowers />
      <MuseumOfTheFuture />
      <DubaiFrame />
      <CayanTower />
      <DubaiMall />
      <Atlantis />
    </group>
  );
}
