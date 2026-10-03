import { EventSimulator } from "@/components/EventSimulator";

export default function SimulatorPage() {
  return (
    <main className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
          Demo controls
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Incident Simulator
        </h1>
        <p className="mt-1 text-sm text-gs-muted">
          Insert synthetic monitoring events for Payment API and watch MongoDB
          Change Streams respond live.
        </p>
      </div>
      <EventSimulator />
    </main>
  );
}
