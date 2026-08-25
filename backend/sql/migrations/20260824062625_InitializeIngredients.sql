CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "IngredientTypes" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "IngredientUnitTypes" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Locations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "parentLocation" UUID NULL REFERENCES "Locations"("id"),
    "name" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Ingredients" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "quantity" NUMERIC(15, 3) NOT NULL,
    "unitTypeId" INTEGER NOT NULL REFERENCES "IngredientUnitTypes"("id"),
    "locationId" UUID NOT NULL REFERENCES "Locations"("id"),
    "userId" UUID NOT NULL,
    "expiryDate" TIMESTAMPTZ NULL,
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);
