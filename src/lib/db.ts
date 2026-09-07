import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global { var liderflixPool: Pool | undefined; }

function createPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  return new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
}

function getPool() {
  if (!global.liderflixPool) global.liderflixPool = createPool();
  return global.liderflixPool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
