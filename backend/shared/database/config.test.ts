import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseConfig } from "./config";

test("builds a connectionString config from DATABASE_URL with defaults", () => {
  const config = getDatabaseConfig({ DATABASE_URL: "postgres://example" } as NodeJS.ProcessEnv);
  assert.equal(config.connectionString, "postgres://example");
  assert.equal(config.max, 5);
  assert.equal(config.idleTimeoutMillis, 30_000);
  assert.equal(config.connectionTimeoutMillis, 5_000);
  assert.deepEqual(config.ssl, { rejectUnauthorized: true });
});

test("DATABASE_URL config respects PGSSLMODE=disable and numeric overrides", () => {
  const config = getDatabaseConfig({
    DATABASE_URL: "postgres://example",
    PGSSLMODE: "disable",
    PGPOOL_MAX: "10",
    PG_IDLE_TIMEOUT_MS: "1000",
    PG_CONNECT_TIMEOUT_MS: "2000",
  } as NodeJS.ProcessEnv);
  assert.equal(config.ssl, false);
  assert.equal(config.max, 10);
  assert.equal(config.idleTimeoutMillis, 1000);
  assert.equal(config.connectionTimeoutMillis, 2000);
});

test("builds a discrete config from PG* variables when DATABASE_URL is absent", () => {
  const config = getDatabaseConfig({
    PGHOST: "localhost",
    PGDATABASE: "db",
    PGUSER: "user",
    PGPASSWORD: "pass",
  } as NodeJS.ProcessEnv);
  assert.equal(config.host, "localhost");
  assert.equal(config.port, 5432);
  assert.equal(config.database, "db");
  assert.equal(config.user, "user");
  assert.equal(config.password, "pass");
});

test("throws when required PG* variables are missing", () => {
  assert.throws(() => getDatabaseConfig({} as NodeJS.ProcessEnv), /Database configuration is incomplete/);
});
