import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** Palma da dattero: tronco leggermente curvo + corona di 11 foglie arcuate. Altezza ≈ 4 unità. */
export function buildPalmGeometries() {
  const H = 3.6;
  const trunk = new THREE.CylinderGeometry(0.09, 0.15, H, 7, 6, true);
  trunk.translate(0, H / 2, 0);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / H;
    p.setX(i, p.getX(i) + y * y * 0.35);
  }
  trunk.computeVertexNormals();

  const blades: THREE.BufferGeometry[] = [];
  const N = 11, seg = 7, L = 1.9;
  for (let k = 0; k < N; k++) {
    const pos: number[] = [], idx: number[] = [];
    for (let s = 0; s <= seg; s++) {
      const t = s / seg;
      const w = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.32 + 0.02;
      const x = t * L, y = 0.35 * t - 1.1 * t * t;
      pos.push(x, y, -w, x, y - 0.05 * (1 - t), 0, x, y, w);
    }
    for (let s = 0; s < seg; s++) {
      const a = s * 3;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.rotateZ(((k % 3) - 1) * 0.18 + 0.15);
    g.rotateY((k / N) * Math.PI * 2 + (k % 2) * 0.2);
    blades.push(g.toNonIndexed());
  }
  const crown = mergeGeometries(blades)!;
  crown.computeVertexNormals();
  crown.translate(0.35, H, 0);
  return { trunk, crown };
}
