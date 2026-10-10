"use client";
import { useMemo } from "react";
import * as THREE from "three";

export const skyUniforms = {
  uSun: { value: new THREE.Vector3(-0.3, 0.1, -1).normalize() },
  uTod: { value: 0 },
};

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const frag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uSun;
uniform float uTod; // 0 pomeriggio dorato · 0.5 tramonto · 1 notte
vec3 tri(vec3 a, vec3 b, vec3 c, float t){ return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, t * 2.0 - 1.0); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);
  vec3 zen = tri(vec3(0.36, 0.56, 0.74), vec3(0.20, 0.25, 0.42), vec3(0.02, 0.04, 0.08), uTod);
  vec3 hor = tri(vec3(0.98, 0.80, 0.62), vec3(0.97, 0.55, 0.36), vec3(0.10, 0.12, 0.20), uTod);
  vec3 col = mix(hor, zen, pow(h, 0.42));
  float s = max(dot(d, normalize(uSun)), 0.0);
  float vis = 1.0 - smoothstep(0.55, 0.9, uTod);
  col += vec3(1.0, 0.6, 0.3) * pow(s, 28.0) * 0.32 * vis;
  col += vec3(1.0, 0.82, 0.6) * pow(s, 260.0) * 0.7 * vis;
  col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 3.0 * vis;
  // stelle
  float night = smoothstep(0.6, 1.0, uTod);
  vec2 g = floor(d.xz / max(d.y, 0.05) * 220.0);
  float st = step(0.9975, h21(g)) * smoothstep(0.08, 0.4, d.y);
  col += vec3(st) * night * 0.9;
  // sotto l'orizzonte: foschia
  if (d.y < 0.0) col = mix(hor, hor * 0.85, min(-d.y * 4.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export function Sky() {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[4000, 32, 16]} />
    </mesh>
  );
}
