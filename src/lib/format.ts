export const eur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const pct = (n: number, d = 1) =>
  `${n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;

export const num = (n: number, d = 0) =>
  n.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d });
