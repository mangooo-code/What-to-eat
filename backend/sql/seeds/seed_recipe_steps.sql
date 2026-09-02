-- Idempotent seed for the "番茄炒蛋" recipe steps that previously lived as mock data
-- in frontend/app/lib/data.ts ("steps" array). Inserts a base Recipe row for it if one
-- doesn't already exist, then its RecipeSteps rows.
INSERT INTO "Recipes" ("id", "userId", "name", "description", "time", "difficulty", "source")
VALUES (
  '10000000-0000-4000-8000-000000000201'::uuid,
  'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid,
  '番茄炒蛋',
  '番茄和鸡蛋家里都有，不需要额外购买主要食材，15 分钟左右就能做好，很适合今天快速做一顿家常菜。',
  15,
  '简单',
  'curated'
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "RecipeSteps" ("recipeId", "stepNumber", "title", "detailedInstructions", "time")
SELECT '10000000-0000-4000-8000-000000000201'::uuid, seed."stepNumber", seed."title", seed."detailedInstructions", seed."time"
  FROM (VALUES
    (1, '准备食材', '番茄切成小块。鸡蛋打入碗中，加少量盐搅匀。', 3::numeric),
    (2, '炒鸡蛋', '锅中加入食用油，油热后倒入鸡蛋，快速翻炒至刚刚凝固，然后盛出备用。', 3::numeric),
    (3, '炒番茄', '锅中加入少量食用油，倒入番茄，中火翻炒至变软出汁，再加入少量盐和白糖。', 5::numeric),
    (4, '混合调味', '将炒好的鸡蛋倒回锅中，与番茄翻炒均匀，让汤汁均匀裹住鸡蛋后即可出锅。', 2::numeric)
  ) AS seed("stepNumber", "title", "detailedInstructions", "time")
 WHERE NOT EXISTS (
   SELECT 1 FROM "RecipeSteps" existing
   WHERE existing."recipeId" = '10000000-0000-4000-8000-000000000201'::uuid
     AND existing."stepNumber" = seed."stepNumber"
 );

INSERT INTO "SeedHistory" ("seedName") VALUES ('seed_recipe_steps')
ON CONFLICT ("seedName") DO NOTHING;

