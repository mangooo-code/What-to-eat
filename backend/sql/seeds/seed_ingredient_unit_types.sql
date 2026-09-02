-- Idempotent seed for the remaining IngredientUnitTypes referenced by the frontend's
-- (now-removed) hardcoded unit list in frontend/app/lib/data.ts. 个/盒/g are assumed
-- already present; this only adds the rest.
INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('颗')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('根')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('块')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('袋')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('瓶')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('kg')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('ml')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('L')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "SeedHistory" ("seedName") VALUES ('seed_ingredient_unit_types')
ON CONFLICT ("seedName") DO NOTHING;
