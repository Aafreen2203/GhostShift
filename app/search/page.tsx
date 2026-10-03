"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search memory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Describe a live failure. Similarity search is not wired up yet.
        </p>
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <label htmlFor="issue" className="block text-sm font-medium">
          Describe the current issue...
        </label>
        <textarea
          id="issue"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={4}
          placeholder="Describe the current issue..."
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
          Search GhostShift Memory
        </button>
      </form>
      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
        Vector Search implementation pending.
        {submitted ? " This search was not run." : ""}
      </p>
    </main>
  );
}
