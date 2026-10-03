type BadgeKind =
  | "vector"
  | "aggregation"
  | "changestream"
  | "document"
  | "freshness";

const labels: Record<BadgeKind, string> = {
  vector: "🍃 Vector Search",
  aggregation: "🍃 Aggregation",
  changestream: "🍃 Change Stream · LIVE",
  document: "🍃 Document Memory",
  freshness: "🍃 Document compare",
};

export function MongoBadge({
  kind,
  className = "",
}: {
  kind: BadgeKind;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-200 ${className}`}
    >
      {labels[kind]}
    </span>
  );
}

export function MongoCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-wider text-emerald-300/80">
      {children}
    </p>
  );
}
