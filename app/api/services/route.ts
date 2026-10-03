import { COLLECTIONS, getCollection } from "@/lib/mongodb";
import { serverError } from "@/lib/http";
import type { Service } from "@/types/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const collection = await getCollection<Service>(COLLECTIONS.services);
    const services = await collection.find({}).sort({ name: 1 }).toArray();
    return Response.json(services);
  } catch (error) {
    return serverError("GET /api/services", error, "Failed to load services");
  }
}
