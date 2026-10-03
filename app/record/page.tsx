"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecordPage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [resolution, setResolution] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [serviceId, setServiceId] = useState("payment-api");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSavedId(null);

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          resolution,
          rootCause: rootCause || undefined,
          serviceId,
          symptoms: summary ? [summary] : [],
        }),
      });
      const body = (await response.json()) as { _id?: string; error?: string };
      if (!response.ok || !body._id) {
        throw new Error(body.error ?? "Failed to save incident");
      }
      setSavedId(body._id);
      setTitle("");
      setSummary("");
      setResolution("");
      setRootCause("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incident");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record an incident</h1>
        <p className="mt-1 text-sm text-slate-600">
          Save a verified resolution into MongoDB organizational memory for future
          retrieval.
        </p>
      </div>

      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <label className="block text-sm">
          Service
          <select
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            <option value="payment-api">Payment API</option>
            <option value="auth-service">Authentication Service</option>
            <option value="notification-service">Notification Service</option>
          </select>
        </label>

        <label className="block text-sm">
          Problem title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. Payment API timeout under peak traffic"
          />
        </label>

        <label className="block text-sm">
          Problem description
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Describe symptoms and what happened..."
          />
        </label>

        <label className="block text-sm">
          Historical root cause (optional)
          <input
            value={rootCause}
            onChange={(event) => setRootCause(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="e.g. Database connection pool exhaustion"
          />
        </label>

        <label className="block text-sm">
          Verified resolution
          <textarea
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            required
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Describe the fix that permanently resolved the issue..."
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save incident memory"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {savedId ? (
        <p className="text-sm text-emerald-800">
          Saved as{" "}
          <Link href={`/incidents/${savedId}`} className="underline">
            {savedId}
          </Link>
          . This record can now be retrieved by Vector Search.
        </p>
      ) : null}
    </main>
  );
}
