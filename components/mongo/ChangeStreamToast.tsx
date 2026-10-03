"use client";

export function ChangeStreamToast({
  visible,
  message = "MongoDB Change Stream received new event",
}: {
  visible: boolean;
  message?: string;
}) {
  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 gs-new-event rounded-lg border border-emerald-500/40 bg-[#0a1511]/95 px-4 py-3 shadow-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
        Live
      </p>
      <p className="mt-1 text-sm text-emerald-50">{message}</p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-gs-muted">
        <span>events.insertOne()</span>
        <span>→</span>
        <span>Change Stream</span>
        <span>→</span>
        <span>Dashboard</span>
      </div>
    </div>
  );
}
