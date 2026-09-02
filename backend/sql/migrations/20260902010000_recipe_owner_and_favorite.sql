-- Recipes become user-owned, and "favoriting" moves from a separate join table
-- onto the recipe row itself (this app only ever had one real owner anyway).
ALTER TABLE "Recipes"
    ADD COLUMN IF NOT EXISTS "userId" UUID REFERENCES "Users"("id") ON DELETE CASCADE;

-- Backfill any pre-existing rows (seeded/curated recipes) to the dev owner before
-- enforcing NOT NULL below.
UPDATE "Recipes" SET "userId" = 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid
 WHERE "userId" IS NULL;

ALTER TABLE "Recipes"
    ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Recipes"
    ADD COLUMN IF NOT EXISTS "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "Recipes_userId_idx" ON "Recipes" ("userId");
CREATE INDEX IF NOT EXISTS "Recipes_userId_isFavorite_idx" ON "Recipes" ("userId", "isFavorite");

DROP TABLE IF EXISTS "RecipeFavorites";
