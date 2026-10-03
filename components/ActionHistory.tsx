import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { ActionOutcome, IncidentAction } from "@/types/action";

const outcomeMeta: Record<
  ActionOutcome,
  { label: string; className: string; Icon: typeof XCircle }
> = {
  failed: {
    label: "FAILED",
    className: "border-red-500/40 bg-red-500/10 text-red-300",
    Icon: XCircle,
  },
  temporary: {
    label: "TEMPORARY",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    Icon: Clock3,
  },
  resolved: {
    label: "RESOLVED",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    Icon: CheckCircle2,
  },
};

export function ActionHistory({ actions }: { actions: IncidentAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-gs-muted">
        No historical actions recorded for this incident.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {actions.map((action) => {
        const meta = outcomeMeta[action.outcome];
        const Icon = meta.Icon;
        return (
          <li
            key={action._id ?? `${action.timestamp}-${action.action}`}
            className="gs-panel p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 h-4 w-4 ${
                    action.outcome === "resolved"
                      ? "text-gs-success"
                      : action.outcome === "temporary"
                        ? "text-gs-warning"
                        : "text-gs-critical"
                  }`}
                />
                <div>
                  <h3 className="text-sm font-semibold">{action.action}</h3>
                  {action.timestamp ? (
                    <p className="gs-mono mt-1 text-[11px] text-gs-muted">
                      {new Date(action.timestamp).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
              >
                {meta.label}
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wider text-gs-muted">
              Result
            </p>
            <p className="mt-1 text-sm text-slate-300">{action.result}</p>
          </li>
        );
      })}
    </ul>
  );
}
