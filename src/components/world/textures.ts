import * as THREE from "three";
import { AL_KHAIL, COAST, CREEK, LAKE, PALM, SZR, type V2 } from "./geo";
import { seeded } from "@/lib/random";

export const LAND = { x0: -1600, x1: 1200, z0: -1400, z1: 1000 };

/** Genera le texture del suolo (giorno + luci notturne) disegnando la città su canvas. */
export function makeLandTextures(size: number) {
  const W = size, H = Math.round((size * (LAND.z1 - LAND.z0)) / (LAND.x1 - LAND.x0));
  const sx = W / (LAND.x1 - LAND.x0);
  const px = (x: number) => (x - LAND.x0) * sx;
  const pz = (z: number) => (z - LAND.z0) * sx;
  const path = (ctx: CanvasRenderingContext2D, pts: V2[]) => {
    ctx.beginPath();
    pts.forEach(([x, z], i) => (i ? ctx.lineTo(px(x), pz(z)) : ctx.moveTo(px(x), pz(z))));
  };
  const r = seeded(7);

  const day = document.createElement("canvas");
  day.width = W; day.height = H;
  const c = day.getContext("2d")!;
  c.fillStyle = "#e6cfa6";
  c.fillRect(0, 0, W, H);
  // grana del deserto
  for (let i = 0; i < (W * H) / 360; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(255,240,215,0.10)" : "rgba(150,120,85,0.08)";
    c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  // tessuto urbano
  const urban: [number, number, number][] = [[10, -20, 180], [110, -45, 110], [-505, -60, 140], [-420, 90, 120], [-170, 115, 130], [340, -250, 100], [-650, 70, 160], [230, 60, 160], [-250, 20, 140]];
  for (const [x, z, rad] of urban) {
    const g = c.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), rad * sx);
    g.addColorStop(0, "rgba(196,184,166,0.9)");
    g.addColorStop(1, "rgba(196,184,166,0)");
    c.fillStyle = g;
    c.fillRect(px(x - rad), pz(z - rad), rad * 2 * sx, rad * 2 * sx);
    // isolati
    c.strokeStyle = "rgba(225,215,200,0.55)";
    c.lineWidth = Math.max(1, 1.6 * sx);
    for (let k = -rad; k < rad; k += 14) {
      c.beginPath(); c.moveTo(px(x + k), pz(z - rad * 0.7)); c.lineTo(px(x + k), pz(z + rad * 0.7)); c.stroke();
      c.beginPath(); c.moveTo(px(x - rad * 0.7), pz(z + k)); c.lineTo(px(x + rad * 0.7), pz(z + k)); c.stroke();
    }
  }
  // verde (Dubai Hills, parchi)
  c.fillStyle = "rgba(122,150,96,0.75)";
  c.beginPath(); c.ellipse(px(-175), pz(140), 55 * sx, 22 * sx, -0.3, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(px(-130), pz(80), 18 * sx, 10 * sx, 0, 0, Math.PI * 2); c.fill();
  // spiaggia lungo la costa
  c.strokeStyle = "#f1e1c0"; c.lineWidth = 16 * sx; c.lineCap = "round"; c.lineJoin = "round";
  path(c, COAST); c.stroke();
  // strade principali
  c.strokeStyle = "#75736f"; c.lineWidth = 9 * sx; path(c, SZR); c.stroke();
  c.strokeStyle = "#e9e4da"; c.lineWidth = 0.8 * sx; c.setLineDash([3 * sx, 3 * sx]); path(c, SZR); c.stroke(); c.setLineDash([]);
  c.strokeStyle = "#86837d"; c.lineWidth = 7 * sx; path(c, AL_KHAIL); c.stroke();
  // mare e Creek: trasparenti (sotto c'è l'acqua)
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  c.moveTo(px(LAND.x0), pz(LAND.z0));
  c.lineTo(px(LAND.x0), pz(COAST[0][1]));
  COAST.forEach(([x, z]) => c.lineTo(px(x), pz(z)));
  c.lineTo(px(LAND.x1), pz(LAND.z0));
  c.closePath(); c.fill();
  c.lineWidth = 30 * sx; path(c, CREEK); c.stroke();
  c.beginPath(); c.ellipse(px(LAKE.x), pz(LAKE.z), LAKE.rx * sx, LAKE.rz * sx, 0, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = "source-over";
  // Palm Jumeirah (terra emersa nel mare)
  c.strokeStyle = "#ead8b3"; c.lineCap = "round";
  c.lineWidth = 16 * sx;
  c.beginPath(); c.moveTo(px(PALM.x), pz(PALM.z + 20)); c.lineTo(px(PALM.x), pz(PALM.trunkEnd)); c.stroke();
  c.lineWidth = 6 * sx;
  for (let k = 0; k < 8; k++) {
    const tz = PALM.z + 10 - k * 18, len = 25 + (4 - Math.abs(k - 3.5)) * 9;
    c.beginPath(); c.moveTo(px(PALM.x - len - 8), pz(tz)); c.lineTo(px(PALM.x + len + 8), pz(tz)); c.stroke();
  }
  c.lineWidth = 9 * sx;
  c.beginPath(); c.arc(px(PALM.x), pz(PALM.crescentZ), PALM.crescentR * sx, Math.PI * 1.08, Math.PI * 1.92); c.stroke();

  // luci notturne
  const night = document.createElement("canvas");
  night.width = W; night.height = H;
  const n = night.getContext("2d")!;
  n.fillStyle = "#000"; n.fillRect(0, 0, W, H);
  n.lineCap = "round"; n.lineJoin = "round";
  n.strokeStyle = "rgba(255,170,90,0.95)"; n.lineWidth = 5 * sx; path(n, SZR); n.stroke();
  n.strokeStyle = "rgba(255,170,90,0.7)"; n.lineWidth = 4 * sx; path(n, AL_KHAIL); n.stroke();
  for (const [x, z, rad] of urban) {
    for (let k = 0; k < rad * 3.2; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      n.fillStyle = r() > 0.3 ? "rgba(255,205,140,0.85)" : "rgba(210,230,255,0.7)";
      const s = (0.8 + r() * 1.6) * sx;
      n.fillRect(px(x + Math.cos(a) * d), pz(z + Math.sin(a) * d * 0.8), s, s);
    }
  }
  n.strokeStyle = "rgba(255,200,130,0.6)"; n.lineWidth = 2 * sx;
  n.beginPath(); n.moveTo(px(PALM.x), pz(PALM.z + 20)); n.lineTo(px(PALM.x), pz(PALM.trunkEnd)); n.stroke();
  n.beginPath(); n.arc(px(PALM.x), pz(PALM.crescentZ), PALM.crescentR * sx, Math.PI * 1.08, Math.PI * 1.92); n.stroke();

  const mk = (cv: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(cv);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.generateMipmaps = true;
    return t;
  };
  return { day: mk(day, true), night: mk(night, true) };
}

/** Normal map dell'acqua (onde morbide), ripetibile. */
export function makeWaterNormal(size = 256) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const h = (x: number, y: number) => {
    const u = (x / size) * Math.PI * 2, v = (y / size) * Math.PI * 2;
    return Math.sin(u * 3 + v * 2) * 0.5 + Math.sin(u * 7 - v * 5) * 0.25 + Math.sin(u * 13 + v * 11) * 0.12 + Math.sin(v * 9 - u * 2) * 0.2;
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y), dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx * 2, ny = -dy * 2, nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / l) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / l) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / l) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(220, 220);
  return t;
}
