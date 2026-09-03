-- "Ingredients" rows get DELETEd once fully consumed (see consumeIngredientByName), which
-- would orphan "RecipeIngredients"."ingredientId" if it kept pointing at a live inventory
-- row. This table holds a stable, recipe-owned snapshot instead - mirrors "Ingredients"
-- minus the inventory-specific "locationId"/"source"/"imageFileId"/"normalizedName" fields -
-- so a recipe's ingredient requirements survive independently of the user's actual inventory.
CREATE TABLE IF NOT EXISTS "ReferenceIngredients" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "quantity" NUMERIC(15, 3) NOT NULL CHECK ("quantity" >= 0),
    "unitTypeId" INTEGER NOT NULL REFERENCES "IngredientUnitTypes"("id"),
    "userId" UUID NOT NULL REFERENCES "Users"("id"),
    "expiryDate" TIMESTAMPTZ NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ReferenceIngredients_userId_idx" ON "ReferenceIngredients" ("userId");

-- Repoint RecipeIngredients.ingredientId at the new stable table instead of the volatile
-- Ingredients table, so consuming/deleting an inventory row never orphans a saved recipe's
-- ingredient requirements.
ALTER TABLE "RecipeIngredients"
    DROP CONSTRAINT IF EXISTS "RecipeIngredients_ingredientId_fkey";

ALTER TABLE "RecipeIngredients"
    ADD CONSTRAINT "RecipeIngredients_ingredientId_fkey"
        FOREIGN KEY ("ingredientId") REFERENCES "ReferenceIngredients"("id");
