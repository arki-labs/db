/**
 * DOT adapter for `@arki/db`.
 *
 * Wraps the Drizzle database initialization as a DOT plugin. The plugin's
 * `db` factory opens the connection at boot, publishes the Drizzle handle
 * as `services.db`, and tears down the underlying client in `dispose`
 * (reverse declaration order). `database.provides.db` is the typed handle
 * consumers name in their `needs`, known before anything boots.
 *
 * Two drivers are supported:
 *   - `'pg'` (default) — `node-postgres` pool. Pass `url: () => env.DB_URL`
 *     to read the URL at boot (never at import); without it the adapter
 *     reads `DB_URL`. The `DB_POOL_*` env vars come from `@arki/db`'s
 *     built-in env loader.
 *   - `'pglite'` — embedded PGlite. Pass `dataDir`, or `memory: true` for
 *     an in-memory instance. Use for tests, single-binary apps, or local
 *     development without a real Postgres server.
 *
 * SQLite through libSQL has its own entry, `@arki/db/libsql/dot`, with the
 * same `db()` name: one module per backend, so this entry never loads the
 * libSQL client (an optional peer).
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
 * // Node-postgres (default); the URL thunk runs at boot:
 * export const database = db({ relations, url: () => env.DB_URL });
 * export type Db = Provided<typeof database.provides.db>;
 *
 * const app = await defineApp('my-app').infra(database).boot();
 * // a consumer: needs: { db: database.provides.db }
 *
 * // PGlite in-memory (great for tests):
 * const testApp = await defineApp('test')
 *   .infra(db({ driver: 'pglite', memory: true, relations }))
 *   .boot();
 * ```
 *
 * To mount a second database scope (e.g. primary + reporting) in the same
 * app, rename the published wire key at the mount site:
 *
 * ```ts
 * import { rename } from '@arki/dot';
 *
 * const reportsDb = rename(db({ driver: 'pglite', memory: true, relations }), { db: 'reportsDb' }, 'reports-db');
 * .use(database).use(reportsDb)  // consumers name reportsDb.provides.reportsDb
 * ```
 *
 * The `@arki/dot` package is an OPTIONAL peer of `@arki/db`. Importing
 * this adapter without `@arki/dot` installed will fail at module load —
 * that is intentional: the adapter only makes sense in a DOT app.
 */
