"use client";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Sky as SkyImpl } from "three/examples/jsm/objects/Sky.js";

/** Stato della luce: elevazione/azimut del sole (gradi) e quanto è notte (0–1). */
export const sunState = { elevation: 12, azimuth: 48, night: 0, sun: new THREE.Vector3() };

const SKY_PARAMS = { turbidity: 2.2, rayleigh: 1.6, mieCoefficient: 0.0035, mieDirectionalG: 0.86, cloudCoverage: 0.22, cloudDensity: 0.32, cloudElevation: 0.65, cloudScale: 0.00022 };

function makeSky(scale: number) {
  const sky = new SkyImpl();
  sky.scale.setScalar(scale);
  const u = sky.material.uniforms;
  for (const [k, v] of Object.entries(SKY_PARAMS)) if (u[k]) u[k].value = v;
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  sky.material.depthWrite = false;
  return sky;
}

const nightVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const nightFrag = /* glsl */ `
varying vec3 vDir;
uniform float uNight;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 col = mix(vec3(0.16, 0.13, 0.2), vec3(0.015, 0.03, 0.07), pow(h, 0.35));
  col += vec3(0.55, 0.22, 0.1) * pow(1.0 - h, 10.0) * 0.5;
  vec2 g = floor(d.xz / max(d.y, 0.05) * 260.0);
  float st = step(0.9978, h21(g)) * smoothstep(0.1, 0.45, d.y) * (0.5 + 0.5 * h21(g + 1.0));
  col += vec3(st);
  gl_FragColor = vec4(col, uNight);
}`;

/** Cielo fisico (scattering atmosferico + nuvole), cielo notturno, e mappa di riflessi coerente. */
export function Atmosphere() {
  const { gl, scene } = useThree();
  const sky = useMemo(() => makeSky(4500), []);
  const envSky = useMemo(() => makeSky(100), []);
  const envGround = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.5, 0.36) }), []);
  const envScene = useMemo(() => {
    const s = new THREE.Scene();
    s.add(envSky);
    // sotto l'orizzonte: sabbia e città, non il nero del cielo fisico
    const g = new THREE.Mesh(new THREE.CircleGeometry(400, 32), envGround);
    g.rotation.x = -Math.PI / 2;
    g.position.y = -2;
    s.add(g);
    return s;
  }, [envSky, envGround]);
  const night = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: nightVert, fragmentShader: nightFrag, uniforms: { uNight: { value: 0 } },
      // nella lista opaca, subito dopo il cielo: sempre dietro a tutto il resto
      transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      depthWrite: false, side: THREE.BackSide, fog: false,
    }),
    [],
  );

  /**
   * Mappe di riflesso precalcolate una sola volta (alcune "ore del giorno"):
   * rigenerarle durante l'animazione interferisce con la post-produzione.
   */
  const presets = useRef<{ elev: number; night: number; rt: THREE.WebGLRenderTarget }[]>([]);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const prevTarget = gl.getRenderTarget();
    gl.setRenderTarget(null);
    const list: [number, number][] = [[4, 0], [12, 0], [22, 0], [34, 0], [48, 0], [-6, 0.6], [-9, 1]];
    const sun = new THREE.Vector3();
    presets.current = list.map(([elev, n]) => {
      sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(sunState.azimuth));
      envSky.material.uniforms.sunPosition.value.copy(sun);
      const day = THREE.MathUtils.clamp((elev + 2) / 25, 0, 1) * (1 - n);
      envGround.color.setRGB(0.62, 0.5, 0.36).multiplyScalar(0.08 + 0.92 * day);
      return { elev, night: n, rt: pmrem.fromScene(envScene, 0, 1, 1000) };
    });
    gl.setRenderTarget(prevTarget);
    pmrem.dispose();
    return () => { presets.current.forEach((p) => p.rt.dispose()); presets.current = []; };
  }, [gl, envSky, envGround, envScene]);

  useEffect(() => () => { sky.material.dispose(); envSky.material.dispose(); night.dispose(); }, [sky, envSky, night]);

  const current = useRef<THREE.Texture | null>(null);
  useFrame(({ clock }) => {
    const s = sunState;
    const phi = THREE.MathUtils.degToRad(90 - s.elevation);
    const theta = THREE.MathUtils.degToRad(s.azimuth);
    s.sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms.sunPosition.value.copy(s.sun);
    sky.material.uniforms.time.value = clock.elapsedTime;
    night.uniforms.uNight.value = s.night;

    // sceglie la mappa di riflesso più vicina alla luce attuale
    let best: THREE.Texture | null = null, bd = Infinity;
    for (const p of presets.current) {
      const d = Math.abs(p.elev - s.elevation) / 10 + Math.abs(p.night - s.night) * 3;
      if (d < bd) { bd = d; best = p.rt.texture; }
    }
    if (best && best !== current.current) { scene.environment = best; current.current = best; }
  });

  return (
    <>
      <primitive object={sky} />
      <mesh material={night} renderOrder={-9} frustumCulled={false}>
        <sphereGeometry args={[4000, 32, 16]} />
      </mesh>
    </>
  );
}
