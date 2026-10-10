"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AREA_POS, buildTowers, SITE } from "./geo";
import { buildBurjGeometry } from "./burj";
import { buildJib, buildMast } from "./crane";
import { facadeMaterial, facadeUniforms } from "./facade";
import { LAND, makeLandTextures, makeWaterNormal } from "./textures";
import { Sky, skyUniforms } from "./Sky";
import { currentChapter, mapFocus, pinEls, setWorldReady, type ChapterId } from "./store";

export type Tier = "high" | "mid" | "low";

const Q = { high: { density: 1, dpr: 1.75, tex: 4096, shadows: true }, mid: { density: 0.7, dpr: 1.4, tex: 2048, shadows: true }, low: { density: 0.42, dpr: 1, tex: 2048, shadows: false } };

/* ─── utilità ──────────────────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tri = (a: THREE.Color, b: THREE.Color, c: THREE.Color, t: number, out: THREE.Color) =>
  t < 0.5 ? out.copy(a).lerp(b, t * 2) : out.copy(b).lerp(c, t * 2 - 1);

const HOR = [new THREE.Color(0.98, 0.8, 0.62), new THREE.Color(0.97, 0.55, 0.36), new THREE.Color(0.1, 0.12, 0.2)];
const SUN_COL = [new THREE.Color("#ffd6a8"), new THREE.Color("#ff9a62"), new THREE.Color("#7f95c9")];
const HEMI_SKY = [new THREE.Color("#bcd2e2"), new THREE.Color("#7c7aa3"), new THREE.Color("#1b2742")];
const HEMI_GND = [new THREE.Color("#d9bf96"), new THREE.Color("#73524a"), new THREE.Color("#0b0f18")];

/* ─── keyframe della camera per capitolo ───────────────────────────────── */
type Shot = { pos: THREE.Vector3; look: THREE.Vector3; tod: number; fog: [number, number] };

function shot(id: ChapterId, p: number, aspect: number, out: Shot) {
  const narrow = aspect < 0.8; // smartphone in verticale: camera più lontana
  const k = narrow ? 1.45 : 1;
  switch (id) {
    case "intro": {
      const e = ease(p);
      out.pos.set(lerp(150, 62, e) * k, lerp(26, 10, e), lerp(520, 140, e) * k);
      out.look.set(0, lerp(40, 48, e), 0);
      out.tod = 0.08;
      out.fog = [420, 3000];
      break;
    }
    case "rise": {
      const e = ease(p);
      const a = 0.417 + e * 2.3;
      const r = lerp(Math.hypot(62, 140), 52, ease(Math.min(1, p * 1.6))) * (narrow ? 1.25 : 1);
      out.pos.set(Math.sin(a) * r, lerp(10, 100, e), Math.cos(a) * r);
      out.look.set(0, lerp(48, 80, e), 0);
      out.tod = lerp(0.08, 0.3, p);
      out.fog = [380, 3000];
      break;
    }
    case "map": {
      if (narrow) {
        const f = AREA_POS[mapFocus.id] ?? [0, 0, 0];
        out.look.set(f[0], 0, f[2] + 150);
        out.pos.set(f[0] + 40, 980, f[2] + 760);
      } else {
        out.pos.set(lerp(-150, -60, p), 700, 520 + p * 20);
        out.look.set(-110, 0, -40);
      }
      out.tod = 0.12;
      out.fog = narrow ? [1400, 4200] : [900, 3200];
      break;
    }
    case "build": {
      const e = ease(p);
      const a = 0.35 + e * 1.3;
      const r = lerp(165, 125, e) * k;
      out.pos.set(SITE[0] + Math.sin(a) * r, lerp(40, 75, e), SITE[1] + Math.cos(a) * r);
      out.look.set(SITE[0] - 15, lerp(18, 28, e), SITE[1]);
      out.tod = 0.02;
      out.fog = [300, 2400];
      break;
    }
    case "night": {
      const e = ease(p);
      out.pos.set(lerp(40, 230, e) * k, lerp(26, 110, e), lerp(130, 600, e) * k);
      out.look.set(lerp(0, -40, e), lerp(48, 20, e), lerp(0, -120, e));
      out.tod = lerp(0.62, 1, Math.min(1, p * 1.4));
      out.fog = [300, 2600];
      break;
    }
  }
  return out;
}

