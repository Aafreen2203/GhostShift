"use client";

type MongoActivityStripProps = {
  mongoOk: boolean | null;
  historicalCount: number;
  changeStreamLive?: boolean;
};

export function MongoActivityStrip({
  mongoOk,
  historicalCount,
  changeStreamLive = true,
}: MongoActivityStripProps) {
  const connected = mongoOk !== false;

  return (
    <div className="border-b border-gs-border bg-white/80 px-4 py-2 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-gs-mongo-ink">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? "bg-gs-mongo gs-pulse" : "bg-gs-critical"
            }`}
          />
          MongoDB Atlas {connected ? "Connected" : "Offline"}
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <span className="h-1.5 w-1.5 rounded-full bg-gs-mongo" />
          Vector Search Ready
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span className="inline-flex items-center gap-1.5 text-slate-700">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              changeStreamLive ? "bg-gs-mongo gs-pulse" : "bg-slate-300"
            }`}
          />
          Change Stream Listening
        </span>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <span className="gs-mono text-slate-700">
          {historicalCount} Historical Incidents
        </span>
      </div>
    </div>
  );
}
