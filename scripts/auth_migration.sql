-- NextAuth tables for episodic-intelligence
-- Run with: psql $DATABASE_URL -f scripts/auth_migration.sql

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text,
  "email" text UNIQUE NOT NULL,
  "emailVerified" timestamp,
  "image" text,
  "password_hash" text
);

-- Accounts table (OAuth providers)
CREATE TABLE IF NOT EXISTS "accounts" (
  "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId")
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionToken" text PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS "verificationTokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- Add user_id to projects if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE "projects" ADD COLUMN "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Drop unused genre column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'genre'
  ) THEN
    ALTER TABLE "projects" DROP COLUMN "genre";
  END IF;
END $$;
