-- Idempotent Phase 1B development inventory for DEV_USER_ID.
-- Replace the owner UUID only when the centralized development identity changes.

INSERT INTO "Users" ("id", "firstName", "lastName", "phoneNumber", "displayName")
VALUES (
  'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, '开发', '用户',
  'dev-c0ef3510-03b3-4024-a1e3-d85e53f2eb81', '开饭猫开发用户'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Locations" ("userId", "key", "name")
SELECT * FROM (VALUES
  ('c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, 'fridge', '冷藏'),
  ('c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, 'freezer', '冷冻'),
  ('c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, 'pantry', '常温')
) AS seed("userId", "key", "name")
ON CONFLICT ("userId", "key") WHERE "key" IS NOT NULL
DO UPDATE SET "name" = EXCLUDED."name", "updatedDate" = now();

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('个')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('盒')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "IngredientUnitTypes" ("id", "name")
SELECT COALESCE(MAX("id"), 0) + 1, unit."name"
  FROM "IngredientUnitTypes", (VALUES ('g')) AS unit("name")
 WHERE NOT EXISTS (SELECT 1 FROM "IngredientUnitTypes" WHERE "name" = unit."name")
 GROUP BY unit."name";

INSERT INTO "Ingredients" (
  "userId", "name", "normalizedName", "quantity", "unitTypeId",
  "locationId", "expiryDate", "source"
)
SELECT
  'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, seed."name", seed."normalizedName", seed."quantity",
  units."id", locations."id", now() + (seed."days" * interval '1 day'), 'manual'
  FROM (VALUES
    ('番茄', '番茄', 2::numeric, '个', 'fridge', 3),
    ('鸡蛋', '鸡蛋', 6::numeric, '个', 'fridge', 10),
    ('嫩豆腐', '豆腐', 1::numeric, '盒', 'fridge', 2),
    ('青椒', '青椒', 3::numeric, '个', 'fridge', 4),
    ('猪里脊', '猪里脊', 300::numeric, 'g', 'freezer', 15),
    ('牛奶', '牛奶', 1::numeric, '盒', 'fridge', 2)
  ) AS seed("name", "normalizedName", "quantity", "unit", "locationKey", "days")
  JOIN "Locations" locations
    ON locations."userId" = 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid
   AND locations."key" = seed."locationKey"
  JOIN LATERAL (
    SELECT MIN("id") AS "id" FROM "IngredientUnitTypes" WHERE "name" = seed."unit"
  ) units ON TRUE
 WHERE NOT EXISTS (
   SELECT 1 FROM "Ingredients" existing
    WHERE existing."userId" = 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid
      AND existing."name" = seed."name"
      AND existing."locationId" = locations."id"
 );