import pg from 'pg';
import { DotUnitError, infra, service } from '@arki/dot/unit';
import { isFailure } from '@arki/failure';
import { DB_PLUGIN_ERROR_CODES, readUrl } from './dot-errors.js';
import { env } from './env.js';
import { createDb } from './factory.js';
import { resolveDirectUrl } from './hosts.js';
import { migrateDb, pendingMigrations } from './migrate.js';
import { runTransactionOnce } from './owned-transaction.js';
import { initDbRuntimeLocal } from './runtime-local.js';
export { DB_PLUGIN_ERROR_CODES } from './dot-errors.js';
/** Listeners and lock waiters hold their connection for as long as they run; four covers both with room to spare. */
const SESSION_POOL_MAX = 4;
export function db(options) {
    if (options.driver === 'pglite')
        return createPglitePlugin(options);
    return createPgPlugin(options);
}
function createPglitePlugin(options) {
    // PGlite path: open the embedded instance and Drizzle handle at boot.
    // We capture the raw PGlite client in the factory so `dispose` can close
    // it deterministically. `services.db` is the Drizzle handle only —
    // exposing the PGlite client would leak driver-specific surface.
    let close;
    return infra({
        name: 'db',
        configure(ctx) {
            ctx.registerService('db', 'db');
        },
        provides: {
            db: async () => {
                const local = await initDbRuntimeLocal({
                    ...(options.dataDir === undefined ? {} : { dataDir: options.dataDir }),
                    ...(options.memory === undefined ? {} : { memory: options.memory }),
                    ...(options.extensions === undefined ? {} : { extensions: options.extensions }),
                }, {
                    relations: options.relations,
                    ...(options.logger === undefined ? {} : { logger: options.logger }),
                });
                if (isFailure(local))
                    return local;
                close = local.close;
                return local.db;
            },
        },
        async dispose() {
            if (close !== undefined) {
                const outcome = await close();
                if (isFailure(outcome))
                    return outcome;
                close = undefined;
            }
            return;
        },
    });
}
function createPgPlugin(options) {
    // Node-postgres path: createDb already reads env vars and constructs the
    // pool. Drizzle owns the pool — closing it goes via the `$client.end()`
    // path that node-postgres exposes through Drizzle's handle.
    return infra({
        name: 'db',
        configure(ctx) {
            ctx.registerService('db', 'db');
            ctx.registerService('sessionPool', 'db');
        },
        provides: {
            db: () => createDb({
                relations: options.relations,
                url: readUrl('pg', options.url),
                ...(options.logger === undefined ? {} : { logger: options.logger }),
            }),
            sessionPool: () => {
                // Never throws for a pooled URL: an app that uses no session feature must still boot.
                const direct = resolveDirectUrl({ url: readUrl('pg', options.url), directUrl: options.directUrl?.() ?? env.DB_DIRECT_URL });
                if (isFailure(direct))
                    return refusingPool(direct);
                return new pg.Pool({ connectionString: direct, max: SESSION_POOL_MAX });
            },
        },
        async dispose({ db: handle, sessionPool }) {
            // Drizzle exposes the underlying pg.Pool as `$client`. We call its
            // `end()` to drain in-flight queries and close all sockets.
            const pgHandle = handle;
            // End both pools even when the first `end()` rejects, then report every failure.
            const failures = [];
            if (pgHandle.$client !== undefined) {
                try {
                    await pgHandle.$client.end();
                }
                catch (error) {
                    failures.push(error);
                }
            }
            try {
                await sessionPool.end();
            }
            catch (error) {
                failures.push(error);
            }
            if (failures.length === 1)
                throw failures[0];
            if (failures.length > 1)
                throw new AggregateError(failures, 'db: closing the query pool and the session pool both failed');
        },
    });
}
/** A `sessionPool` stand-in whose every `connect()` rejects with the coded refusal. */
function refusingPool(refusal) {
    return {
        connect: () => Promise.reject(new DotUnitError({
            code: DB_PLUGIN_ERROR_CODES.sessionOnPooledUrl,
            message: `[db] ${refusal.message}`,
            remediation: `Set DB_DIRECT_URL, or pass directUrl: () => env.DB_DIRECT_URL to db(...). ${refusal.data.hint}`,
            docsUrl: 'https://arki.dev/dot/errors/arki-db-plugin-e004',
        })),
        end: () => Promise.resolve(),
    };
}
/**
 * DOT plugin: migrate during `boot`, after the `db` plugin and before any
 * plugin that reads tables. Needs the `db` service.
 *
 * Provides `migrations`: `{ pending }`, the names this boot found pending and
 * then applied, in order (empty when the database was up to date). `dot dev`
 * reads it from its preflight boot to print what it applied.
 */
export function dbMigrations(options) {
    return infra({
        name: 'db-migrations',
        needs: { db: service() },
        provides: {
            // Factories run before `boot`, so this reads the database before any migration is applied.
            migrations: async ({ db }) => {
                const pending = await pendingMigrations(db, options);
                if (isFailure(pending))
                    return pending;
                return { pending: Object.freeze(pending) };
            },
        },
        async boot({ db }) {
            return migrateDb(db, options);
        },
    });
}
function bindAll(factories, database) {
    const out = {};
    // SameDatabase<F> proved at `repos()` that each factory takes `DatabaseOf<F>`.
    for (const [key, make] of Object.entries(factories))
        out[key] = make(database);
    // Erasure seam: built key by key at runtime; typed by the factories' own return types.
    return out;
}
function refuseReservedRepoName(factories) {
    if (Object.hasOwn(factories, 'withTx')) {
        throw new DotUnitError({
            code: DB_PLUGIN_ERROR_CODES.reservedRepoName,
            message: '[repos] "withTx" is reserved: every repos set uses it to rebind to a transaction.',
            remediation: 'Rename the repository (for example "transactions" or "txLog").',
            docsUrl: 'https://arki.dev/dot/errors/arki-db-plugin-e002',
        });
    }
}
/**
 * A feature's repositories as one infra unit: built once at boot, bound to
 * the feature's `db`, published as `repos`. In the feature chain it becomes
 * private (`highlights.repos`), and `dot explain` draws
 * `highlights → highlights/repos → database`.
 *
 * - The plugin needs `db` unbound (`DatabaseOf<F>`, read off the factories).
 *   The feature declares which database that is: `.needs({ db: database.provides.db })`
 *   (or a second database's handle, `.needs({ db: reports.provides.reportsDb })`).
 *   A feature that declares no `db`, or one of another type, fails at `.infra()`.
 *   Nothing is chosen by name behind your back.
 * - `withTx` is reserved (compile error and `ARKI_DB_PLUGIN_E002`).
 * - Tests replace the whole set: `feature.override({ repos })` takes a full
 *   `Repos<F>`. See the README for fakes that type-check.
 *
 * @example
 * ```ts
 * // features/highlights/infra/repository.ts
 * export const repository = repos({
 *   highlights: (db: Database) => new HighlightRepository(db),
 *   collections: createCollectionRepository,
 * });
 * // feature.ts
 * defineFeature('highlights')
 *   .needs({ db: entrypointOnly(database.provides.db) })
 *   .infra(repository)
 *   .usecases({ list: ({ repos }: Deps) => (itemId: ItemId) => repos.highlights.listByItem(itemId) });
 * ```
 */
