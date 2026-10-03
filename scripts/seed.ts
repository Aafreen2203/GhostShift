import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { COLLECTIONS, DB_NAME, requireMongoUri } from "../lib/mongodb";
import type { IncidentAction } from "../types/action";
import type { Incident } from "../types/incident";
import type { Service } from "../types/service";

function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readJson<T>(relativePath: string): T {
  const path = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const services = readJson<Service[]>("data/seed-services.json");
  const incidents = readJson<Incident[]>("data/seed-incidents.json");
  const actions = readJson<IncidentAction[]>("data/seed-actions.json");

  const client = new MongoClient(requireMongoUri());

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    await db.collection(COLLECTIONS.services).deleteMany({});
    await db.collection(COLLECTIONS.incidents).deleteMany({});
    await db.collection(COLLECTIONS.events).deleteMany({});
    await db.collection(COLLECTIONS.actions).deleteMany({});

    await db.collection<Service>(COLLECTIONS.services).insertMany(services);
    await db.collection<Incident>(COLLECTIONS.incidents).insertMany(incidents);
    await db.collection<IncidentAction>(COLLECTIONS.actions).insertMany(actions);

    console.log("GhostShift seed complete.");
    console.log(`Database: ${DB_NAME}`);
    console.log(`Services: ${services.length}`);
    console.log(`Incidents: ${incidents.length}`);
    console.log(`Actions: ${actions.length}`);
    console.log("Events collection cleared. No seed events were inserted.");
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed.";
  console.error(message);
  process.exit(1);
});
