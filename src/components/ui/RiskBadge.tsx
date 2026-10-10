const levels = { Basso: 1, Medio: 2, Alto: 3 } as const;

export function RiskBadge({ level }: { level: keyof typeof levels }) {
  const n = levels[level];
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em]">
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2.5 w-1 rounded-full ${i <= n ? "bg-bronze" : "bg-ink/15"}`} />
        ))}
      </span>
      Rischio {level.toLowerCase()}
    </span>
  );
}
