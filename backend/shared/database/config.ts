import type { PoolConfig } from "pg";

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getDatabaseConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  if (env.DATABASE_URL) {
    return {
      connectionString: env.DATABASE_URL,
      max: numberFromEnv(env.PGPOOL_MAX, 5),
      idleTimeoutMillis: numberFromEnv(env.PG_IDLE_TIMEOUT_MS, 30_000),
      connectionTimeoutMillis: numberFromEnv(env.PG_CONNECT_TIMEOUT_MS, 5_000),
      ssl: env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: env.PGSSL_REJECT_UNAUTHORIZED !== "false" },
    };
  }

  const required = ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"] as const;
  const missing = required.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Database configuration is incomplete: ${missing.join(", ")}`);
  }

  return {
    host: env.PGHOST,
    port: numberFromEnv(env.PGPORT, 5432),
    database: env.PGDATABASE,
    user: env.PGUSER,
    password: env.PGPASSWORD,
    max: numberFromEnv(env.PGPOOL_MAX, 5),
    idleTimeoutMillis: numberFromEnv(env.PG_IDLE_TIMEOUT_MS, 30_000),
    connectionTimeoutMillis: numberFromEnv(env.PG_CONNECT_TIMEOUT_MS, 5_000),
    ssl: env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: env.PGSSL_REJECT_UNAUTHORIZED !== "false" },
  };
}
