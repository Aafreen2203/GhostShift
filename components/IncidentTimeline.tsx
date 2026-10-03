import type { IncidentAction } from "@/types/action";

export function IncidentTimeline({ actions }: { actions: IncidentAction[] }) {
  const ordered = [...actions].sort((a, b) =>
    (a.timestamp ?? "").localeCompare(b.timestamp ?? ""),
  );

  if (ordered.length === 0) {
    return <p className="text-sm text-slate-600">No timeline entries.</p>;
  }

  return (
    <ol className="space-y-4 border-l border-slate-300 pl-4">
      {ordered.map((action) => (
        <li key={action._id ?? `${action.timestamp}-${action.action}`} className="relative">
          <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-500" />
          <p className="text-xs text-slate-500">
            {action.timestamp ? new Date(action.timestamp).toLocaleString() : "Unknown time"}
          </p>
          <p className="text-sm font-medium">{action.action}</p>
          <p className="text-sm text-slate-600">{action.result}</p>
        </li>
      ))}
    </ol>
  );
}
