import type { ChangeStream, ChangeStreamInsertDocument } from "mongodb";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import type { SystemEvent } from "@/types/event";
import type { Incident } from "@/types/incident";

export type StreamMessage =
  | {
      type: "ready";
      message: string;
    }
  | {
      type: "event";
      event: SystemEvent;
      openedIncidentId: string | null;
      reason: string;
    }
  | {
      type: "error";
      message: string;
    };

type StreamHandler = (message: StreamMessage) => void;

/**
 * Open a Change Stream on the events collection.
 * Incident opening is handled by POST /api/events; this stream reports live inserts.
 * Caller owns cleanup via the returned close function.
 */
export async function watchEvents(
  onMessage: StreamHandler,
): Promise<{ close: () => Promise<void> }> {
  const collection = await getCollection<SystemEvent>(COLLECTIONS.events);
  const stream: ChangeStream<SystemEvent> = collection.watch(
    [{ $match: { operationType: "insert" } }],
    { fullDocument: "updateLookup" },
  );

  onMessage({
    type: "ready",
    message: "Listening for new events via MongoDB Change Streams.",
  });

  stream.on(
    "change",
    (change: ChangeStreamInsertDocument<SystemEvent>) => {
      void (async () => {
        const event = change.fullDocument;
        if (!event) return;

        try {
          const incidents = await getCollection<Incident>(COLLECTIONS.incidents);
          const active = await incidents.findOne({
            serviceId: event.serviceId,
            status: "active",
          });
          onMessage({
            type: "event",
            event,
            openedIncidentId: active?._id ?? null,
            reason: active
              ? `Active incident in view: ${active._id}`
              : "Event inserted into MongoDB.",
          });
        } catch (error) {
          onMessage({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to process streamed event",
          });
        }
      })();
    },
  );

  stream.on("error", (error: Error) => {
    onMessage({
      type: "error",
      message: error.message,
    });
  });

  return {
    close: async () => {
      await stream.close();
    },
  };
}
