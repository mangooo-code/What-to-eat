-- Moves cooking steps out of the ad-hoc "Recipes"."steps" JSONB column into a proper table.
ALTER TABLE "Recipes"
    DROP COLUMN IF EXISTS "steps";

CREATE TABLE IF NOT EXISTS "RecipeSteps" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id") ON DELETE CASCADE,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "detailedInstructions" TEXT NOT NULL,
    "time" NUMERIC(10, 2) NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "RecipeSteps_recipeId_stepNumber_key" UNIQUE ("recipeId", "stepNumber")
);

CREATE INDEX IF NOT EXISTS "RecipeSteps_recipeId_idx" ON "RecipeSteps" ("recipeId");
