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

ALTER TABLE "Locations"
    ADD CONSTRAINT "Locations_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users"("id");

ALTER TABLE "Ingredients"
    ADD CONSTRAINT "Ingredients_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "Users"("id");
