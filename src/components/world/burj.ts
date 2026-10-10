import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Torre ispirata al Burj Khalifa: pianta a Y (tre ali attorno a un nucleo esagonale),
 * gradoni che si ritirano a spirale, nucleo che continua in una guglia.
 * Altezza totale ≈ 83 unità (≈ 828 m).
 */
export function buildBurjGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const TIERS = 27;
  const TH = 2.25; // altezza gradone
  const WING_W = 4.6;
  const angles = [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3];

  for (let i = 0; i < TIERS; i++) {
    for (let k = 0; k < 3; k++) {
      const steps = Math.floor((i + (3 - k)) / 3);
      const len = 15 - steps * 1.42;
      if (len < 2.2) continue;
      const a = angles[k];
      const box = new THREE.BoxGeometry(len, TH, WING_W);
      box.translate(len / 2, i * TH + TH / 2, 0);
      box.rotateY(-a);
      parts.push(box);
      const cap = new THREE.CylinderGeometry(WING_W / 2, WING_W / 2, TH, 14, 1);
      cap.translate(len, i * TH + TH / 2, 0);
      cap.rotateY(-a);
      parts.push(cap);
    }
  }
  const topY = TIERS * TH;
  // nucleo esagonale
  const core = new THREE.CylinderGeometry(3.4, 4.2, topY, 6);
  core.translate(0, topY / 2, 0);
  parts.push(core);
  // corona e guglia
  const crown = new THREE.CylinderGeometry(1.6, 3.2, 10, 6);
  crown.translate(0, topY + 5, 0);
  parts.push(crown);
  const crown2 = new THREE.CylinderGeometry(0.9, 1.6, 6, 6);
  crown2.translate(0, topY + 13, 0);
  parts.push(crown2);
  const spire = new THREE.CylinderGeometry(0.06, 0.8, 16, 8);
  spire.translate(0, topY + 24, 0);
  parts.push(spire);
  // podio
  const podium = new THREE.CylinderGeometry(16, 17, 1.4, 6);
  podium.translate(0, 0.7, 0);
  parts.push(podium);

  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()), false)!;
  parts.forEach((p) => p.dispose());
  return g;
}
export const BURJ_HEIGHT = 27 * 2.25 + 32;