/* ─── luci + ambiente ──────────────────────────────────────────────────── */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 16),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }),
    );
    // gradiente verticale semplice per i riflessi
    const pos = sky.geometry.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const top = new THREE.Color("#7fa6c4"), hor = new THREE.Color("#f6c99b"), gnd = new THREE.Color("#b49a7c");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 100;
      if (y > 0) c.copy(hor).lerp(top, Math.pow(y, 0.6)); else c.copy(hor).lerp(gnd, Math.min(1, -y * 3));
      cols.set([c.r, c.g, c.b], i * 3);
    }
    sky.geometry.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    envScene.add(sky);
    const rt = pm.fromScene(envScene, 0.02);
    scene.environment = rt.texture;
    return () => { rt.dispose(); pm.dispose(); sky.geometry.dispose(); (sky.material as THREE.Material).dispose(); };
  }, [gl, scene]);
  return null;
}

/* ─── suolo + mare ─────────────────────────────────────────────────────── */
function Ground({ tier }: { tier: Tier }) {
  const { day, night } = useMemo(() => makeLandTextures(Q[tier].tex), [tier]);
  const water = useMemo(() => makeWaterNormal(), []);
  const landMat = useRef<THREE.MeshStandardMaterial>(null);
  const waterMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (landMat.current) landMat.current.emissiveIntensity = facadeUniforms.uNight.value * 1.4;
    water.offset.x += dt * 0.004;
    water.offset.y += dt * 0.0025;
    if (waterMat.current) waterMat.current.envMapIntensity = 1 - facadeUniforms.uNight.value * 0.7;
  });
  useEffect(() => () => { day.dispose(); night.dispose(); water.dispose(); }, [day, night, water]);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[(LAND.x0 + LAND.x1) / 2, 0, (LAND.z0 + LAND.z1) / 2]} receiveShadow>
        <planeGeometry args={[LAND.x1 - LAND.x0, LAND.z1 - LAND.z0]} />
        <meshStandardMaterial ref={landMat} map={day} emissiveMap={night} emissive="#ffffff" emissiveIntensity={0} alphaTest={0.5} roughness={0.95} />
      </mesh>
      {/* deserto oltre il bordo della mappa */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 2400]}>
        <planeGeometry args={[9000, 2800]} />
        <meshStandardMaterial color="#d6bf98" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]}>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial ref={waterMat} color="#1f6d76" roughness={0.22} metalness={0.1} normalMap={water} normalScale={new THREE.Vector2(0.12, 0.12)} />
      </mesh>
    </>
  );
}

