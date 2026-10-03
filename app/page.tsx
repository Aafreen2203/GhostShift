import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-2xl">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        Engineering memory
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">GhostShift</h1>
      <p className="mt-3 text-lg text-slate-700">
        Institutional memory for engineering teams.
      </p>
      <p className="mt-4 text-slate-700">
        When people leave, their technical knowledge shouldn&apos;t leave with them.
      </p>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        GhostShift keeps a record of system failures, troubleshooting attempts,
        failed fixes, and the resolutions that actually worked. This foundation
        stores that memory in MongoDB. Search, incident analysis, and live
        change streams are left for the team to build.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Open Dashboard
        </Link>
        <Link
          href="/search"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
        >
          Search Memory
        </Link>
        <Link
          href="/simulator"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
        >
          Incident Simulator
        </Link>
      </div>
    </main>
  );
}
