/**
 * Apply Drizzle migrations to a handle opened by `@arki/db`, whichever driver
 * produced it. The DOT plugin that does so at boot is `dbMigrations` in `@arki/db/dot`.
 *
 * Why this lives here and not in each app: consumers must not import the
 * drizzle migrator modules themselves. Outside the monorepo that pulls a second
 * `drizzle-orm` into the app whose types do not match the one `@arki/db`
 * returns, and every app ends up re-implementing "migrate at boot" anyway.
 *
 * Migrations come either from the folder `drizzle-kit generate` writes, or
 * from an in-memory list (`readMigrations(folder)` at build time, committed as
 * a module). The second form is what a bundled server needs: there is no
 * `drizzle/` folder next to `.output/server/index.mjs`.
 *
 * @example
 * ```ts
 * import { db, dbMigrations } from '@arki/db/dot';
 *
 * defineApp('shop')
 *   .use(db({ driver: 'pglite', dataDir: './.local/db', relations }))
 *   .use(dbMigrations({ migrationsFolder: './drizzle' }))   // or { migrations }
 *   .useAll(plugs(features));
 * ```
 */
import type { AnyRelations } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { MigrationMeta } from 'drizzle-orm/migrator';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
export { MIGRATION_APPLY_FAILURES, MIGRATION_READ_FAILURES, MIGRATION_STATE_FAILURES, MigrationReadFailed, MigrationStateFailed, MigrationUnconfirmed, } from './migrate-failures.js';
/** Any handle the `db` plugin publishes. */
export type MigratableDb<TRelations extends AnyRelations = AnyRelations> = NodePgDatabase<TRelations> | PgliteDatabase<TRelations> | LibSQLDatabase<TRelations>;
/** One migration as drizzle's migrator consumes it. Re-exported so apps can type a generated module. */
export type { MigrationMeta } from 'drizzle-orm/migrator';
type MigrationSource = {
    /** Folder produced by `drizzle-kit generate`. Read at migration time. */
    readonly migrationsFolder: string;
    readonly migrations?: undefined;
} | {
    /** Migrations already in memory, e.g. a module generated with `readMigrations()`. */
    readonly migrations: readonly MigrationMeta[];
    readonly migrationsFolder?: undefined;
};
export type MigrateDbOptions = MigrationSource & {
    /** Override drizzle's bookkeeping table (`__drizzle_migrations`). */
    readonly migrationsTable?: string;
    /** Override the schema the bookkeeping table lives in (`drizzle`). Postgres only: SQLite has no schemas. */
    readonly migrationsSchema?: string;
};
/** Read a `drizzle-kit generate` folder into the in-memory form. Build-time helper. */
export declare function readMigrations(migrationsFolder: string): MigrationMeta[] | import("@arki/failure").Failure<"db.migration_read_failed", undefined>;
/**
 * The names of the migrations `migrateDb` would apply now, in order. Read
 * only: it never creates the bookkeeping table. Uses drizzle's own rule
 * (`getMigrationsToRun`), so the list matches what `migrateDb` runs.
 */
export declare function pendingMigrations<TRelations extends AnyRelations>(db: MigratableDb<TRelations>, options: MigrateDbOptions): Promise<string[] | import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_state_failed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined>>;
/**
 * Run pending migrations. Both drivers share drizzle's Postgres migrate step
 * (`drizzle-orm/pg-core`'s `migrate`), which the per-driver `migrate()`
 * helpers merely wrap with `readMigrationFiles`.
 */
export declare function migrateDb<TRelations extends AnyRelations>(db: MigratableDb<TRelations>, options: MigrateDbOptions): Promise<import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_unconfirmed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | undefined>;
//# sourceMappingURL=migrate.d.ts.map