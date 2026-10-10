import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Asta sottile tra due punti (traliccio). */
function strut(a: THREE.Vector3, b: THREE.Vector3, t = 0.14) {
  const len = a.distanceTo(b);
  const g = new THREE.BoxGeometry(t, len, t);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  g.applyQuaternion(q);
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Torre (mast) a traliccio di sezione quadrata. */
const cache = new Map<string, THREE.BufferGeometry>();
const cached = (k: string, f: () => THREE.BufferGeometry) => { let g = cache.get(k); if (!g) { g = f(); cache.set(k, g); } return g; };

export function buildMast(height: number, s = 1.6, seg = 2.4) {
  return cached(`m${height}-${s}-${seg}`, () => buildMastRaw(height, s, seg));
}
function buildMastRaw(height: number, s: number, seg: number) {
  const parts: THREE.BufferGeometry[] = [];
  const h = s / 2;
  const corners = [[-h, -h], [h, -h], [h, h], [-h, h]];
  for (const [x, z] of corners) parts.push(strut(V(x, 0, z), V(x, height, z), 0.2));
  for (let y = 0; y < height - 0.01; y += seg) {
    const y1 = Math.min(height, y + seg);
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = corners[i], [x1, z1] = corners[(i + 1) % 4];
      parts.push(strut(V(x0, y, z0), V(x1, y, z1), 0.1));
      parts.push(strut(V(x0, y, z0), V(x1, y1, z1), 0.08));
    }
  }
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** Braccio (jib + controbraccio + cabina + tiranti). Origine = sommità del mast. */
export function buildJib(jibLen = 34, counterLen = 11) {
  return cached(`j${jibLen}-${counterLen}`, () => buildJibRaw(jibLen, counterLen));
}
function buildJibRaw(jibLen: number, counterLen: number) {
  const parts: THREE.BufferGeometry[] = [];
  const w = 0.75, hh = 1.3, seg = 2;
  // braccio triangolare
  for (let x = 0; x < jibLen - 0.01; x += seg) {
    const x1 = Math.min(jibLen, x + seg);
    const taper = (t: number) => 1 - (t / jibLen) * 0.45;
    const a = V(x, 0, -w * taper(x)), b = V(x, 0, w * taper(x)), c = V(x, hh * taper(x), 0);
    const a1 = V(x1, 0, -w * taper(x1)), b1 = V(x1, 0, w * taper(x1)), c1 = V(x1, hh * taper(x1), 0);
    parts.push(strut(a, a1, 0.12), strut(b, b1, 0.12), strut(c, c1, 0.12));
    parts.push(strut(a, b, 0.07), strut(a, c, 0.07), strut(b, c, 0.07));
    parts.push(strut(a, c1, 0.06), strut(b, c1, 0.06));
  }
  // controbraccio
  for (let x = 0; x > -counterLen + 0.01; x -= seg) {
    const x1 = Math.max(-counterLen, x - seg);
    parts.push(strut(V(x, 0, -w), V(x1, 0, -w), 0.14), strut(V(x, 0, w), V(x1, 0, w), 0.14), strut(V(x, 0, -w), V(x1, 0, w), 0.07));
  }
  // zavorre
  for (let i = 0; i < 4; i++) {
    const g = new THREE.BoxGeometry(0.9, 2.2, 2.0);
    g.translate(-counterLen + 0.6 + i * 1.0, -0.6, 0);
    parts.push(g);
  }
  // testa a punta e tiranti
  const apex = V(0, 6.5, 0);
  parts.push(strut(V(-w, 0, -w), apex, 0.16), strut(V(w, 0, w), apex, 0.16), strut(V(-w, 0, w), apex, 0.16), strut(V(w, 0, -w), apex, 0.16));
  parts.push(strut(apex, V(jibLen * 0.62, hh * 0.7, 0), 0.07), strut(apex, V(jibLen * 0.3, hh * 0.85, 0), 0.07), strut(apex, V(-counterLen, 0.2, 0), 0.08));
  // cabina
  const cab = new THREE.BoxGeometry(1.8, 1.7, 1.6);
  cab.translate(1.2, -1.2, 1.4);
  parts.push(cab);
  // ralla
  const ring = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 16);
  ring.translate(0, -0.3, 0);
  parts.push(ring);
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  parts.forEach((p) => p.dispose());
  return g;
}
