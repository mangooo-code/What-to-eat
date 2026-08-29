-- Expand the existing schema for the Phase 1A MVP domain.
-- This migration is intentionally additive: the previously committed migrations
-- remain the source of truth for the original tables.

ALTER TABLE "Users"
    ADD COLUMN IF NOT EXISTS "displayName" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "avatarFileId" TEXT NULL;

CREATE TABLE IF NOT EXISTS "HouseholdMembers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ownerUserId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT FALSE,
    "tastePreference" TEXT NULL,
    "dietPreference" TEXT NULL,
    "dietaryRestrictions" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "allergens" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "HouseholdMembers_ownerUserId_idx"
    ON "HouseholdMembers" ("ownerUserId");

ALTER TABLE "Locations"
    ADD COLUMN IF NOT EXISTS "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS "Locations_userId_idx"
    ON "Locations" ("userId");

ALTER TABLE "Ingredients"
    ADD COLUMN IF NOT EXISTS "normalizedName" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "imageFileId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE "Ingredients"
    ADD CONSTRAINT "Ingredients_quantity_nonnegative_check"
        CHECK ("quantity" >= 0);

CREATE INDEX IF NOT EXISTS "Ingredients_userId_locationId_idx"
    ON "Ingredients" ("userId", "locationId");

CREATE INDEX IF NOT EXISTS "Ingredients_userId_expiryDate_idx"
    ON "Ingredients" ("userId", "expiryDate");

ALTER TABLE "Recipes"
    ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS "description" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "difficulty" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "imageFileId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "tags" JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS "seasonings" JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS "substitutions" JSONB NOT NULL DEFAULT '[]'::JSONB,
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'curated',
    ADD COLUMN IF NOT EXISTS "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now();

-- The original RecipeIngredients row points at an inventory item. The additional
-- snapshot fields let later migrations decouple recipes from a user's inventory
-- without invalidating the existing relationship.
ALTER TABLE "RecipeIngredients"
    ADD COLUMN IF NOT EXISTS "nameSnapshot" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "unitTypeId" INTEGER NULL
        REFERENCES "IngredientUnitTypes"("id"),
    ADD COLUMN IF NOT EXISTS "isOptional" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "RecipeIngredients_recipeId_idx"
    ON "RecipeIngredients" ("recipeId");

CREATE TABLE IF NOT EXISTS "RecipeFavorites" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id") ON DELETE CASCADE,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "RecipeFavorites_userId_recipeId_key" UNIQUE ("userId", "recipeId")
);

CREATE INDEX IF NOT EXISTS "RecipeFavorites_userId_createdDate_idx"
    ON "RecipeFavorites" ("userId", "createdDate" DESC);

CREATE TABLE IF NOT EXISTS "CookingRecords" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id"),
    "status" TEXT NOT NULL DEFAULT 'started'
        CHECK ("status" IN ('started', 'completed', 'cancelled')),
    "memberIds" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "consumedIngredients" JSONB NOT NULL DEFAULT '[]'::JSONB,
    "startedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completedDate" TIMESTAMPTZ NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CookingRecords_userId_createdDate_idx"
    ON "CookingRecords" ("userId", "createdDate" DESC);

CREATE TABLE IF NOT EXISTS "MealFeedback" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "cookingRecordId" UUID NOT NULL
        REFERENCES "CookingRecords"("id") ON DELETE CASCADE,
    "reaction" TEXT NULL,
    "score" SMALLINT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "MealFeedback_cookingRecordId_key" UNIQUE ("cookingRecordId")
);

CREATE INDEX IF NOT EXISTS "MealFeedback_userId_createdDate_idx"
    ON "MealFeedback" ("userId", "createdDate" DESC);