export function repos(factories) {
    refuseReservedRepoName(factories);
    return infra({
        name: 'repos',
        // Unbound: the feature binds `db` to its own handle at `.infra()`, and the
        // kernel orders this plugin after the database that publishes it.
        needs: { db: service() },
        provides: {
            repos: ({ db }) => ({
                ...bindAll(factories, db),
                withTx: (tx) => bindAll(factories, tx),
            }),
        },
    });
}
/**
 * `repos()` for a scope that owns its transactions: the published `repos`
 * has `withTx(tx)` and nothing else. Pair it with
 * `.needs({ db: entrypointOnly(database.provides.db) })`: entrypoints open the
 * transaction, usecases take `tx`, and no usecase can reach a database-bound
 * repository — `repos.highlights` is a compile error.
 *
 * @example
 * ```ts
 * export const store = txRepos({ digests: (tx: Transaction) => new DigestRepository(tx) });
 * // usecases/run.ts
 * const run = ({ repos }: Deps) => (tx: Transaction, id: DigestId) => repos.withTx(tx).digests.get(id);
 * ```
 */
export function txRepos(factories) {
    refuseReservedRepoName(factories);
    return infra({
        name: 'repos',
        needs: { db: service() },
        provides: {
            repos: () => ({ withTx: (tx) => bindAll(factories, tx) }),
        },
    });
}
/**
 * A feature's transaction opener as one private infra unit: it needs `db`
 * unbound (the feature binds its own handle at `.infra()`) and publishes
 * `transaction(fn)` — and nothing else: no query builder, no `db`. Pair it
 * with `.needs({ db: entrypointOnly(database.provides.db) })`: a usecase
 * may open a transaction and hand its `tx` on, but it can never run raw SQL.
 * It takes the database HANDLE, never a type: the database and transaction
 * types are read off the handle, and `.infra()` checks the feature declares
 * that same handle — another database's handle is a compile error.
 *
 * @example
 * ```ts
 * const digestDeps = defineFeature('digest')
 *   .needs({ db: entrypointOnly(database.provides.db) })
 *   .infra(store, transactions(database.provides.db));
 * // usecases/compile.ts
 * const compile = ({ transaction, compiler }: Deps) => (plan: DigestPlan) => transaction(tx => compiler.store(tx, plan));
 * ```
 */
export function transactions(db) {
    return infra({
        name: 'transactions',
        // Bound to the feature's database handle — key and provider literals included, so `.infra()` refuses any other.
        needs: { db },
        provides: {
            transaction: ({ db }) => fn => runTransactionOnce(db, fn),
        },
    });
}
/**
 * Some methods of a repository, bound to it: what a feature hands other
 * features instead of the whole repository (reads, not writes).
 *
 * Why bound: `{ get: repos.stories.get }` copies a class method off its
 * object, and the first `this.db` inside it throws. `reader()` binds each one.
 *
 * @example
 * ```ts
 * .provides({ storyReader: ({ repos }) => reader(repos.stories, ['get', 'listByUser']) })
 * ```
 */
export function reader(repository, methods) {
    const out = {};
    for (const name of methods) {
        const method = repository[name];
        if (typeof method !== 'function') {
            throw new DotUnitError({
                code: DB_PLUGIN_ERROR_CODES.readerNotAMethod,
                message: `[repos] reader(): "${String(name)}" is not a method of the repository.`,
                remediation: 'List only method names; publish plain values through provides() directly.',
                docsUrl: 'https://arki.dev/dot/errors/arki-db-plugin-e003',
            });
        }
        out[name] = method.bind(repository);
    }
    // Erasure seam: built name by name above; each value is the repository's own method, bound.
    return out;
}
//# sourceMappingURL=dot.js.map