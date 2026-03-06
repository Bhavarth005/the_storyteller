import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const inputTypeEnum = pgEnum("input_type", ["idea", "draft"]);

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  inputType: inputTypeEnum("input_type").notNull(),
  originalRawStory: text("original_raw_story").notNull(),
  // Circular FK — not enforced at DB level to avoid deferred constraint complexity.
  // Managed via relations API and application logic.
  activeVersionId: uuid("active_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Versions ────────────────────────────────────────────────────────────────

export const versions = pgTable(
  "versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    parentVersionId: uuid("parent_version_id"),
    commitMessage: text("commit_message").notNull(),
    analysisStatus: analysisStatusEnum("analysis_status")
      .notNull()
      .default("pending"),
    generationMetadata: jsonb("generation_metadata"),
    globalCharacters: jsonb("global_characters"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("versions_project_id_idx").on(table.projectId),
    index("versions_analysis_status_idx").on(table.analysisStatus),
  ]
);

// ─── Episodes ────────────────────────────────────────────────────────────────

export const episodes = pgTable(
  "episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    episodeNumber: integer("episode_number").notNull(),
    title: text("title").notNull(),
    scriptContent: text("script_content").notNull(),
    scriptSegments: jsonb("script_segments"),
    hookAndCliffhangerMetrics: jsonb("hook_and_cliffhanger_metrics"),
    optimizationSuggestions: jsonb("optimization_suggestions"),
    characterAppearances: jsonb("character_appearances"),
    continuityLedger: jsonb("continuity_ledger"),
  },
  (table) => [
    uniqueIndex("episodes_version_episode_uniq").on(
      table.versionId,
      table.episodeNumber
    ),
    index("episodes_project_id_idx").on(table.projectId),
    index("episodes_version_id_idx").on(table.versionId),
    index("episodes_episode_number_idx").on(table.episodeNumber),
    check("episode_number_positive", sql`episode_number > 0`),
  ]
);

// ─── Version Analysis ────────────────────────────────────────────────────────

export const versionAnalysis = pgTable(
  "version_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionId: uuid("version_id")
      .notNull()
      .references(() => versions.id, { onDelete: "cascade" }),
    overallEngagementScore: numeric("overall_engagement_score"),
    averageCliffhanger: numeric("average_cliffhanger"),
    emotionalVarianceIndex: numeric("emotional_variance_index"),
    radarMetrics: jsonb("radar_metrics"),
  },
  (table) => [uniqueIndex("version_analysis_version_id_uniq").on(table.versionId)]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ one, many }) => ({
  activeVersion: one(versions, {
    fields: [projects.activeVersionId],
    references: [versions.id],
    relationName: "activeVersion",
  }),
  versions: many(versions, { relationName: "projectVersions" }),
  episodes: many(episodes),
}));

export const versionsRelations = relations(versions, ({ one, many }) => ({
  project: one(projects, {
    fields: [versions.projectId],
    references: [projects.id],
    relationName: "projectVersions",
  }),
  parentVersion: one(versions, {
    fields: [versions.parentVersionId],
    references: [versions.id],
    relationName: "versionLineage",
  }),
  episodes: many(episodes),
  versionAnalysis: one(versionAnalysis),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
  project: one(projects, {
    fields: [episodes.projectId],
    references: [projects.id],
  }),
  version: one(versions, {
    fields: [episodes.versionId],
    references: [versions.id],
  }),
}));

export const versionAnalysisRelations = relations(
  versionAnalysis,
  ({ one }) => ({
    version: one(versions, {
      fields: [versionAnalysis.versionId],
      references: [versions.id],
    }),
  })
);
