/**
 * DOT adapter for `@arki/db`.
 *
 * Wraps the Drizzle database initialization as a `DotPip`. The pip
 * opens a database connection in `boot`, publishes the Drizzle handle as
 * `services.db`, and tears down the underlying client in `dispose`
 * (reverse-topological order).
 *
 * Two drivers are supported:
 *   - `'pg'` (default) — `node-postgres` pool. Reads `DB_URL` and the
 *     `DB_POOL_*` env vars via `@arki/db`'s built-in env loader.
 *   - `'pglite'` — embedded PGlite. Pass `dataDir`, or `memory: true` for
 *     an in-memory instance. Use for tests, single-binary apps, or local
 *     development without a real Postgres server.
 *
 * @example
 * ```ts
 * import { defineApp } from '@arki/dot';
 * import { db } from '@arki/db/dot';
 * import { defineRelations } from '@arki/db/orm';
 * import { schema } from './schema';
 *
 * const relations = defineRelations(schema, (b) => ({ ... }));
 *
 * // Node-postgres (default), reads DB_URL from env:
 * const app = await defineApp('my-app')
 *   .use(db({ relations }))
 *   .boot();
 *
 * // PGlite in-memory (great for tests):
 * const testApp = await defineApp('test')
 *   .use(db({ driver: 'pglite', memory: true, relations }))
 *   .boot();
 * ```
 *
 * The `@arki/dot` package is an OPTIONAL peer of `@arki/db`. Importing
 * this adapter without `@arki/dot` installed will fail at module load —
 * that is intentional: the adapter only makes sense in a DOT app.
 */
import { defineDotPip } from '@arki/dot/pip';
import { createDb } from './factory.js';
import { initDbRuntimeLocal } from './runtime-local.js';
export function db(options) {
    const name = options.name ?? 'db';
    const driver = options.driver ?? 'pg';
    if (driver === 'pglite') {
        const pgliteOptions = options;
        // PGlite path: open the embedded instance and Drizzle handle in boot.
        // We capture the raw PGlite client at boot-time so `dispose` can close
        // it deterministically. `services.db` is the Drizzle handle only —
        // exposing the PGlite client would leak driver-specific surface.
        let pgliteHandle;
        return defineDotPip({
            name,
            version: '0.1.0',
            provides: ['db'],
            configure(ctx) {
                ctx.registerService('db', 'db');
            },
            async boot() {
                const { db: handle, pglite } = await initDbRuntimeLocal({
                    ...(pgliteOptions.dataDir !== undefined ? { dataDir: pgliteOptions.dataDir } : {}),
                    ...(pgliteOptions.memory !== undefined ? { memory: pgliteOptions.memory } : {}),
                    ...(pgliteOptions.extensions !== undefined ? { extensions: pgliteOptions.extensions } : {}),
                }, { relations: pgliteOptions.relations });
                pgliteHandle = pglite;
                return { services: { db: handle } };
            },
            async dispose() {
                if (pgliteHandle !== undefined) {
                    await pgliteHandle.close();
                    pgliteHandle = undefined;
                }
            },
        });
    }
    // Node-postgres path: createDb already reads env vars and constructs the
    // pool. Drizzle owns the pool — closing it goes via the `$client.end()`
    // path that node-postgres exposes through Drizzle's handle.
    return defineDotPip({
        name,
        version: '0.1.0',
        provides: ['db'],
        configure(ctx) {
            ctx.registerService('db', 'db');
        },
        boot() {
            const handle = createDb({
                relations: options.relations,
                ...(options.logger !== undefined ? { logger: options.logger } : {}),
            });
            return { services: { db: handle } };
        },
        async dispose({ services }) {
            // Drizzle exposes the underlying pg.Pool as `$client`. We call its
            // `end()` to drain in-flight queries and close all sockets.
            const pgHandle = services.db;
            if (pgHandle.$client !== undefined) {
                await pgHandle.$client.end();
            }
        },
    });
}
//# sourceMappingURL=dot.js.map