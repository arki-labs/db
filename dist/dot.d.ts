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
import type { AnyRelations, Logger } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { type DotPip } from '@arki/dot/pip';
import { type PgliteInitOptions } from './runtime-local.js';
/**
 * Common options shared by all DB driver variants.
 */
type BaseDbDotOptions<TRelations extends AnyRelations> = {
    /** Drizzle 1.0 relations config (build via `defineRelations`). */
    readonly relations: TRelations;
    /** Drizzle logger override — `true`/`false` or a custom `Logger` instance. */
    readonly logger?: boolean | Logger;
    /**
     * Pip name override. Defaults to `'db'`. Use this only when composing
     * multiple database scopes inside the same app (e.g. primary + reporting).
     */
    readonly name?: string;
};
/** Options for the node-postgres driver (the default). */
export type PgDbDotOptions<TRelations extends AnyRelations> = BaseDbDotOptions<TRelations> & {
    /** Driver discriminant. Defaults to `'pg'` when omitted. */
    readonly driver?: 'pg';
};
/** Options for the embedded-PGlite driver. */
export type PgliteDbDotOptions<TRelations extends AnyRelations> = BaseDbDotOptions<TRelations> & PgliteInitOptions & {
    /** Driver discriminant. */
    readonly driver: 'pglite';
};
/** Discriminated union of all supported driver option shapes. */
export type DbDotOptions<TRelations extends AnyRelations> = PgDbDotOptions<TRelations> | PgliteDbDotOptions<TRelations>;
/**
 * Services published by the db adapter. Keyed by the driver — for the
 * default `'pg'` driver, `services.db` is a `NodePgDatabase<TRelations>`;
 * for `'pglite'` it is a `PgliteDatabase<TRelations>`.
 */
export type DbServices<TRelations extends AnyRelations, TDriver extends 'pg' | 'pglite' = 'pg'> = {
    readonly db: TDriver extends 'pglite' ? PgliteDatabase<TRelations> : NodePgDatabase<TRelations>;
};
/**
 * Build a DOT pip that opens a Drizzle database and publishes it as
 * a service. The kernel calls `dispose` in reverse-topological order to
 * close the underlying pool / PGlite instance.
 */
export declare function db<TRelations extends AnyRelations>(options: PgDbDotOptions<TRelations>): DotPip<DbServices<TRelations, 'pg'>>;
export declare function db<TRelations extends AnyRelations>(options: PgliteDbDotOptions<TRelations>): DotPip<DbServices<TRelations, 'pglite'>>;
export {};
//# sourceMappingURL=dot.d.ts.map