/**
 * WORKSTREAM 2 / 3
 * TODO: Render the brief returned by lib/agent.ts.
 * This placeholder must stay empty of generated analysis.
 */
export function AgentBrief({ incidentId }: { incidentId?: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Evidence brief
      </h2>
      <p className="mt-2 text-sm text-slate-700">AI incident analysis is not implemented yet.</p>
      {incidentId ? (
        <p className="mt-1 text-xs text-slate-500">Reserved for incident {incidentId}.</p>
      ) : null}
    </section>
  );
}
