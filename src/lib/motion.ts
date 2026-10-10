export const easePremium = [0.22, 1, 0.36, 1] as const;
export const easeCinema = [0.65, 0, 0.35, 1] as const;

/** Mappa lineare clampata */
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const range = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
