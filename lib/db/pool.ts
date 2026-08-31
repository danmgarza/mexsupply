import pg from "pg";
import { env } from "@/lib/config";

const { Pool } = pg;
type QueryResultRow = pg.QueryResultRow;

let pool: pg.Pool | null = null;

export function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database operations.");
  }

  pool ??= new Pool({
    connectionString: env.DATABASE_URL
  });

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  const result = await getPool().query<T>(text, params);
  return result;
}
