import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  for (const name of (await readdir(path.join(process.cwd(), "migrations"))).filter((file) => file.endsWith(".sql")).sort()) {
    const exists = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (exists.rowCount) continue;
    const sql = await readFile(path.join(process.cwd(), "migrations", name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [name]);
      await client.query("COMMIT");
      console.log(`Migration aplicada: ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
  await pool.end();
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
