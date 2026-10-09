import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/pg-core';
import { plugin, service } from '@arki/dot/plugin';
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
    debugInit('[migrate] applying %d migration(s)', migrations.length);
    await migrate(migrations, db, {
        // Drizzle's config type requires the folder even though this step only
        // reads the table/schema names; the list above is already in memory.
        migrationsFolder: options.migrationsFolder ?? '',
        migrationsTable: options.migrationsTable ?? '__drizzle_migrations',
        migrationsSchema: options.migrationsSchema ?? 'drizzle',
    });
    debugInit('[migrate] migrations applied');
}
/**
 * DOT plugin: migrate during `boot`, after the `db` plugin and before any
 * plugin that reads tables. Needs the `db` service; provides nothing.
 */
export function dbMigrations(options) {
    return plugin({
        name: 'db-migrations',
        version: '0.1.0',
        needs: { db: service() },
        async boot({ db }) {
            await migrateDb(db, options);
        },
    });
}
//# sourceMappingURL=migrate.js.map