// Generic JSON value shape for JSONB columns whose structure isn't constrained by the database schema.
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
