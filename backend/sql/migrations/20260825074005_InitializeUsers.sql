CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "middleName" TEXT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "isInternalAuthorization" BOOLEAN NOT NULL DEFAULT TRUE,
    "hashedPassword" TEXT NULL,
    "externalAuthorizationData" JSONB NULL,
    "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO "Users" (
    "firstName",
    "middleName",
    "lastName",
    "phoneNumber",
    "isInternalAuthorization"
)
VALUES (
    'System',
    NULL,
    'Migration',
    '__migration_system_user__',
    TRUE
)
ON CONFLICT ("phoneNumber") DO NOTHING;

ALTER TABLE "Locations"
    ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN "parentLocation_uuid" UUID NULL,
    ADD COLUMN "userId" UUID NULL,
    ADD COLUMN "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE "Locations" child
SET "parentLocation_uuid" = parent."id_uuid"
FROM "Locations" parent
WHERE child."parentLocation" = parent."id";

UPDATE "Locations"
SET "userId" = (
    SELECT "id"
    FROM "Users"
    WHERE "phoneNumber" = '__migration_system_user__'
    LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Locations"
    ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Ingredients"
    ADD COLUMN "id_uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN "locationId_uuid" UUID NULL,
    ADD COLUMN "userId" UUID NULL,
    ADD COLUMN "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE "Ingredients" ingredient
SET "locationId_uuid" = location."id_uuid"
FROM "Locations" location
WHERE ingredient."locationId" = location."id";

UPDATE "Ingredients"
SET "userId" = (
    SELECT "id"
    FROM "Users"
    WHERE "phoneNumber" = '__migration_system_user__'
    LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Ingredients"
    ALTER COLUMN "locationId_uuid" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Ingredients"
    DROP COLUMN "locationId",
    DROP COLUMN "id";

ALTER TABLE "Locations"
    DROP COLUMN "parentLocation",
    DROP COLUMN "id";

ALTER TABLE "Locations"
    RENAME COLUMN "id_uuid" TO "id";

ALTER TABLE "Locations"
    RENAME COLUMN "parentLocation_uuid" TO "parentLocation";

ALTER TABLE "Ingredients"
    RENAME COLUMN "id_uuid" TO "id";

ALTER TABLE "Ingredients"
    RENAME COLUMN "locationId_uuid" TO "locationId";

ALTER TABLE "Locations"
    ADD PRIMARY KEY ("id");

ALTER TABLE "Ingredients"
    ADD PRIMARY KEY ("id");

ALTER TABLE "Locations"
    ADD CONSTRAINT "Locations_parentLocation_fkey"
        FOREIGN KEY ("parentLocation") REFERENCES "Locations"("id"),
    ADD CONSTRAINT "Locations_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users"("id");

ALTER TABLE "Ingredients"
    ADD CONSTRAINT "Ingredients_locationId_fkey"
        FOREIGN KEY ("locationId") REFERENCES "Locations"("id"),
    ADD CONSTRAINT "Ingredients_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users"("id");
