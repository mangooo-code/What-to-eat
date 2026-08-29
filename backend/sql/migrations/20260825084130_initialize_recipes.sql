CREATE TABLE IF NOT EXISTS "Recipes" (
    "id" UUID PRIMARY KEY,
    "time" NUMERIC(10, 2),
    "steps" JSONB NOT NULL,
    "preferences" JSONB NULL
);

CREATE TABLE IF NOT EXISTS "RecipeIngredients" (
    "id" INTEGER PRIMARY KEY,
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id"),
    "ingredientId" UUID NOT NULL REFERENCES "Ingredients"("id"),
    "quantity" NUMERIC(15, 3) NOT NULL
);
