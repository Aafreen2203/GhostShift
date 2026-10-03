import Link from "next/link";
import { ArrowDown, Ghost, Search, LayoutDashboard } from "lucide-react";

const flow = [
  "CURRENT INCIDENT",
  "GHOSTSHIFT MEMORY",
  "HISTORICAL MATCH",
  "WHAT FAILED",
  "WHAT WORKED",
  "ENGINEER DECIDES",
] as const;

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 sm:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-800">
            <Ghost className="h-3.5 w-3.5" />
            AI institutional memory
          </div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            <span className="gs-gradient-text">GHOSTSHIFT</span>
          </h1>
          <p className="mt-4 text-xl text-slate-700">
            Institutional memory for engineering teams.
          </p>
          <p className="mt-4 max-w-xl text-base leading-7 text-gs-muted">
            When people leave, their technical knowledge shouldn&apos;t leave with
            them.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Retrieve similar failures, previous troubleshooting attempts, temporary
            fixes, and verified resolutions — powered by MongoDB Vector Search and
            evidence-grounded AI.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="gs-btn-primary inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              Launch Dashboard
            </Link>
            <Link
              href="/search"
              className="gs-btn-ghost inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm"
            >
              <Search className="h-4 w-4" />
              Search Memory
            </Link>
          </div>
        </section>

        <section className="gs-panel gs-panel-ai p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gs-muted">
            Investigation flow
          </p>
          <ol className="mt-4 space-y-2">
            {flow.map((step, index) => (
              <li key={step}>
                <div className="flex items-center gap-3 rounded-lg border border-gs-border bg-slate-50 px-3 py-2.5">
                  <span className="gs-mono text-xs text-gs-cyan">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium tracking-wide text-slate-900">
                    {step}
                  </span>
                </div>
                {index < flow.length - 1 ? (
                  <div className="flex justify-center py-1 text-gs-muted">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
