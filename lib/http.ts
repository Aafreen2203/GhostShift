import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Avoid returning driver errors that may include a connection string. */
export function serverError(scope: string, error: unknown, fallback: string) {
  const safe =
    error instanceof Error && error.message.startsWith("MONGODB_URI")
      ? error.message
      : fallback;
  console.error(`[${scope}] ${safe}`);
  return jsonError(safe, 500);
}

export function notImplemented(message: string) {
  return NextResponse.json({
    status: "not_implemented",
    message,
  });
}
