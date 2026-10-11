"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AREA_POS, buildTowers, SITE } from "./geo";
import { buildBurjGeometry } from "./burj";
import { clampMaterial, facadeMaterial, facadeUniforms } from "./facade";
import { LAND, makeDetailTexture, makeLandTextures, makeWaterNormal } from "./textures";
import { Atmosphere, sunState } from "./Sky";
import { City } from "./City";
import { Landmarks } from "./Landmarks";
import { Palms, Streets } from "./Streets";
import { ConstructionSite, Crane } from "./Site";
import { Boats, Trees } from "./Props";
import { currentChapter, mapFocus, pinEls, setWorldReady, type ChapterId } from "./store";

export type Tier = "high" | "mid" | "low";

const Q = {
  high: { density: 1, dpr: 1.5, tex: 2048, shadows: true, shadowMap: 2048, aa: true, traffic: 0.8 },
  mid: { density: 0.7, dpr: 1.25, tex: 2048, shadows: true, shadowMap: 1536, aa: true, traffic: 0.5 },
  low: { density: 0.45, dpr: 1, tex: 1536, shadows: false, shadowMap: 1024, aa: false, traffic: 0.3 },
};

/* ─── utilità ──────────────────────────────────────────────────────────── */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ─── inquadrature per capitolo ────────────────────────────────────────── */
type Shot = { pos: THREE.Vector3; look: THREE.Vector3; elev: number; az: number; night: number; focus: [number, number] };

function shot(id: ChapterId, p: number, aspect: number, out: Shot) {
  const narrow = aspect < 0.8;
  const k = narrow ? 1.45 : 1;
  out.night = 0;
  switch (id) {
    case "intro": {
      const e = ease(p);
      out.pos.set(lerp(150, 62, e) * k, lerp(24, 9, e), lerp(520, 140, e) * k);
      out.look.set(0, lerp(40, 48, e), 0);
      out.elev = lerp(34, 36, p); out.az = 48; out.focus = [0, 0];
      break;
    }
    case "rise": {
      const e = ease(p);
      const a = 0.417 + e * 2.3;
      const r = lerp(Math.hypot(62, 140), 52, ease(Math.min(1, p * 1.6))) * (narrow ? 1.25 : 1);
      out.pos.set(Math.sin(a) * r, lerp(9, 100, e), Math.cos(a) * r);
      out.look.set(0, lerp(48, 80, e), 0);
      out.elev = lerp(36, 46, p); out.az = lerp(48, 128, ease(p)); out.focus = [0, 0];
      break;
    }
    case "map": {
      if (narrow) {
        const f = AREA_POS[mapFocus.id] ?? [0, 0, 0];
        out.look.set(f[0], 0, f[2] + 150);
        out.pos.set(f[0] + 40, 980, f[2] + 760);
        out.focus = [f[0], f[2]];
      } else {
        out.pos.set(lerp(-150, -60, p), 700, 520 + p * 20);
        out.look.set(-110, 0, -40);
        out.focus = [-110, -40];
      }
      out.elev = 56; out.az = 165;
      break;
    }
    case "build": {
      const e = ease(p);
      const a = 0.35 + e * 1.3;
      const r = lerp(160, 118, e) * k;
      out.pos.set(SITE[0] + Math.sin(a) * r, lerp(34, 62, e), SITE[1] + Math.cos(a) * r);
      out.look.set(SITE[0] - 10, lerp(16, 26, e), SITE[1]);
      out.elev = 46; out.az = 125; out.focus = [SITE[0], SITE[1]];
      break;
    }
    case "night": {
      const e = ease(p);
      out.pos.set(lerp(40, 230, e) * k, lerp(26, 110, e), lerp(130, 600, e) * k);
      out.look.set(lerp(0, -40, e), lerp(48, 20, e), lerp(0, -120, e));
      out.elev = lerp(2, -9, range(p, 0, 0.5)); out.az = 240;
      out.night = range(p, 0.05, 0.55);
      out.focus = [0, 0];
      break;
    }
  }
  return out;
}

/* ─── suolo + mare ─────────────────────────────────────────────────────── */
function Ground({ tex, density }: { tex: number; density: number }) {
  const { day, night } = useMemo(() => makeLandTextures(tex, buildTowers(density)), [tex, density]);
  const detail = useMemo(() => makeDetailTexture(), []);
  const water = useMemo(() => makeWaterNormal(), []);
  const landMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: day, emissiveMap: night, emissive: "#ffffff", emissiveIntensity: 0, alphaTest: 0.5, roughness: 1 });
    m.onBeforeCompile = (s) => {
      s.uniforms.uDetail = { value: detail };
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uDetail;")
        .replace("#include <map_fragment>", "#include <map_fragment>\n  diffuseColor.rgb *= mix(0.8, 1.14, texture2D(uDetail, vMapUv * 420.0).r) * mix(0.92, 1.06, texture2D(uDetail, vMapUv * 37.0).g);");
    };
    return m;
  }, [day, night, detail]);
  const waterMat = useMemo(() => clampMaterial(new THREE.MeshStandardMaterial({ color: "#2fc0d6", roughness: 0.42, metalness: 0, normalMap: water, normalScale: new THREE.Vector2(0.3, 0.3) })), [water]);
  useFrame((_, dt) => {
    landMat.emissiveIntensity = facadeUniforms.uNight.value * 1.6;
    water.offset.x += dt * 0.006;
    water.offset.y += dt * 0.004;
  });
  useEffect(() => () => { day.dispose(); night.dispose(); water.dispose(); detail.dispose(); }, [day, night, water, detail]);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[(LAND.x0 + LAND.x1) / 2, 0, (LAND.z0 + LAND.z1) / 2]} material={landMat} receiveShadow>
        <planeGeometry args={[LAND.x1 - LAND.x0, LAND.z1 - LAND.z0]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 2400]}>
        <planeGeometry args={[9000, 2800]} />
        <meshStandardMaterial color="#f2d29e" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.5, 0]} material={waterMat} receiveShadow>
        <planeGeometry args={[9000, 9000]} />
      </mesh>
    </>
  );
}

