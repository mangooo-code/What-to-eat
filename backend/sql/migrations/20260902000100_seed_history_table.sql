-- Tracks which one-off seed scripts (backend/sql/seeds/*.sql) have already been applied,
-- since seeds aren't part of the tracked migrations history.
CREATE TABLE IF NOT EXISTS "SeedHistory" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "seedName" TEXT NOT NULL UNIQUE,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
