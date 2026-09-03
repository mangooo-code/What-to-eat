-- Moves seasonings out of the "Recipes"."seasonings" JSONB string-array column into a
-- proper table, so a per-seasoning free-text amount ("适量"/"少许") can be recorded too.
CREATE TABLE IF NOT EXISTS "RecipeSeasonings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    -- Free-text amount ("适量"/"少许"/"2 勺"); it's a feeling, not a number, so no NUMERIC/unitTypeId.
    "quantity" TEXT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "RecipeSeasonings_recipeId_idx" ON "RecipeSeasonings" ("recipeId");

-- Migrate any existing plain-string seasonings into the new table before dropping the column.
INSERT INTO "RecipeSeasonings" ("recipeId", "name")
SELECT "id", "seasoning"
  FROM "Recipes", jsonb_array_elements_text("seasonings") AS "seasoning"
 WHERE jsonb_array_length("seasonings") > 0;

ALTER TABLE "Recipes"
    DROP COLUMN IF EXISTS "seasonings";
