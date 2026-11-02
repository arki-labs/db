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
import type { AnyRelations, Logger } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { Handle } from '@arki/dot/unit';
import type { MigratableDb, MigrateDbOptions } from './migrate.js';
import type { ListenPool } from './pg-listen.js';
import type { PgliteInitOptions } from './runtime-local.js';
import type { TransactionFailure } from './transaction.js';
export { DB_PLUGIN_ERROR_CODES } from './dot-errors.js';
/**
 * Common options shared by all DB driver variants.
 */
type BaseDbDotOptions<TRelations extends AnyRelations> = {
    /** Drizzle 1.0 relations config (build via `defineRelations`). */
    readonly relations: TRelations;
    /** Drizzle logger override — `true`/`false` or a custom `Logger` instance. */
    readonly logger?: boolean | Logger;
};
/** Options for the node-postgres driver (the default). */
export type PgDbDotOptions<TRelations extends AnyRelations> = BaseDbDotOptions<TRelations> & {
    /** Driver discriminant. Defaults to `'pg'` when omitted. */
    readonly driver?: 'pg';
    /**
     * The connection URL, read when the app boots (never at import). Falls
     * back to `DB_URL` from the environment when absent or `undefined`.
     */
    readonly url?: () => string | undefined;
    /**
     * The direct (non-pooled) URL that `sessionPool` connects to, read at boot.
     * Falls back to `DB_DIRECT_URL`, then to `url` when `url` is not a known pooler.
     */
    readonly directUrl?: () => string | undefined;
};
/** Options for the embedded-PGlite driver. */
export type PgliteDbDotOptions<TRelations extends AnyRelations> = BaseDbDotOptions<TRelations> & PgliteInitOptions & {
    /** Driver discriminant. */
    readonly driver: 'pglite';
};
/** Discriminated union of all supported driver option shapes. */
export type DbDotOptions<TRelations extends AnyRelations> = PgDbDotOptions<TRelations> | PgliteDbDotOptions<TRelations>;
/**
 * A small pool on the direct URL, for work that must keep one session: LISTEN
 * (`listenOnPool`), session locks (a lock lease's `listen`), migrations. It is
 * separate from the query pool, so held listeners never take query connections.
 */
export type SessionPool = ListenPool & {
    end(): Promise<void>;
};
/**
 * Services published by the db adapter. Keyed by the driver — for the
 * default `'pg'` driver, `services.db` is a `NodePgDatabase<TRelations>`
 * and `services.sessionPool` a {@link SessionPool}; for `'pglite'`, `db` is a
 * `PgliteDatabase<TRelations>` (PGlite listens through `client.listen`).
 */
export type DbServices<TRelations extends AnyRelations, TDriver extends 'pg' | 'pglite' = 'pg'> = TDriver extends 'pglite' ? {
    readonly db: PgliteDatabase<TRelations>;
} : {
    readonly db: NodePgDatabase<TRelations>;
    readonly sessionPool: SessionPool;
};
/**
 * Build a DOT plugin that opens a Drizzle database and publishes it as
 * a service. The kernel calls `dispose` in reverse declaration order to
 * close the underlying pool / PGlite instance.
 */
