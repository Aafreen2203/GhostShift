import { getDb } from "@/lib/mongodb";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    const message =
      error instanceof Error && error.message.startsWith("MONGODB_URI")
        ? error.message
        : "Database connection failed";
    console.error(`[GET /api/health] ${message}`);
    return jsonError(message, 503);
  }
}
