import { Suspense } from "react";
import { SearchClient } from "./search-client";

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-600">Loading search...</p>}>
      <SearchClient />
    </Suspense>
  );
}
