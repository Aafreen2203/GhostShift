export default function RecordPage() {
  return (
    <main className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Record an Incident
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Record a resolved incident so other engineers can learn from it.
        </p>
      </div>

      <form className="space-y-4">

        {/* Problem */}
        <div className="space-y-1">
          <label
            htmlFor="problem"
            className="block text-sm font-medium"
          >
            Problem
          </label>

          <input
            id="problem"
            type="text"
            placeholder="e.g. Payment API timeout"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium"
          >
            Problem description
          </label>

          <textarea
            id="description"
            rows={4}
            placeholder="Describe the problem, error messages, and what happened..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Date + Engineer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label
              htmlFor="resolvedDate"
              className="block text-sm font-medium"
            >
              Date resolved
            </label>

            <input
              id="resolvedDate"
              type="date"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="resolvedBy"
              className="block text-sm font-medium"
            >
              Resolved by
            </label>

            <input
              id="resolvedBy"
              type="text"
              placeholder="e.g. Alex"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Environment */}
        <div className="space-y-1">
          <label
            htmlFor="environment"
            className="block text-sm font-medium"
          >
            Environment / Software / Tools
          </label>

          <input
            id="environment"
            type="text"
            placeholder="e.g. Payment API v2.3.1, MongoDB Atlas, Docker"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Solution */}
        <div className="space-y-1">
          <label
            htmlFor="solution"
            className="block text-sm font-medium"
          >
            Solution
          </label>

          <textarea
            id="solution"
            rows={5}
            placeholder="Describe how the problem was resolved..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Screenshot */}
        <div className="space-y-1">
          <label
            htmlFor="screenshot"
            className="block text-sm font-medium"
          >
            Screenshots
          </label>

          <input
            id="screenshot"
            type="file"
            accept="image/*"
            multiple
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Link */}
        <div className="space-y-1">
          <label
            htmlFor="link"
            className="block text-sm font-medium"
          >
            Useful link
          </label>

          <input
            id="link"
            type="url"
            placeholder="e.g. GitHub PR, documentation, logs..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Save Incident
        </button>

      </form>
    </main>
  );
}