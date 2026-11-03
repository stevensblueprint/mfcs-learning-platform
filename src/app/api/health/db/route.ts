import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Not found" },
      { status: 404 },
    );
  }

  try {
    await getDb().query("SELECT 1 FROM public.users LIMIT 1");

    return Response.json({ database: "ok" });
  } catch (error) {
    console.error("Database health check failed:", error);

    return Response.json(
      { database: "unavailable" },
      { status: 503 },
    );
  }
}