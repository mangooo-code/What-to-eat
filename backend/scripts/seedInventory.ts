import { getDevelopmentUserId } from "../shared/auth/development";
import { closePool, query, withTransaction } from "../shared/database/client";

const locations = [
  { key: "fridge", name: "冷藏" },
  { key: "freezer", name: "冷冻" },
  { key: "pantry", name: "常温" },
] as const;

const ingredients = [
  { name: "番茄", normalizedName: "番茄", quantity: 2, unit: "个", locationKey: "fridge", days: 3 },
  { name: "鸡蛋", normalizedName: "鸡蛋", quantity: 6, unit: "个", locationKey: "fridge", days: 10 },
  { name: "嫩豆腐", normalizedName: "豆腐", quantity: 1, unit: "盒", locationKey: "fridge", days: 2 },
  { name: "青椒", normalizedName: "青椒", quantity: 3, unit: "个", locationKey: "fridge", days: 4 },
  { name: "猪里脊", normalizedName: "猪里脊", quantity: 300, unit: "g", locationKey: "freezer", days: 15 },
  { name: "牛奶", normalizedName: "牛奶", quantity: 1, unit: "盒", locationKey: "fridge", days: 2 },
] as const;

async function seed(): Promise<void> {
  const userId = getDevelopmentUserId();
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO "Users" ("id", "firstName", "lastName", "phoneNumber", "displayName")
       VALUES ($1, '开发', '用户', $2, '开饭猫开发用户')
       ON CONFLICT ("id") DO NOTHING`,
      [userId, `dev-${userId}`],
    );

    for (const location of locations) {
      await client.query(
        `INSERT INTO "Locations" ("userId", "key", "name")
         VALUES ($1, $2, $3)
         ON CONFLICT ("userId", "key") WHERE "key" IS NOT NULL
         DO UPDATE SET "name" = EXCLUDED."name", "updatedDate" = now()`,
        [userId, location.key, location.name],
      );
    }

    for (const ingredient of ingredients) {
      await client.query(
        `INSERT INTO "IngredientUnitTypes" ("id", "name")
         SELECT COALESCE(MAX("id"), 0) + 1, $1
           FROM "IngredientUnitTypes"
          WHERE NOT EXISTS (
            SELECT 1 FROM "IngredientUnitTypes" existing WHERE existing."name" = $1
          )`,
        [ingredient.unit],
      );
      await client.query(
        `INSERT INTO "Ingredients" (
           "userId", "name", "normalizedName", "quantity", "unitTypeId",
           "locationId", "expiryDate", "source"
         )
         SELECT $1, $2, $3, $4, units."id", locations."id",
                now() + ($7 * interval '1 day'), 'manual'
           FROM (
             SELECT MIN("id") AS "id" FROM "IngredientUnitTypes" WHERE "name" = $5
           ) units
           JOIN "Locations" locations ON locations."userId" = $1 AND locations."key" = $6
          WHERE units."name" = $5
            AND NOT EXISTS (
              SELECT 1 FROM "Ingredients" existing
               WHERE existing."userId" = $1
                 AND existing."name" = $2
                 AND existing."locationId" = locations."id"
            )`,
        [userId, ingredient.name, ingredient.normalizedName, ingredient.quantity,
          ingredient.unit, ingredient.locationKey, ingredient.days],
      );
    }
  });
}

seed()
  .catch((error) => {
    console.error("Inventory seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => closePool());