/* ─── città ────────────────────────────────────────────────────────────── */
function City({ tier }: { tier: Tier }) {
  const towers = useMemo(() => buildTowers(Q[tier].density), [tier]);
  const boxes = useMemo(() => towers.filter((t) => !t.round), [towers]);
  const rounds = useMemo(() => towers.filter((t) => t.round), [towers]);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const roundRef = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => facadeMaterial({ color: "#ffffff", roughness: 0.6, metalness: 0.15 }, { floorH: 1.05, colW: 1.6, glassTint: "#8eabbe", glassAmt: 0.5, litRatio: 0.26 }), []);
  const glass = useMemo(() => facadeMaterial({ color: "#ffffff", roughness: 0.2, metalness: 0.5 }, { floorH: 0.9, colW: 1.2, glassTint: "#7f9fb4", glassAmt: 0.6, litRatio: 0.3 }), []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    boxes.forEach((t, i) => {
      o.position.set(t.x, t.h / 2, t.z); o.scale.set(t.w, t.h, t.d); o.updateMatrix();
      boxRef.current!.setMatrixAt(i, o.matrix);
      boxRef.current!.setColorAt(i, c.setHex(t.c));
    });
    boxRef.current!.instanceMatrix.needsUpdate = true;
    if (boxRef.current!.instanceColor) boxRef.current!.instanceColor.needsUpdate = true;
    boxRef.current!.computeBoundingSphere();
    rounds.forEach((t, i) => {
      o.position.set(t.x, t.h / 2, t.z); o.scale.set(t.w * 0.55, t.h, t.w * 0.55); o.updateMatrix();
      roundRef.current!.setMatrixAt(i, o.matrix);
      roundRef.current!.setColorAt(i, c.setHex(0xb8cad6));
    });
    roundRef.current!.instanceMatrix.needsUpdate = true;
    if (roundRef.current!.instanceColor) roundRef.current!.instanceColor.needsUpdate = true;
    roundRef.current!.computeBoundingSphere();
  }, [boxes, rounds]);

  return (
    <>
      <instancedMesh ref={boxRef} args={[undefined, mat, boxes.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={roundRef} args={[undefined, glass, Math.max(1, rounds.length)]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 1, 20]} />
      </instancedMesh>
    </>
  );
}

function Burj() {
  const geo = useMemo(buildBurjGeometry, []);
  const mat = useMemo(() => facadeMaterial({ color: "#e8eef2", roughness: 0.2, metalness: 0.8 }, { floorH: 0.62, colW: 0.9, glassTint: "#8aa6b8", glassAmt: 0.5, litRatio: 0.45 }), []);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.opacity = facadeUniforms.uNight.value * (0.55 + 0.45 * Math.sin(clock.elapsedTime * 2.4));
  });
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh position={[0, 83.4, 0]}>
        <sphereGeometry args={[0.45, 12, 8]} />
        <meshBasicMaterial ref={beacon} color="#ff5a3c" transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ─── gru ──────────────────────────────────────────────────────────────── */
const craneMat = new THREE.MeshStandardMaterial({ color: "#e2a93a", roughness: 0.55, metalness: 0.35 });

