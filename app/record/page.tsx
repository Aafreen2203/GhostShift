export default function RecordPage() {
  return (
    <main>
      <h1>Record an Incident</h1>

      <p>
        Record a resolved incident so other engineers can learn from it.
      </p>

      <form className="form-stack">
        <label>
          Problem
          <input
            type="text"
            name="problem"
            placeholder="e.g. Payment API timeout"
          />
        </label>

        <label>
          Problem description
          <textarea
            name="description"
            placeholder="Describe the problem, error messages, and what happened..."
            rows={5}
          />
        </label>

        <div className="form-row">
          <label>
            Date resolved
            <input
              type="date"
              name="resolvedDate"
            />
          </label>

          <label>
            Resolved by
            <input
              type="text"
              name="resolvedBy"
              placeholder="e.g. Alex"
            />
          </label>
        </div>

        <label>
          Environment / Software / Tools
          <input
            type="text"
            name="environment"
            placeholder="e.g. Payment API v2.3.1, MongoDB Atlas, Docker"
          />
        </label>

        <label>
          Solution
          <textarea
            name="solution"
            placeholder="Describe how the problem was resolved..."
            rows={5}
          />
        </label>

        <label>
          Screenshots
          <input
            type="file"
            name="screenshots"
            accept="image/*"
            multiple
          />
        </label>

        <label>
          Useful link
          <input
            type="url"
            name="link"
            placeholder="e.g. GitHub PR, documentation, logs..."
          />
        </label>

        <button type="submit">
          Save Incident
        </button>
      </form>
    </main>
  );
}