ALTER TABLE "Locations"
    ADD COLUMN IF NOT EXISTS "key" TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Locations_userId_key_key"
    ON "Locations" ("userId", "key")
    WHERE "key" IS NOT NULL;