function Crane({ x, z, base = 0, height, jib = 34, speed = 0.12, phase = 0, progressRef }: { x: number; z: number; base?: number; height: number; jib?: number; speed?: number; phase?: number; progressRef?: { current: number } }) {
  const mast = useMemo(() => buildMast(height), [height]);
  const arm = useMemo(() => buildJib(jib), [jib]);
  const rot = useRef<THREE.Group>(null);
  const trolley = useRef<THREE.Group>(null);
  const cable = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pr = progressRef?.current ?? 0;
    if (rot.current) rot.current.rotation.y = phase + Math.sin(t * speed + phase) * 1.1 + pr * 2.5;
    const d = 8 + (Math.sin(t * speed * 1.7 + phase) * 0.5 + 0.5) * (jib - 12);
    const drop = 6 + (Math.sin(t * speed * 1.3 + phase * 2) * 0.5 + 0.5) * (height * 0.55);
    if (trolley.current) trolley.current.position.x = d;
    if (cable.current) { cable.current.scale.y = drop; cable.current.position.y = -drop / 2; }
    if (trolley.current) (trolley.current.children[1] as THREE.Object3D).position.y = -drop - 0.8;
  });
  return (
    <group position={[x, base, z]}>
      <mesh geometry={mast} material={craneMat} castShadow />
      <group ref={rot} position={[0, height, 0]}>
        <mesh geometry={arm} material={craneMat} castShadow />
        <group ref={trolley} position={[10, 0, 0]}>
          <mesh ref={cable}>
            <boxGeometry args={[0.05, 1, 0.05]} />
            <meshStandardMaterial color="#2b2b2b" />
          </mesh>
          <mesh>
            <boxGeometry args={[2.4, 1.2, 1.2]} />
            <meshStandardMaterial color="#8c8378" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ─── cantiere off-plan ────────────────────────────────────────────────── */
const FLOORS = 30, FH = 1.65, FP = 17;

function ConstructionSite({ progressRef }: { progressRef: { current: number } }) {
  const slabs = useRef<THREE.InstancedMesh>(null);
  const cols = useRef<THREE.InstancedMesh>(null);
  const panels = useRef<THREE.InstancedMesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Group>(null);
  const climb = useRef<THREE.Group>(null);
  const glassMat = useMemo(() => facadeMaterial({ color: "#bcd3df", roughness: 0.1, metalness: 0.7 }, { floorH: FH, colW: 1.4, glassTint: "#6f93aa", glassAmt: 0.6, litRatio: 0.35 }), []);
  const concrete = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bdb6aa", roughness: 0.9 }), []);
  const [sx, sz] = SITE;

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let f = 0; f < FLOORS; f++) {
      o.position.set(sx, (f + 1) * FH, sz); o.scale.set(FP + 1, 0.35, FP + 1); o.rotation.set(0, 0, 0); o.updateMatrix();
      slabs.current!.setMatrixAt(f, o.matrix);
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [1, 0], [0, 1], [-1, 0]];
      pts.forEach(([a, b], k) => {
        o.position.set(sx + (a * FP) / 2, f * FH + FH / 2, sz + (b * FP) / 2); o.scale.set(0.5, FH, 0.5); o.updateMatrix();
        cols.current!.setMatrixAt(f * 8 + k, o.matrix);
      });
      for (let s = 0; s < 4; s++) {
        const ang = (s * Math.PI) / 2;
        o.position.set(sx + Math.sin(ang) * (FP / 2 + 0.3), f * FH + FH / 2 + 0.2, sz + Math.cos(ang) * (FP / 2 + 0.3));
        o.rotation.set(0, ang, 0); o.scale.set(FP + 0.6, FH - 0.05, 0.25); o.updateMatrix();
        panels.current!.setMatrixAt(f * 4 + s, o.matrix);
      }
      o.rotation.set(0, 0, 0);
    }
    [slabs, cols, panels].forEach((r) => { r.current!.instanceMatrix.needsUpdate = true; r.current!.count = 0; r.current!.computeBoundingSphere(); });
  }, [sx, sz]);

  useFrame(() => {
    const p = progressRef.current;
    const structure = range(p, 0.08, 0.66);
    const facade = range(p, 0.34, 0.9);
    const nSlab = Math.floor(structure * FLOORS);
    if (slabs.current) slabs.current.count = nSlab;
    if (cols.current) cols.current.count = Math.min(FLOORS, nSlab + 1) * 8 * (structure > 0 ? 1 : 0);
    if (panels.current) panels.current.count = Math.floor(facade * FLOORS) * 4;
    const h = Math.max(0.01, Math.min(FLOORS, nSlab + 2) * FH * (structure > 0 ? 1 : 0));
    if (core.current) { core.current.scale.y = h; core.current.position.y = h / 2; }
    if (crownRef.current) crownRef.current.visible = p > 0.9;
    if (climb.current) climb.current.position.y = Math.max(0, h - 6);
  });

  return (
    <group>
      {/* area di cantiere */}
      <mesh rotation-x={-Math.PI / 2} position={[sx, 0.08, sz]} receiveShadow>
        <planeGeometry args={[70, 62]} />
        <meshStandardMaterial color="#b89c78" roughness={1} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[sx + s * 35, 1, sz]}>
          <boxGeometry args={[0.15, 2, 62]} />
          <meshStandardMaterial color="#e8e3d8" roughness={0.8} />
        </mesh>
      ))}
      {[[-22, 22], [-26, 16], [24, 24]].map(([a, b], i) => (
        <mesh key={i} position={[sx + a, 1.3, sz + b]} castShadow>
          <boxGeometry args={[6, 2.6, 2.6]} />
          <meshStandardMaterial color={i === 2 ? "#4f6d7a" : "#ece7dc"} roughness={0.7} />
        </mesh>
      ))}
      <mesh ref={core} position={[sx, 0, sz]} material={concrete} castShadow>
        <boxGeometry args={[6, 1, 6]} />
      </mesh>
      <instancedMesh ref={slabs} args={[undefined, concrete, FLOORS]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={cols} args={[undefined, concrete, FLOORS * 8]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={panels} args={[undefined, glassMat, FLOORS * 4]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <group ref={crownRef} visible={false}>
        <mesh position={[sx, FLOORS * FH + 2.2, sz]} castShadow>
          <boxGeometry args={[12, 4, 12]} />
          <meshStandardMaterial color="#d7dde0" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      {/* gru: una "rampicante" che sale con l'edificio, una fissa a lato */}
      <group ref={climb}>
        <Crane x={sx + 5} z={sz - 5} height={14} jib={30} speed={0.22} phase={0.4} progressRef={progressRef} />
      </group>
      <Crane x={sx - 22} z={sz + 8} height={62} jib={36} speed={0.16} phase={2.1} progressRef={progressRef} />
    </group>
  );
}

/* ─── regia: camera, luci, tempo, pin ──────────────────────────────────── */
function Director({ reduced, buildProgress }: { reduced: boolean; buildProgress: { current: number } }) {
  const { camera, scene, gl, size } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo<Shot>(() => ({ pos: new THREE.Vector3(150, 26, 520), look: new THREE.Vector3(0, 40, 0), tod: 0.08, fog: [420, 3000] }), []);
  const look = useRef(new THREE.Vector3(0, 40, 0));
  const tod = useRef(0.08);
  const last = useRef<ChapterId | null>(null);
  const fog = useMemo(() => new THREE.Fog("#f2c9a0", 420, 3000), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const par3 = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    scene.fog = fog;
    const onMove = (e: PointerEvent) => { pointer.current.x = e.clientX / window.innerWidth - 0.5; pointer.current.y = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); scene.fog = null; };
  }, [scene, fog]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const ch = currentChapter();
    if (!ch) return;
    shot(ch.id, ch.p, size.width / size.height, target);
    if (ch.id === "build") buildProgress.current = ch.p;
    const jump = last.current !== ch.id && !(last.current === "intro" && ch.id === "rise") && !(last.current === "rise" && ch.id === "intro");
    last.current = ch.id;
    const k = reduced || jump ? 1 : 1 - Math.exp(-dt * 5);
    // parallasse leggerissima col mouse
    const par = ch.id === "map" ? 0 : 1;
    v.copy(target.pos).add(par3.set(pointer.current.x * 4 * par, -pointer.current.y * 2 * par, 0));
    camera.position.lerp(v, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);
    tod.current = lerp(tod.current, target.tod, jump ? 1 : 1 - Math.exp(-dt * 3));

    // luce e atmosfera
    const t = tod.current;
    skyUniforms.uTod.value = t;
    const night = range(t, 0.45, 0.85);
    facadeUniforms.uNight.value = night;
    const sunY = lerp(0.2, -0.05, range(t, 0, 0.6));
    skyUniforms.uSun.value.set(-0.85, sunY, -1).normalize();
    if (sun.current) {
      tri(SUN_COL[0], SUN_COL[1], SUN_COL[2], t, sun.current.color);
      sun.current.intensity = lerp(3.4, 0.35, range(t, 0, 0.9));
      if (night > 0.5) sun.current.position.set(300, 500, 200); else sun.current.position.set(-0.85 * 900, Math.max(0.12, sunY) * 900 + 60, -900);
    }
    if (hemi.current) {
      tri(HEMI_SKY[0], HEMI_SKY[1], HEMI_SKY[2], t, hemi.current.color);
      tri(HEMI_GND[0], HEMI_GND[1], HEMI_GND[2], t, hemi.current.groundColor);
      hemi.current.intensity = lerp(1.25, 0.45, range(t, 0, 1));
    }
    tri(HOR[0], HOR[1], HOR[2], t, tmp);
    fog.color.copy(tmp);
    fog.near = lerp(fog.near, target.fog[0], k);
    fog.far = lerp(fog.far, target.fog[1], k);
    gl.toneMappingExposure = lerp(1.12, 1.25, night);
    scene.environmentIntensity = lerp(1, 0.25, night);

    // pin della mappa
    if (ch.id === "map") {
      pinEls.forEach((el, id) => {
        const pos = AREA_POS[id];
        if (!pos) return;
        v.set(pos[0], pos[1], pos[2]).project(camera);
        const x = (v.x * 0.5 + 0.5) * size.width, y = (-v.y * 0.5 + 0.5) * size.height;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        el.style.opacity = v.z < 1 ? "1" : "0";
      });
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#bcd2e2", "#d9bf96", 1.25]} />
      <directionalLight
        ref={sun}
        position={[-290, 240, -900]}
        intensity={3.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-320}
        shadow-camera-right={320}
        shadow-camera-top={320}
        shadow-camera-bottom={-320}
        shadow-camera-near={100}
        shadow-camera-far={2400}
        shadow-bias={-0.0006}
        shadow-normalBias={0.6}
      />
    </>
  );
}

