# Episodic Intelligence Engine - Backend Build Progress

## Phase 1: Environment & Repository Setup
- [x] Install backend dependencies using `bun add`: drizzle-orm, postgres, dotenv, zod. — Installed drizzle-orm, postgres, dotenv, zod via bun.
- [x] Install dev dependencies using `bun add -d`: drizzle-kit, tsx, @types/node. — Installed drizzle-kit, tsx, @types/node as dev dependencies via bun.

## Phase 2: Database Initialization
- [x] Create a `.env` file in the root. Based on the provided `docker-compose.yaml`, add the database URL: `DATABASE_URL=postgresql://bhavarth:admin@localhost:5432/episodic_intelligence` — Created .env with DATABASE_URL.
- [x] Instruct me to run `docker-compose up -d` in my WSL terminal to start the DB. — User ran docker-compose up -d, Postgres container is running.

## Phase 3: Drizzle ORM Configuration
- [x] Create `drizzle.config.ts` in the root directory configured for PostgreSQL, pointing to the `.env` URL and the schema file at `src/db/schema.ts`. — Created with dialect "postgresql", schema path, and dotenv-loaded DB URL.
- [x] Create the database connection instance at `src/db/index.ts` using the `postgres` driver. — Created using postgres-js driver with full schema import for relational queries.

## Phase 4: Schema Definition
- [x] Read the provided `data_model_spec.md` file. — Reviewed all entities, enums, JSONB schemas, constraints, and relationships.
- [x] Create `src/db/schema.ts`. — Created with full Drizzle ORM definitions.
- [x] Translate the Entities (projects, versions, episodes, version_analysis) into Drizzle ORM table definitions. — All 4 tables defined with correct column types, defaults, and FK references.
- [x] Ensure `jsonb` columns are used exactly where specified for arrays/objects (e.g., script_segments, radar_metrics). — 8 JSONB columns across episodes, versions, and version_analysis.
- [x] Define the Enums (`analysis_status`, `input_type`). — Defined via pgEnum with correct values.
- [x] Setup the relationships (one-to-many, one-to-one) using Drizzle's `relations` API. — All relations defined: project↔versions, project↔episodes, version↔episodes, version↔versionAnalysis, self-referential version lineage.

## Phase 5: Migrations
- [x] Add migration scripts to `package.json` (e.g., `"db:generate": "drizzle-kit generate", "db:push": "drizzle-kit push"`). — Added db:generate, db:push, db:migrate, and db:studio scripts.
- [x] Instruct me to run the generate and push commands to sync the schema to the Docker Postgres DB. — User ran db:generate and db:push, schema synced to Postgres.

## Phase 6: API Route Scaffolding (App Router)
- [x] Read the provided `api_spec.md` file. — Mapped all 17 endpoints to App Router folder structure.
- [x] Create the exact folder structure required for the Next.js App Router inside `src/app/api/`. — Created 16 folders covering projects, versions, episodes, and AI pipeline routes.
- [x] Create a `route.ts` file inside each folder with empty boilerplate `export async function GET/POST/PATCH/DELETE` functions returning a 501 Not Implemented status. — All 17 route files created with correct HTTP methods and 501 responses.
## Phase 7: Core Project & Version CRUD
- [x] Implement `GET /api/projects`: Fetch all projects from the DB, ordered by `updatedAt` descending. — Implemented with pagination (page/limit query params), snake_case JSON response.
- [x] Implement `GET /api/projects/[id]`: Fetch a single project and JOIN its active version data (using Drizzle relational queries). — Uses db.query relational API with nested activeVersion→episodes→versionAnalysis, UUID validation via Zod.
- [x] Implement `PATCH /api/projects/[id]`: Allow renaming the project title. — Zod-validated body, returns updated title + updated_at, 404 on missing project.
- [x] Implement `DELETE /api/projects/[id]`: Ensure cascading deletes work correctly. — UUID validation, returns 204 on success, 404 on missing project.
- [x] Implement `POST /api/generate-core` (Initial Setup): Create Project, Version, placeholder Episodes, and link activeVersionId. — Full transactional flow: Project→Version(pending)→3 placeholder Episodes→links activeVersionId, Zod validation on body.