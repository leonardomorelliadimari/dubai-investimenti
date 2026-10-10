/**
 * Collegamento tra le sezioni HTML ("capitoli") e la scena 3D.
 * Le sezioni si registrano; la scena legge posizione e progresso a ogni frame
 * senza passare da React (nessun re-render durante lo scroll).
 */
export type ChapterId = "intro" | "rise" | "map" | "build" | "night";

type Entry = { el: HTMLElement; top: number; height: number };
const chapters = new Map<ChapterId, Entry>();

export function registerChapter(id: ChapterId, el: HTMLElement | null) {
  if (el) chapters.set(id, { el, top: 0, height: 0 });
  else chapters.delete(id);
  measureChapters();
}

export function measureChapters() {
  if (typeof window === "undefined") return;
  const y = window.scrollY;
  chapters.forEach((c) => {
    const r = c.el.getBoundingClientRect();
    c.top = r.top + y;
    c.height = c.el.offsetHeight;
  });
}

export type ChapterState = { id: ChapterId; p: number; cover: number };

/** Capitolo che occupa più schermo + progresso 0–1 al suo interno. */
export function currentChapter(): ChapterState | null {
  const y = window.scrollY, vh = window.innerHeight;
  let best: ChapterState | null = null;
  chapters.forEach((c, id) => {
    const cover = Math.max(0, Math.min(y + vh, c.top + c.height) - Math.max(y, c.top)) / vh;
    if (cover <= 0) return;
    const p = Math.min(1, Math.max(0, (y - c.top) / Math.max(1, c.height - vh)));
    if (!best || cover > best.cover) best = { id, p, cover };
  });
  return best;
}

/** Area attiva della mappa (su mobile la camera la segue). */
export const mapFocus = { id: "downtown" };

/** Pin HTML della mappa, posizionati dalla scena proiettando punti 3D. */
export const pinEls = new Map<string, HTMLElement>();

/** Stato condiviso minimo. */
export const worldInfo = { ready: false, listeners: new Set<() => void>() };
export function setWorldReady() {
  worldInfo.ready = true;
  worldInfo.listeners.forEach((l) => l());
}
