import { watchEvents, type StreamMessage } from "@/lib/change-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-Sent Events feed backed by a MongoDB Change Stream on `events`.
 */
export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let closeStream: (() => Promise<void>) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (message: StreamMessage) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
        );
      };

      void watchEvents(send)
        .then((handle) => {
          closeStream = handle.close;
        })
        .catch((error: unknown) => {
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to open Change Stream",
          });
          controller.close();
        });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 15000);

      const abort = () => {
        clearInterval(heartbeat);
        void closeStream?.();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener("abort", abort);
    },
    cancel() {
      void closeStream?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