function Burj() {
  const geo = useMemo(buildBurjGeometry, []);
  const mat = useMemo(() => facadeMaterial({ color: "#f1f6fa", roughness: 0.55 }, { style: "landmark", floorH: 0.55, colW: 0.42, glass: "#4aa7d8", litRatio: 0.45 }), []);
  const beacon = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (beacon.current) beacon.current.opacity = facadeUniforms.uNight.value * (0.55 + 0.45 * Math.sin(clock.elapsedTime * 2.4));
  });
  return (
    <group>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh position={[0, 83.4, 0]}>
        <sphereGeometry args={[0.45, 12, 8]} />
        <meshBasicMaterial ref={beacon} color={[6, 1.2, 0.6]} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ─── regia: camera, sole, nebbia, ombre, pin ──────────────────────────── */
const FOG_DAY = new THREE.Color("#e3f2fb"), FOG_GOLD = new THREE.Color("#fdeedd"), FOG_NIGHT = new THREE.Color("#2a2245");
const SUN_LOW = new THREE.Color("#ffd9a6"), SUN_HIGH = new THREE.Color("#fff6e8"), MOON = new THREE.Color("#a9b8ff");

function Director({ reduced, buildProgress, tier }: { reduced: boolean; buildProgress: { current: number }; tier: Tier }) {
  const { camera, scene, gl, size } = useThree();
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo<Shot>(() => ({ pos: new THREE.Vector3(150, 24, 520), look: new THREE.Vector3(0, 40, 0), elev: 12, az: 48, night: 0, focus: [0, 0] }), []);
  const look = useRef(new THREE.Vector3(0, 40, 0));
  const light = useRef({ elev: 12, az: 48, night: 0 });
  const last = useRef<ChapterId | null>(null);
  const fog = useMemo(() => new THREE.Fog("#f2d3b0", 700, 5200), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const par3 = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const focus = useRef(new THREE.Vector3());
  const shadowTick = useRef(0);
  const lastShadow = useRef({ elev: 0, az: 0 });
  const shadowBurst = useRef(4);

  useEffect(() => {
    scene.fog = fog;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    const onMove = (e: PointerEvent) => { pointer.current.x = e.clientX / window.innerWidth - 0.5; pointer.current.y = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); scene.fog = null; };
  }, [scene, fog, gl, tier]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const ch = currentChapter();
    if (!ch) return;
    shot(ch.id, ch.p, size.width / size.height, target);
    if (ch.id === "build") buildProgress.current = ch.p;
    const jump = last.current !== ch.id && !(last.current === "intro" && ch.id === "rise") && !(last.current === "rise" && ch.id === "intro");
    last.current = ch.id;
    const k = reduced || jump ? 1 : 1 - Math.exp(-dt * 5);
    const par = ch.id === "map" ? 0 : 1;
    v.copy(target.pos).add(par3.set(pointer.current.x * 4 * par, -pointer.current.y * 2 * par, 0));
    camera.position.lerp(v, k);
    look.current.lerp(target.look, k);
    camera.lookAt(look.current);

    // luce: si muove con calma verso quella del capitolo
    const L = light.current;
    const kl = jump ? 1 : 1 - Math.exp(-dt * 2.5);
    L.elev = lerp(L.elev, target.elev, kl);
    L.az = lerp(L.az, target.az, kl);
    L.night = lerp(L.night, target.night, kl);
    sunState.elevation = L.elev; sunState.azimuth = L.az; sunState.night = L.night;
    facadeUniforms.uNight.value = L.night;

    const day = range(L.elev, 2, 30);
    if (sun.current) {
      const s = sun.current;
      focus.current.set(target.focus[0], 0, target.focus[1]);
      if (L.night > 0.5) {
        s.color.copy(MOON);
        s.intensity = 0.35;
        s.position.set(focus.current.x + 300, 600, focus.current.z + 200);
      } else {
        s.color.copy(SUN_LOW).lerp(SUN_HIGH, day);
        s.intensity = lerp(2.3, 2.7, day) * (1 - L.night);
        s.position.copy(sunState.sun).multiplyScalar(900).add(focus.current);
        s.position.y = Math.max(s.position.y, 70);
      }
      s.target.position.copy(focus.current);
      s.target.updateMatrixWorld();
      // ombre ricalcolate solo quando cambia il punto di vista o la luce si sposta
      const moved = Math.abs(L.elev - lastShadow.current.elev) > 3 || Math.abs(L.az - lastShadow.current.az) > 8;
      if (jump) shadowBurst.current = 4;
      if (shadowBurst.current > 0 || ++shadowTick.current === 5 || moved) {
        shadowBurst.current = Math.max(0, shadowBurst.current - 1);
        gl.shadowMap.needsUpdate = true;
        lastShadow.current = { elev: L.elev, az: L.az };
      }
    }
    if (hemi.current) hemi.current.intensity = lerp(1.35, 0.45, L.night);
    fog.color.copy(FOG_GOLD).lerp(FOG_DAY, day).lerp(FOG_NIGHT, L.night);
    const far = ch.id === "map" ? 9000 : lerp(5200, 3600, L.night);
    fog.near = 700; fog.far = lerp(fog.far, far, k);

    if (ch.id === "map") {
      pinEls.forEach((el, id) => {
        const pos = AREA_POS[id];
        if (!pos) return;
        v.set(pos[0], pos[1], pos[2]).project(camera);
        el.style.transform = `translate3d(${(v.x * 0.5 + 0.5) * size.width}px, ${(-v.y * 0.5 + 0.5) * size.height}px, 0)`;
        el.style.opacity = v.z < 1 ? "1" : "0";
      });
    }
  });

  const q = Q[tier];
  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe8ff", "#ffd7b0", 1.35]} />
      <directionalLight
        ref={sun}
        intensity={3}
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMap, q.shadowMap]}
        shadow-camera-left={-240}
        shadow-camera-right={240}
        shadow-camera-top={240}
        shadow-camera-bottom={-240}
        shadow-camera-near={10}
        shadow-camera-far={2400}
        shadow-bias={-0.0004}
        shadow-normalBias={0.4}
      />
    </>
  );
}

