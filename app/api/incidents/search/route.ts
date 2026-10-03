import { analyseQuery } from "@/lib/agent";
import { jsonError, serverError } from "@/lib/http";
import { searchSimilarIncidents } from "@/lib/vector-search";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      query?: unknown;
      includeBrief?: unknown;
    } | null;

    if (!body || typeof body.query !== "string" || body.query.trim() === "") {
      return jsonError("query is required.", 400);
    }

    const query = body.query.trim();
    const matches = await searchSimilarIncidents(query, 5);

    if (body.includeBrief) {
      const brief = await analyseQuery(query);
      return Response.json({
        status: "ok",
        query,
        matches,
        brief,
      });
    }

    return Response.json({
      status: "ok",
      query,
      matches,
    });
  } catch (error) {
    return serverError(
      "POST /api/incidents/search",
      error,
      "Failed to search incidents",
    );
  }
}
