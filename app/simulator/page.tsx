import { EventSimulator } from "@/components/EventSimulator";

export default function SimulatorPage() {
  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incident Simulator</h1>
        <p className="mt-1 text-sm text-slate-600">
          Insert synthetic monitoring events for the Payment API.
        </p>
      </div>
      <EventSimulator />
    </main>
  );
}
