"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecordPage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [resolution, setResolution] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [serviceId, setServiceId] = useState("payment-api");
  const [resolvedBy, setResolvedBy] = useState("");
  const [environment, setEnvironment] = useState("");
  const [usefulLink, setUsefulLink] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSavedId(null);

    const enrichedSummary = [
      summary,
      environment ? `Environment: ${environment}` : null,
      resolvedBy ? `Resolved by: ${resolvedBy}` : null,
      usefulLink ? `Link: ${usefulLink}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary: enrichedSummary,
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
      setResolvedBy("");
      setEnvironment("");
      setUsefulLink("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incident");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
          Write memory
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Record an Incident
        </h1>
        <p className="mt-1 text-sm text-gs-muted">
          Save a verified resolution into MongoDB organizational memory.
        </p>
      </div>

      <form
        className="gs-panel space-y-4 p-5"
        onSubmit={(event) => void onSubmit(event)}
      >
        <div className="space-y-1">
          <label htmlFor="service" className="block text-sm font-medium">
            Service
          </label>
          <select
            id="service"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            className="gs-input"
          >
            <option value="payment-api">Payment API</option>
            <option value="auth-service">Authentication Service</option>
            <option value="notification-service">Notification Service</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="problem" className="block text-sm font-medium">
            Problem
          </label>
          <input
            id="problem"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="e.g. Payment API timeout"
            className="gs-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium">
            Problem description
          </label>
          <textarea
            id="description"
            rows={4}
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            required
            placeholder="Describe the problem, error messages, and what happened..."
            className="gs-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="rootCause" className="block text-sm font-medium">
            Historical root cause (optional)
          </label>
          <input
            id="rootCause"
            type="text"
            value={rootCause}
            onChange={(event) => setRootCause(event.target.value)}
            placeholder="e.g. Database connection pool exhaustion"
            className="gs-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="resolvedDate" className="block text-sm font-medium">
              Date resolved
            </label>
            <input id="resolvedDate" type="date" className="gs-input" />
          </div>
          <div className="space-y-1">
            <label htmlFor="resolvedBy" className="block text-sm font-medium">
              Resolved by
            </label>
            <input
              id="resolvedBy"
              type="text"
              value={resolvedBy}
              onChange={(event) => setResolvedBy(event.target.value)}
              placeholder="e.g. Alex"
              className="gs-input"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="environment" className="block text-sm font-medium">
            Environment / Software / Tools
          </label>
          <input
            id="environment"
            type="text"
            value={environment}
            onChange={(event) => setEnvironment(event.target.value)}
            placeholder="e.g. Payment API v2.3.1, MongoDB Atlas, Docker"
            className="gs-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="solution" className="block text-sm font-medium">
            Solution
          </label>
          <textarea
            id="solution"
            rows={5}
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            required
            placeholder="Describe how the problem was resolved..."
            className="gs-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="screenshot" className="block text-sm font-medium">
            Screenshots
          </label>
          <input
            id="screenshot"
            type="file"
            accept="image/*"
            multiple
            className="gs-input"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="link" className="block text-sm font-medium">
            Useful link
          </label>
          <input
            id="link"
            type="url"
            value={usefulLink}
            onChange={(event) => setUsefulLink(event.target.value)}
            placeholder="e.g. GitHub PR, documentation, logs..."
            className="gs-input"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="gs-btn-primary rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Incident"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {savedId ? (
        <p className="text-sm text-emerald-300">
          Saved as{" "}
          <Link href={`/incidents/${savedId}`} className="gs-mono underline">
            {savedId}
          </Link>
          . This record can now be retrieved by Vector Search.
        </p>
      ) : null}
    </main>
  );
}