export declare function db<TRelations extends AnyRelations>(options: PgDbDotOptions<TRelations>): ReturnType<typeof createPgPlugin<TRelations>>;
export declare function db<TRelations extends AnyRelations>(options: PgliteDbDotOptions<TRelations>): ReturnType<typeof createPglitePlugin<TRelations>>;
declare function createPglitePlugin<TRelations extends AnyRelations>(options: PgliteDbDotOptions<TRelations>): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<import("@arki/dot/unit").EmptyShape>, import("@arki/dot/unit").ProvidedValues<{
    db: Promise<PgliteDatabase<TRelations> | import("./runtime-local-failures.js").LocalRuntimeFailure>;
}>, import("@arki/dot/unit").EmptyShape, "db", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").InferredPhases<{
    configure: undefined;
    start: undefined;
    stop: undefined;
    dispose: import("@arki/failure").Failure<"db.local_runtime_cleanup_failed", undefined> | undefined;
}>>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    db: Promise<PgliteDatabase<TRelations> | import("./runtime-local-failures.js").LocalRuntimeFailure>;
}>> & {
    readonly factories: {
        readonly db: (ctx: never) => Promise<PgliteDatabase<TRelations> | import("./runtime-local-failures.js").LocalRuntimeFailure>;
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: import("@arki/failure").Failure<"db.local_runtime_cleanup_failed", undefined> | undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<import("@arki/dot/unit").EmptyShape> & import("@arki/dot/unit").ProvidedValues<{
        db: Promise<PgliteDatabase<TRelations> | import("./runtime-local-failures.js").LocalRuntimeFailure>;
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
declare function createPgPlugin<TRelations extends AnyRelations>(options: PgDbDotOptions<TRelations>): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<import("@arki/dot/unit").EmptyShape>, import("@arki/dot/unit").ProvidedValues<{
    db: NodePgDatabase<TRelations>;
    sessionPool: ListenPool & {
        end(): Promise<void>;
    };
}>, import("@arki/dot/unit").EmptyShape, "db", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").EmptyPhases>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    db: NodePgDatabase<TRelations>;
    sessionPool: ListenPool & {
        end(): Promise<void>;
    };
}>> & {
    readonly factories: {
        readonly db: (ctx: never) => NodePgDatabase<TRelations>;
        readonly sessionPool: (ctx: never) => ListenPool & {
            end(): Promise<void>;
        };
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<import("@arki/dot/unit").EmptyShape> & import("@arki/dot/unit").ProvidedValues<{
        db: NodePgDatabase<TRelations>;
        sessionPool: ListenPool & {
            end(): Promise<void>;
        };
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
/**
 * DOT plugin: migrate during `boot`, after the `db` plugin and before any
 * plugin that reads tables. Needs the `db` service.
 *
 * Provides `migrations`: `{ pending }`, the names this boot found pending and
 * then applied, in order (empty when the database was up to date). `dot dev`
 * reads it from its preflight boot to print what it applied.
 */
export declare function dbMigrations<TRelations extends AnyRelations = AnyRelations>(options: MigrateDbOptions): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<{
    db: import("@arki/dot/unit").Service<MigratableDb<TRelations>>;
}>, import("@arki/dot/unit").ProvidedValues<{
    migrations: Promise<import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_state_failed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | {
        readonly pending: readonly string[];
    }>;
}>, {
    db: import("@arki/dot/unit").Service<MigratableDb<TRelations>>;
}, "db-migrations", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").InferredPhases<{
    configure: undefined;
    start: undefined;
    stop: undefined;
    dispose: undefined;
}>>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    migrations: Promise<import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_state_failed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | {
        readonly pending: readonly string[];
    }>;
}>> & {
    readonly factories: {
        readonly migrations: (ctx: never) => Promise<import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_state_failed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | {
            readonly pending: readonly string[];
        }>;
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<{
        db: import("@arki/dot/unit").Service<MigratableDb<TRelations>>;
    }> & import("@arki/dot/unit").ProvidedValues<{
        migrations: Promise<import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_state_failed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | {
            readonly pending: readonly string[];
        }>;
    }> & import("@arki/dot/unit").KernelCtx, import("@arki/failure").Failure<"db.migration_read_failed", undefined> | import("@arki/failure").Failure<"db.migration_unconfirmed", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | undefined>;
} & import("@arki/dot/unit").InfraRole;
/** Repository factories by name: `{ highlights: createHighlightRepository }`, each `(database) => repository`. */
export type RepoFactories = Readonly<Record<string, (database: never) => object>>;
/**
 * The database type the factories take, read from their own parameter
 * (for example `Db | Transaction`). Written once — in the factories.
 */
export type DatabaseOf<F extends RepoFactories> = Parameters<F[keyof F]>[0];
/** One repository per factory, all bound to the same database or transaction. */
export type RepoSet<F extends RepoFactories> = {
    readonly [K in keyof F]: ReturnType<F[K]>;
};
/**
 * The `repos` service: the repositories bound to the app's database, plus
 * `withTx(tx)` for the same set bound to a transaction.
 */
export type Repos<F extends RepoFactories> = RepoSet<F> & {
    /**
     * The same repositories bound to `tx`. Every call builds a fresh set
     * (one small object per repository), so call it once per transaction and
     * keep the result — not once per query. For a nested transaction, call it
     * again on this `repos` with the inner `tx`; the set it returns has no
     * `withTx` of its own.
     */
    withTx(tx: DatabaseOf<F>): RepoSet<F>;
};
/** Every factory must accept the one shared database type: a stricter factory fails at `repos()`. */
type SameDatabase<F extends RepoFactories> = {
    readonly [K in keyof F]: (database: DatabaseOf<F>) => object;
};
/** `withTx` belongs to the set; a repository with that name would be silently replaced by it. */
type NoWithTx = {
    readonly withTx?: never;
};
/**
 * The `repos` service of a transaction-owning scope: `withTx(tx)` only. There
 * is no database-bound set to call by mistake, so every query runs inside a
 * transaction an entrypoint opened. See `txRepos()`.
 */
export type TxRepos<F extends RepoFactories> = {
    withTx(tx: DatabaseOf<F>): RepoSet<F>;
};
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
export declare function repos<const F extends RepoFactories>(factories: F & SameDatabase<F> & NoWithTx): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<{
    db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
}>, import("@arki/dot/unit").ProvidedValues<{
    repos: RepoSet<F> & {
        /**
         * The same repositories bound to `tx`. Every call builds a fresh set
         * (one small object per repository), so call it once per transaction and
         * keep the result — not once per query. For a nested transaction, call it
         * again on this `repos` with the inner `tx`; the set it returns has no
         * `withTx` of its own.
         */
        withTx(tx: DatabaseOf<F>): RepoSet<F>;
    };
}>, {
    db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
}, "repos", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").EmptyPhases>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    repos: RepoSet<F> & {
        /**
         * The same repositories bound to `tx`. Every call builds a fresh set
         * (one small object per repository), so call it once per transaction and
         * keep the result — not once per query. For a nested transaction, call it
         * again on this `repos` with the inner `tx`; the set it returns has no
         * `withTx` of its own.
         */
        withTx(tx: DatabaseOf<F>): RepoSet<F>;
    };
}>> & {
    readonly factories: {
        readonly repos: (ctx: never) => RepoSet<F> & {
            /**
             * The same repositories bound to `tx`. Every call builds a fresh set
             * (one small object per repository), so call it once per transaction and
             * keep the result — not once per query. For a nested transaction, call it
             * again on this `repos` with the inner `tx`; the set it returns has no
             * `withTx` of its own.
             */
            withTx(tx: DatabaseOf<F>): RepoSet<F>;
        };
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<{
        db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
    }> & import("@arki/dot/unit").ProvidedValues<{
        repos: RepoSet<F> & {
            /**
             * The same repositories bound to `tx`. Every call builds a fresh set
             * (one small object per repository), so call it once per transaction and
             * keep the result — not once per query. For a nested transaction, call it
             * again on this `repos` with the inner `tx`; the set it returns has no
             * `withTx` of its own.
             */
            withTx(tx: DatabaseOf<F>): RepoSet<F>;
        };
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
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
export declare function txRepos<const F extends RepoFactories>(factories: F & SameDatabase<F> & NoWithTx): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<{
    db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
}>, import("@arki/dot/unit").ProvidedValues<{
    repos: TxRepos<F>;
}>, {
    db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
}, "repos", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").EmptyPhases>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    repos: TxRepos<F>;
}>> & {
    readonly factories: {
        readonly repos: (ctx: never) => TxRepos<F>;
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<{
        db: import("@arki/dot/unit").Service<DatabaseOf<F>>;
    }> & import("@arki/dot/unit").ProvidedValues<{
        repos: TxRepos<F>;
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
/** Anything with Drizzle's `transaction(fn)` handing `fn` a `Tx`: the database handle, or a transaction (then `fn` runs in a savepoint). */
export type Transactable<Tx> = {
    transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
};
/** The transaction type `TDb.transaction(fn)` hands to `fn` — read off the database, never restated. */
export type TxOf<TDb> = TDb extends {
    transaction(fn: (tx: infer Tx) => never): unknown;
} ? Tx : never;
/**
 * The `transaction` service: run `fn` inside one transaction of the bound
 * database. It commits ordinary values and rolls back returned failures or thrown errors.
 * The `tx` it hands out is the database's own transaction type, so
 * `repos.withTx(tx)` takes it with no cast.
 */
export type OpenTransaction<Tx> = <T>(fn: (tx: Tx) => Promise<T>) => Promise<T | TransactionFailure>;
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
export declare function transactions<TDb extends Transactable<Tx>, K extends string, O extends string, Tx = TxOf<TDb>>(db: Handle<TDb, K, O>): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<{
    db: Handle<TDb, K, O>;
}>, import("@arki/dot/unit").ProvidedValues<{
    transaction: OpenTransaction<Tx>;
}>, {
    db: Handle<TDb, K, O>;
}, "transactions", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").EmptyPhases>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    transaction: OpenTransaction<Tx>;
}>> & {
    readonly factories: {
        readonly transaction: (ctx: never) => OpenTransaction<Tx>;
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<{
        db: Handle<TDb, K, O>;
    }> & import("@arki/dot/unit").ProvidedValues<{
        transaction: OpenTransaction<Tx>;
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
/** The keys of `R` whose values are functions. */
type MethodKeys<R> = {
    [K in keyof R]: R[K] extends (...args: never[]) => unknown ? K : never;
}[keyof R];
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
export declare function reader<R extends object, const M extends readonly MethodKeys<R>[]>(repository: R, methods: M): Pick<R, M[number]>;
//# sourceMappingURL=dot.d.ts.map