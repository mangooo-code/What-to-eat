CREATE TABLE IF NOT EXISTS IngredientTypes (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS IngredientUnitTypes (
    id INT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Locations (
    id INT PRIMARY KEY,
    parentLocation INT NULL REFERENCES Locations(id),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Ingredients (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity NUMERIC(15, 3) NULL,
    unitTypeId INT NULL REFERENCES IngredientUnitTypes(id),
    locationId INT NOT NULL REFERENCES Locations(id),
    expiryDate TIMESTAMPTZ NULL DEFAULT NOW()
);
