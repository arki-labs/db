/**
 * DOT adapter for `@arki/db` on SQLite through libSQL: a `file:` path,
 * `:memory:`, or a Turso / libSQL server.
 *
 * Its own entry, like Drizzle's `drizzle-orm/libsql` next to
 * `drizzle-orm/node-postgres`: only an app that imports it loads the optional
 * peer `@libsql/client`, so `@arki/db/dot` builds without it.
 *
 * The plugin opens the database at boot, publishes the Drizzle handle as
 * `services.db` (a `LibSQLDatabase<TRelations>`; SQLite has no LISTEN, so no
 * `sessionPool`), and closes the client in `dispose`. `dbMigrations()` from
 * `@arki/db/dot` migrates it at boot.
 *
 * @example
 * ```ts
 * import { defineApp } from '@arki/dot';
 * import { db } from '@arki/db/libsql/dot';
 *
 * export const database = db({ relations, url: () => env.DB_URL }); // DB_URL=file:./data/app.db
 * const app = await defineApp('my-app').infra(database).boot();
 * ```
 */
import { infra } from '@arki/dot/unit';
import { readUrl } from '../dot-errors.js';
import { createLibsqlDb } from '../libsql.js';
/**
 * Build a DOT plugin that opens a libSQL database at boot and publishes its
 * Drizzle handle as `services.db`. `dispose` closes the client.
 */
export function db(options) {
    let close;
    return infra({
        name: 'db',
        configure(ctx) {
            ctx.registerService('db', 'db');
        },
        provides: {
            db: () => {
                const opened = createLibsqlDb({
                    url: readUrl('libsql', options.url),
                    authToken: options.authToken?.(),
                    relations: options.relations,
                    ...(options.logger === undefined ? {} : { logger: options.logger }),
                });
                close = opened.close;
                return opened.db;
            },
        },
        dispose() {
            const closing = close;
            close = undefined;
            closing?.();
        },
    });
}
//# sourceMappingURL=dot.js.map