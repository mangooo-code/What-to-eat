import type { Json } from "./common";

// Mirrors "Users" (backend/sql/migrations/20260825074005_InitializeUsers.sql)
export interface User {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string;
  isInternalAuthorization: boolean;
  /** Never send this to the client; included only to mirror the database schema. */
  hashedPassword: string | null;
  externalAuthorizationData: Json | null;
  /** ISO 8601 timestamp. */
  createdDate: string;
  /** ISO 8601 timestamp. */
  updatedDate: string;
}
