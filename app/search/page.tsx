import { Suspense } from "react";
import { SearchClient } from "./search-client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="gs-panel p-5 text-sm text-gs-muted">
          Loading search interface…
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
