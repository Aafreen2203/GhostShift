import { Circle } from "lucide-react";
import type { IncidentAction } from "@/types/action";

export function IncidentTimeline({ actions }: { actions: IncidentAction[] }) {
  const ordered = [...actions].sort((a, b) =>
    (a.timestamp ?? "").localeCompare(b.timestamp ?? ""),
  );

  if (ordered.length === 0) {
    return <p className="text-sm text-gs-muted">No timeline entries.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-gs-border pl-5">
      {ordered.map((action) => (
        <li
          key={action._id ?? `${action.timestamp}-${action.action}`}
          className="relative"
        >
          <span className="absolute -left-[1.55rem] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gs-elevated">
            <Circle
              className={`h-2.5 w-2.5 fill-current ${
                action.outcome === "resolved"
                  ? "text-gs-success"
                  : action.outcome === "temporary"
                    ? "text-gs-warning"
                    : "text-gs-critical"
              }`}
            />
          </span>
          <p className="gs-mono text-[11px] text-gs-cyan">
            {action.timestamp
              ? new Date(action.timestamp).toLocaleTimeString()
              : "Unknown time"}
          </p>
          <p className="mt-1 text-sm font-medium text-white">{action.action}</p>
          <p className="mt-1 text-sm text-gs-muted">{action.result}</p>
        </li>
      ))}
    </ol>
  );
}
