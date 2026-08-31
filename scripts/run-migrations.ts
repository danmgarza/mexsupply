import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getPool } from "@/lib/db/pool";
import { logger } from "@/lib/logger";

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

async function main() {
  const pool = getPool();
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  await pool.query(`
    create table if not exists public.schema_migrations_local (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const file of files) {
    const applied = await pool.query("select 1 from public.schema_migrations_local where filename = $1", [file]);
    if (applied.rowCount) {
      logger.info({ file }, "migration already applied");
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await pool.query("begin");
    try {
      await pool.query(sql);
      await pool.query("insert into public.schema_migrations_local (filename) values ($1)", [file]);
      await pool.query("commit");
      logger.info({ file }, "migration applied");
    } catch (error) {
      await pool.query("rollback");
      throw error;
    }
  }

  await pool.end();
}

main().catch((error) => {
  logger.error({ error }, "migration failed");
  process.exitCode = 1;
});
