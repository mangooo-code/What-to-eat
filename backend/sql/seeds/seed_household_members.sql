-- Idempotent Phase 1D development members for DEV_USER_ID.
-- Replace the owner UUID only when the centralized development identity changes.
INSERT INTO "HouseholdMembers" (
  "id", "ownerUserId", "name", "relationship", "isOwner",
  "tastePreference", "dietPreference", "dietaryRestrictions", "allergens"
)
SELECT * FROM (VALUES
  ('10000000-0000-4000-8000-000000000101'::uuid, 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, '我', '主用户', true, '家常', '低脂', '[]'::jsonb, '[]'::jsonb),
  ('10000000-0000-4000-8000-000000000102'::uuid, 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, '阳', '伴侣', false, '香辣', '高蛋白', '["不吃香菜"]'::jsonb, '[]'::jsonb),
  ('10000000-0000-4000-8000-000000000103'::uuid, 'c0ef3510-03b3-4024-a1e3-d85e53f2eb81'::uuid, '妈妈', '父母', false, '清淡', '低脂', '["不吃辣"]'::jsonb, '["海鲜"]'::jsonb)
) AS seed("id", "ownerUserId", "name", "relationship", "isOwner", "tastePreference", "dietPreference", "dietaryRestrictions", "allergens")
WHERE NOT EXISTS (
  SELECT 1
  FROM "HouseholdMembers" existing
  WHERE existing."ownerUserId" = seed."ownerUserId"
    AND existing."name" = seed."name"
);
