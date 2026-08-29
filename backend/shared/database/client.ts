import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getDatabaseConfig } from "./config";

let pool: Pool | undefined;

export function getPool(): Pool {
  pool ??= new Pool(getDatabaseConfig());
  return pool;
}

export function query<TRow extends QueryResultRow = QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<QueryResult<TRow>> {
  return getPool().query<TRow>(text, [...values]);
}

export async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
