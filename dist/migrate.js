import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/pg-core';
import { debugInit } from './debug.js';
/** Read a `drizzle-kit generate` folder into the in-memory form. Build-time helper. */
export function readMigrations(migrationsFolder) {
    return readMigrationFiles({ migrationsFolder });
}
/**
 * Run pending migrations. Both drivers share drizzle's Postgres migrate step
 * (`drizzle-orm/pg-core`'s `migrate`), which the per-driver `migrate()`
 * helpers merely wrap with `readMigrationFiles`.
 */
export async function migrateDb(db, options) {
    const migrations = options.migrations === undefined ? readMigrations(options.migrationsFolder) : [...options.migrations];
    debugInit.debug('[migrate] applying {migrationsLength} migration(s)', { migrationsLength: migrations.length });
    await migrate(migrations, db, {
        // Drizzle's config type requires the folder even though this step only
        // reads the table/schema names; the list above is already in memory.
        migrationsFolder: options.migrationsFolder ?? '',
        migrationsTable: options.migrationsTable ?? '__drizzle_migrations',
        migrationsSchema: options.migrationsSchema ?? 'drizzle',
    });
    debugInit.debug('[migrate] migrations applied');
}
//# sourceMappingURL=migrate.js.map