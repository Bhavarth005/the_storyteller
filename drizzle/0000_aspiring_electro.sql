CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'processing', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."input_type" AS ENUM('idea', 'draft');--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"episode_number" integer NOT NULL,
	"title" text NOT NULL,
	"script_content" text NOT NULL,
	"script_segments" jsonb,
	"hook_and_cliffhanger_metrics" jsonb,
	"optimization_suggestions" jsonb,
	"character_appearances" jsonb,
	"continuity_ledger" jsonb,
	CONSTRAINT "episode_number_positive" CHECK (episode_number > 0)
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"input_type" "input_type" NOT NULL,
	"original_raw_story" text NOT NULL,
	"active_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"overall_engagement_score" numeric,
	"average_cliffhanger" numeric,
	"emotional_variance_index" numeric,
	"radar_metrics" jsonb
);
--> statement-breakpoint
CREATE TABLE "versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"parent_version_id" uuid,
	"commit_message" text NOT NULL,
	"analysis_status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"generation_metadata" jsonb,
	"global_characters" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_version_id_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_analysis" ADD CONSTRAINT "version_analysis_version_id_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "episodes_version_episode_uniq" ON "episodes" USING btree ("version_id","episode_number");--> statement-breakpoint
CREATE INDEX "episodes_project_id_idx" ON "episodes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "episodes_version_id_idx" ON "episodes" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "episodes_episode_number_idx" ON "episodes" USING btree ("episode_number");--> statement-breakpoint
CREATE UNIQUE INDEX "version_analysis_version_id_uniq" ON "version_analysis" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "versions_project_id_idx" ON "versions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "versions_analysis_status_idx" ON "versions" USING btree ("analysis_status");