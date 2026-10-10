/**
 * Geografia stilizzata di Dubai in unità mondo (1 unità ≈ 10 m in verticale).
 * x = est, z = sud (il mare è a nord, cioè z negativa). Le distanze orizzontali
 * sono compresse: è una rappresentazione, non una mappa in scala.
 */
import { seeded } from "@/lib/random";

export type V2 = [number, number];

export const COAST: V2[] = [
  [-1800, 160], [-1100, 60], [-700, -40], [-450, -115], [-200, -225], [0, -300],
  [200, -360], [420, -425], [800, -520], [1600, -700],
];
export const CREEK: V2[] = [[372, -440], [300, -300], [245, -190], [160, -112], [60, -96]];
export const SZR: V2[] = [[-1800, 300], [-1000, 130], [-600, 30], [-300, -25], [0, -48], [200, -112], [420, -250], [900, -470]];
export const AL_KHAIL: V2[] = [[-1800, 470], [-900, 260], [-500, 180], [-150, 110], [150, 40], [450, -110], [900, -330]];

/** z della costa per una data x (interpolazione lineare). */
export function coastZ(x: number) {
  for (let i = 0; i < COAST.length - 1; i++) {
    const [x0, z0] = COAST[i], [x1, z1] = COAST[i + 1];
    if (x >= x0 && x <= x1) return z0 + ((x - x0) / (x1 - x0)) * (z1 - z0);
  }
  return x < COAST[0][0] ? COAST[0][1] : COAST[COAST.length - 1][1];
}

function distToPolyline(x: number, z: number, pts: V2[]) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    d = Math.min(d, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
  }
  return d;
}

/** Burj Lake, ai piedi della torre */
export const LAKE = { x: 28, z: 34, rx: 34, rz: 16 };
const inLake = (x: number, z: number, m: number) => ((x - LAKE.x) / (LAKE.rx + m)) ** 2 + ((z - LAKE.z) / (LAKE.rz + m)) ** 2 < 1;

export const isWater = (x: number, z: number, margin = 0) =>
  z < coastZ(x) + margin || distToPolyline(x, z, CREEK) < 16 + margin || inLake(x, z, margin);

/** Corridoio visivo della camera verso il Burj (niente torri davanti). */
const inCorridor = (x: number, z: number) => distToPolyline(x, z, [[30, 70], [120, 330], [200, 700]]) < 34;
export const nearRoad = (x: number, z: number, w = 9) =>
  distToPolyline(x, z, SZR) < w || distToPolyline(x, z, AL_KHAIL) < w;

/* Palm Jumeirah */
export const PALM = { x: -300, z: -200, trunkEnd: -360, crescentR: 95, crescentZ: -330 };

/* Posizioni 3D delle aree (corrispondono a data/dubaiMarket.ts → areas[].id) */
export const AREA_POS: Record<string, [number, number, number]> = {
  downtown: [0, 95, 0],
  "business-bay": [105, 50, -55],
  marina: [-505, 70, -80],
  palm: [-300, 20, -300],
  jvc: [-420, 25, 90],
  "dubai-hills": [-170, 20, 120],
  "creek-harbour": [335, 45, -255],
};

/* Cantiere off-plan (Creek Harbour) */
export const SITE: V2 = [360, -205];

export type Tower = { x: number; z: number; w: number; d: number; h: number; c: number; round?: boolean };

type District = { x: number; z: number; rx: number; rz: number; n: number; h: [number, number]; fp: [number, number]; tallChance?: number };

const DISTRICTS: District[] = [
  { x: 15, z: -15, rx: 120, rz: 95, n: 110, h: [8, 28], fp: [6, 12], tallChance: 0.08 },
  { x: 110, z: -45, rx: 75, rz: 45, n: 80, h: [10, 30], fp: [6, 10], tallChance: 0.1 },
  { x: -505, z: -70, rx: 95, rz: 35, n: 90, h: [18, 38], fp: [6, 10], tallChance: 0.22 },
  { x: -420, z: 90, rx: 75, rz: 60, n: 90, h: [5, 16], fp: [6, 11] },
  { x: -170, z: 120, rx: 95, rz: 65, n: 110, h: [1.6, 3.2], fp: [3, 5] },
  { x: -150, z: 95, rx: 45, rz: 25, n: 22, h: [10, 24], fp: [6, 9] },
  { x: 340, z: -250, rx: 60, rz: 50, n: 38, h: [10, 28], fp: [7, 11], tallChance: 0.1 },
  { x: -650, z: 70, rx: 120, rz: 70, n: 60, h: [8, 24], fp: [6, 10] },
  { x: 230, z: 60, rx: 120, rz: 70, n: 60, h: [3, 10], fp: [8, 16] },
];

const PALETTE = [0xf2efe9, 0xc9dbe6, 0xf3e6d2, 0xe4e7e6, 0xa9c2d2, 0xfbf5ea, 0xb7d0dc, 0xefd9bd];

export function buildTowers(density: number): Tower[] {
  const r = seeded(42);
  const out: Tower[] = [];
  for (const d of DISTRICTS) {
    const n = Math.round(d.n * density);
    let tries = 0, placed = 0;
    while (placed < n && tries < n * 12) {
      tries++;
      const a = r() * Math.PI * 2, rad = Math.sqrt(r());
      const x = d.x + Math.cos(a) * d.rx * rad, z = d.z + Math.sin(a) * d.rz * rad;
      if (isWater(x, z, 8) || nearRoad(x, z, 8) || Math.hypot(x, z) < 40 || inCorridor(x, z)) continue;
      if (Math.hypot(x - SITE[0], z - SITE[1]) < 34) continue;
      const w = d.fp[0] + r() * (d.fp[1] - d.fp[0]);
      const tall = d.tallChance && r() < d.tallChance;
      const h = tall ? d.h[1] * (1.1 + r() * 0.3) : d.h[0] + Math.pow(r(), 1.6) * (d.h[1] - d.h[0]);
      if (out.some((t) => Math.abs(t.x - x) < (t.w + w) / 2 + 1.5 && Math.abs(t.z - z) < (t.d + w) / 2 + 1.5)) continue;
      out.push({ x, z, w, d: w * (0.7 + r() * 0.6), h, c: PALETTE[Math.floor(r() * PALETTE.length)], round: h > 20 && r() < 0.14 });
      placed++;
    }
  }
  // ville sulla Palm (lungo le fronde)
  const villas = Math.round(90 * density);
  for (let i = 0; i < villas; i++) {
    const f = Math.floor(r() * 16), side = f < 8 ? -1 : 1, k = f % 8;
    const tz = PALM.z + 10 - k * 18;
    const len = 25 + (4 - Math.abs(k - 3.5)) * 9;
    const x = PALM.x + side * (8 + r() * len), z = tz - (r() - 0.5) * 3;
    out.push({ x, z, w: 2.6, d: 2.6, h: 1.4 + r(), c: 0xefe6d8 });
  }
  out.push({ x: PALM.x, z: PALM.crescentZ - PALM.crescentR + 4, w: 22, d: 7, h: 11, c: 0xe9cfae }); // resort sulla mezzaluna
  return out;
}
