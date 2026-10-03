type ConfidenceBadgeProps = {
  value: number;
  /** Overall brief vs a single suggestion */
  label?: string;
  size?: "sm" | "md";
};

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value > 1 && value <= 100 ? value : value * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function tone(pct: number): {
  bar: string;
  chip: string;
  word: string;
} {
  if (pct >= 75) {
    return {
      bar: "bg-gs-success",
      chip: "border-emerald-500/35 bg-emerald-500/10 text-emerald-800",
      word: "High",
    };
  }
  if (pct >= 45) {
    return {
      bar: "bg-gs-warning",
      chip: "border-amber-500/35 bg-amber-500/10 text-amber-900",
      word: "Medium",
    };
  }
  return {
    bar: "bg-gs-critical",
    chip: "border-red-500/35 bg-red-500/10 text-red-700",
    word: "Low",
  };
}

export function ConfidenceBadge({
  value,
  label = "Confidence",
  size = "sm",
}: ConfidenceBadgeProps) {
  const pct = clampPct(value);
  const styles = tone(pct);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${styles.chip} ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"
      }`}
      title={`${label}: ${pct}% (${styles.word}) — evidence-grounded, not certainty`}
    >
      <span className="uppercase tracking-wider opacity-80">{label}</span>
      <span className="gs-mono">{pct}%</span>
      <span className="hidden h-1 w-8 overflow-hidden rounded-full bg-black/10 sm:inline-block">
        <span
          className={`block h-full rounded-full ${styles.bar}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}

export function ConfidenceMeter({
  value,
  caption,
}: {
  value: number;
  caption?: string;
}) {
  const pct = clampPct(value);
  const styles = tone(pct);

  return (
    <div className="rounded-lg border border-gs-border bg-slate-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          Suggestion confidence
        </p>
        <ConfidenceBadge value={value} size="md" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${styles.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-600">
        {caption ??
          `${styles.word} confidence from MongoDB evidence strength — not a confirmed root cause.`}
      </p>
    </div>
  );
}