/** Qualità adattiva: se i frame rallentano abbassa la risoluzione, se c'è margine la rialza. */
function AdaptiveDpr({ max }: { max: number }) {
  const { gl, setDpr } = useThree();
  const acc = useRef({ t: 0, n: 0, dpr: Math.min(max, window.devicePixelRatio || 1) });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt; a.n++;
    if (a.t < 1.2) return;
    const fps = a.n / a.t;
    a.t = 0; a.n = 0;
    if (fps < 45 && a.dpr > 0.7) { a.dpr = Math.max(0.7, a.dpr - 0.25); setDpr(a.dpr); }
    else if (fps > 58 && a.dpr < Math.min(max, window.devicePixelRatio || 1)) { a.dpr = Math.min(max, a.dpr + 0.1); setDpr(a.dpr); }
  });
  useEffect(() => { gl.setPixelRatio(acc.current.dpr); }, [gl]);
  return null;
}

function StaticShadows() {
  const { gl } = useThree();
  const frames = useRef(0);
  useEffect(() => { gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; }, [gl]);
  useFrame(() => { if (frames.current++ < 3) gl.shadowMap.needsUpdate = true; });
  return null;
}

function Ready() {
  const n = useRef(0);
  useFrame(() => { if (++n.current === 3) setWorldReady(); });
  return null;
}

export default function WorldScene({ tier, reduced, active }: { tier: Tier; reduced: boolean; active: boolean }) {
  const buildProgress = useRef(0);
  const q = Q[tier];
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows={q.shadows ? "soft" : false}
      dpr={[0.7, q.dpr]}
      gl={{ antialias: tier !== "low", powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 38, near: 1, far: 6000, position: [150, 26, 520] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1; }}
      aria-hidden
    >
      <Environment />
      <Sky />
      <Director reduced={reduced} buildProgress={buildProgress} />
      <Ground tier={tier} />
      <City tier={tier} />
      <Burj />
      <ConstructionSite progressRef={buildProgress} />
      <Crane x={150} z={-20} height={58} jib={32} speed={0.1} phase={1} />
      <Crane x={-470} z={-40} height={72} jib={34} speed={0.08} phase={3} />
      <Crane x={300} z={-290} height={50} jib={30} speed={0.12} phase={5} />
      {q.shadows && <StaticShadows />}
      <AdaptiveDpr max={q.dpr} />
      <Ready />
    </Canvas>
  );
}
