"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { seeded } from "@/lib/random";

/** Stato della luce: elevazione/azimut del sole (gradi) e quanto è notte (0–1). */
export const sunState = { elevation: 40, azimuth: 48, night: 0, sun: new THREE.Vector3() };

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

/** Cielo stilizzato: sfumatura pastello di giorno, viola-blu stellato di notte. */
const frag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uSun;
uniform float uNight;
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 dayTop = vec3(0.30, 0.66, 0.95), dayMid = vec3(0.62, 0.84, 0.97), dayHor = vec3(1.0, 0.93, 0.80);
  vec3 nTop = vec3(0.04, 0.05, 0.16), nMid = vec3(0.13, 0.11, 0.30), nHor = vec3(0.45, 0.28, 0.42);
  vec3 day = mix(dayHor, mix(dayMid, dayTop, smoothstep(0.15, 0.7, h)), smoothstep(0.0, 0.18, h));
  vec3 nig = mix(nHor, mix(nMid, nTop, smoothstep(0.1, 0.6, h)), smoothstep(0.0, 0.2, h));
  vec3 col = mix(day, nig, uNight);
  float s = max(dot(d, normalize(uSun)), 0.0);
  col += vec3(1.0, 0.86, 0.55) * (pow(s, 40.0) * 0.35 + smoothstep(0.9975, 0.999, s) * 0.9) * (1.0 - uNight);
  vec2 g = floor(d.xz / max(d.y, 0.05) * 240.0);
  col += vec3(step(0.9975, h21(g)) * smoothstep(0.1, 0.4, d.y)) * uNight;
  if (d.y < 0.0) col = mix(dayHor, nHor, uNight);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Nuvole a sbuffo low-poly che attraversano lentamente il cielo. */
function Clouds() {
  const geo = useMemo(() => {
    const r = seeded(91);
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const s = 1 - Math.abs(i - 2.5) * 0.18 + r() * 0.15;
      const g = new THREE.IcosahedronGeometry(9 * s, 1);
      g.translate((i - 2.5) * 9, (r() - 0.3) * 4, (r() - 0.5) * 8);
      parts.push(g.toNonIndexed());
    }
    const m = mergeGeometries(parts)!;
    m.scale(1, 0.62, 1);
    m.computeVertexNormals();
    return m;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, flatShading: true, emissive: "#dfe8ff", emissiveIntensity: 0.25, transparent: true }), []);
  const clouds = useMemo(() => {
    const r = seeded(4);
    return Array.from({ length: 16 }, () => ({ x: (r() - 0.5) * 2400, z: -900 + r() * 1500, y: 150 + r() * 120, s: 0.8 + r() * 1.3, v: 2 + r() * 3 }));
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    clouds.forEach((c, i) => {
      const x = ((c.x + clock.elapsedTime * c.v + 3600) % 2400) - 1200;
      o.position.set(x, c.y, c.z); o.scale.setScalar(c.s); o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    mat.opacity = 1 - sunState.night * 0.85;
    mat.emissiveIntensity = 0.25 * (1 - sunState.night);
  });
  return <instancedMesh ref={ref} args={[geo, mat, clouds.length]} frustumCulled={false} />;
}

export function Atmosphere() {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uSun: { value: new THREE.Vector3() }, uNight: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false }),
    [],
  );
  useFrame(() => {
    const s = sunState;
    s.sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - s.elevation), THREE.MathUtils.degToRad(s.azimuth));
    mat.uniforms.uSun.value.copy(s.sun);
    mat.uniforms.uNight.value = s.night;
  });
  return (
    <>
      <mesh material={mat} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[4000, 32, 16]} />
      </mesh>
      <Clouds />
    </>
  );
}
