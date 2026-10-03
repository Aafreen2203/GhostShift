import { MongoClient, type Collection, type Db, type Document } from "mongodb";

/** Database name is part of the shared hackathon contract. */
export const DB_NAME = "ghostshift";

export const COLLECTIONS = {
  services: "services",
  incidents: "incidents",
  events: "events",
  actions: "actions",
} as const;

type MongoCache = {
  clientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as typeof globalThis & {
  _ghostshiftMongo?: MongoCache;
};

function cache(): MongoCache {
  if (!globalForMongo._ghostshiftMongo) {
    globalForMongo._ghostshiftMongo = {};
  }
  return globalForMongo._ghostshiftMongo;
}

export function requireMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === "") {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and set your MongoDB Atlas connection string.",
    );
  }
  return uri;
}

/**
 * Reuses one connection across Next.js hot reloads in development and across
 * requests while the server process stays warm. The seed script opens its own
 * client so it can close the process when it finishes.
 */
export function getMongoClient(): Promise<MongoClient> {
  const cached = cache();
  if (!cached.clientPromise) {
    const client = new MongoClient(requireMongoUri());
    cached.clientPromise = client.connect().catch((error: unknown) => {
      cached.clientPromise = undefined;
      throw error;
    });
  }
  return cached.clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

export async function getCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
