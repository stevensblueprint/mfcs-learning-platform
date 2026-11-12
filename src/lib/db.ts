import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  mfcsPool?: Pool;
};

export function getDb(): Pool {
  if (!globalForDb.mfcsPool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    const pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    pool.on("error", (error: Error) => {
      console.error("Unexpected idle database connection error:", error);
    });

    globalForDb.mfcsPool = pool;
  }

  return globalForDb.mfcsPool;
}