/** Qualità adattiva: se i frame rallentano abbassa la risoluzione, se c'è margine la rialza. */
function AdaptiveDpr({ max }: { max: number }) {
  const { setDpr, gl, scene } = useThree();
  const acc = useRef({ t: 0, n: 0, dpr: Math.min(1, max), warm: 0, slow: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt; a.n++;
    if (a.t < 1) return;
    const fps = a.n / a.t;
    a.t = 0; a.n = 0;
    if (a.warm++ < 2) return; // ignora i primi secondi (caricamento)
    if (fps < 48 && a.dpr > 0.6) { a.dpr = Math.max(0.6, a.dpr - 0.15); setDpr(a.dpr); }
    else if (fps < 34 && gl.shadowMap.enabled && ++a.slow > 2) {
      // dispositivo in difficoltà anche a risoluzione minima: spegne le ombre
      gl.shadowMap.enabled = false;
      scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    }
    else if (fps > 58 && a.dpr < Math.min(max, window.devicePixelRatio || 1)) { a.dpr = Math.min(max, a.dpr + 0.125); setDpr(a.dpr); }
  });
  return null;
}

/** Precompila tutti gli shader prima di mostrare la scena: niente scatti durante lo scroll. */
function Ready() {
  const { gl, scene, camera } = useThree();
  const done = useRef(false);
  const n = useRef(0);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      gl.compileAsync(scene, camera).catch(() => undefined).then(() => { if (alive) done.current = true; });
    }, 50);
    return () => { alive = false; clearTimeout(t); };
  }, [gl, scene, camera]);
  useFrame(() => { if (done.current && ++n.current === 3) setWorldReady(); });
  return null;
}

export default function WorldScene({ tier, reduced, active }: { tier: Tier; reduced: boolean; active: boolean }) {
  const buildProgress = useRef(0);
  const q = Q[tier];
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      shadows={q.shadows ? "soft" : false}
      dpr={1}
      gl={{ antialias: q.aa, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 38, near: 5, far: 6000, position: [150, 24, 520] }}
      onCreated={(state) => {
        const { gl } = state;
        if (process.env.NODE_ENV !== "production") (window as unknown as { __r3f: unknown }).__r3f = state;
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      aria-hidden
    >
      <Atmosphere />
      <Director reduced={reduced} buildProgress={buildProgress} tier={tier} />
      <Ground tex={q.tex} density={q.density} />
      <City density={q.density} />
      <Burj />
      <Landmarks />
      <Streets density={q.traffic} />
      <Palms density={q.density} />
      <Trees density={q.density} />
      <Boats density={q.density} />
      <ConstructionSite progressRef={buildProgress} />
      <Crane x={150} z={-20} height={52} jib={32} speed={0.1} phase={1} />
      <Crane x={-440} z={-40} height={60} jib={34} speed={0.08} phase={3} />
      <Crane x={300} z={-290} height={46} jib={30} speed={0.12} phase={5} />
      <AdaptiveDpr max={q.dpr} />
      <Ready />
    </Canvas>
  );
}
