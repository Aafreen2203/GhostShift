import {
  isAtlasVectorSearch,
  searchEngineLabel,
  type SearchSource,
} from "@/lib/search-labels";

export function SearchEngineBadge({ source }: { source?: SearchSource }) {
  const atlas = isAtlasVectorSearch(source);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${
        atlas
          ? "border-emerald-500/40 bg-emerald-500/10 text-gs-mongo-ink"
          : "border-amber-500/40 bg-amber-500/10 text-amber-900"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          atlas ? "bg-gs-mongo" : "bg-gs-warning"
        }`}
      />
      Search Engine · {searchEngineLabel(source)}
    </span>
  );
}
