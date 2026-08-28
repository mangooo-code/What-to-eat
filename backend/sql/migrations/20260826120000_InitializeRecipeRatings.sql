ALTER TABLE "Recipes"
    ADD COLUMN IF NOT EXISTS "rating" NUMERIC(3, 2) NULL,
    ADD COLUMN IF NOT EXISTS "ratingCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "RecipeRatings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "recipeId" UUID NOT NULL REFERENCES "Recipes"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "score" SMALLINT NOT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "RecipeRatings_recipeId_userId_key" UNIQUE ("recipeId", "userId")
);

CREATE INDEX IF NOT EXISTS "RecipeRatings_recipeId_idx" ON "RecipeRatings" ("recipeId");

CREATE OR REPLACE FUNCTION "refreshRecipeRating"("targetRecipeId" UUID)
RETURNS VOID AS $$
    UPDATE "Recipes"
    SET "rating" = "aggregate"."average",
        "ratingCount" = "aggregate"."total"
    FROM (
        SELECT ROUND(AVG("score")::NUMERIC, 2) AS "average",
               COUNT(*) AS "total"
        FROM "RecipeRatings"
        WHERE "recipeId" = "targetRecipeId"
    ) AS "aggregate"
    WHERE "Recipes"."id" = "targetRecipeId";
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION "onRecipeRatingChanged"()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP <> 'INSERT' THEN
        PERFORM "refreshRecipeRating"(OLD."recipeId");
    END IF;

    IF TG_OP <> 'DELETE' THEN
        PERFORM "refreshRecipeRating"(NEW."recipeId");
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "RecipeRatings_refreshRating" ON "RecipeRatings";

CREATE TRIGGER "RecipeRatings_refreshRating"
    AFTER INSERT OR UPDATE OF "score", "recipeId" OR DELETE ON "RecipeRatings"
    FOR EACH ROW
    EXECUTE FUNCTION "onRecipeRatingChanged"();
