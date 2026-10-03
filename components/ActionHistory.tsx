import type { ActionOutcome, IncidentAction } from "@/types/action";

const outcomeStyles: Record<ActionOutcome, string> = {
  failed: "bg-red-100 text-red-800",
  temporary: "bg-amber-100 text-amber-900",
  resolved: "bg-emerald-100 text-emerald-800",
};

export function ActionHistory({ actions }: { actions: IncidentAction[] }) {
  if (actions.length === 0) {
    return <p className="text-sm text-slate-600">No actions recorded.</p>;
  }

  return (
    <ul className="space-y-3">
      {actions.map((action) => (
        <li
          key={action._id ?? `${action.timestamp}-${action.action}`}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{action.action}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${outcomeStyles[action.outcome]}`}
            >
              {action.outcome}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{action.result}</p>
        </li>
      ))}
    </ul>
  );
}
