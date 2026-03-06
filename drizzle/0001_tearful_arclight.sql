CREATE TYPE "public"."genre" AS ENUM('thriller', 'romance', 'comedy', 'drama');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "genre" "genre" DEFAULT 'drama' NOT NULL;--> statement-breakpoint
ALTER TABLE "versions" ADD COLUMN "episode_count" integer DEFAULT 8 NOT NULL;