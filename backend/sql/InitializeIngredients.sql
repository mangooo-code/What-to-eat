CREATE TABLE IF NOT EXISTS "IngredientTypes" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "IngredientUnitTypes" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Locations" (
    "id" INTEGER PRIMARY KEY,
    "parentLocation" INTEGER REFERENCES "Locations"("id"),
    "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Ingredients" (
    "id" INTEGER PRIMARY KEY,
    "name" TEXT NOT NULL,
    "quantity" NUMERIC(15, 3),
    "unitTypeId" INTEGER REFERENCES "IngredientUnitTypes"("id"),
    "locationId" INTEGER NOT NULL REFERENCES "Locations"("id"),
    "expiryDate" TIMESTAMPTZ DEFAULT NOW()
);
