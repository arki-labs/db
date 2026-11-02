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
import type { AnyRelations } from 'drizzle-orm';
import type { LibsqlDbOptions } from '../libsql.js';
/** Options for `db()`: the relations and logger of {@link LibsqlDbOptions}, with the URL and token read at boot. */
export type LibsqlDbDotOptions<TRelations extends AnyRelations> = Pick<LibsqlDbOptions<TRelations>, 'relations' | 'logger'> & {
    /**
     * `file:path.db`, `:memory:`, or a `libsql:` / `http(s):` / `ws(s):` server URL,
     * read when the app boots. Falls back to `DB_URL` when absent or `undefined`.
     */
    readonly url?: () => string | undefined;
    /** The server's auth token (Turso), read at boot. Not used for local files. */
    readonly authToken?: () => string | undefined;
};
/**
 * Build a DOT plugin that opens a libSQL database at boot and publishes its
 * Drizzle handle as `services.db`. `dispose` closes the client.
 */
export declare function db<TRelations extends AnyRelations>(options: LibsqlDbDotOptions<TRelations>): Omit<import("@arki/dot/unit").Unit<import("@arki/dot/unit").WireNeeds<import("@arki/dot/unit").EmptyShape>, import("@arki/dot/unit").ProvidedValues<{
    db: import("drizzle-orm/libsql/driver-core").LibSQLDatabase<TRelations>;
}>, import("@arki/dot/unit").EmptyShape, "db", import("@arki/dot/unit").EmptyOwnership, import("@arki/dot/unit").EmptyPhases>, "factories" | "hooks" | "logging"> & import("@arki/dot/unit").LoggingSlot<import("@arki/dot/unit").DotLoggingHandle<undefined>> & import("@arki/dot/unit").FactoryContract<import("@arki/dot/unit").ProvidedValues<{
    db: import("drizzle-orm/libsql/driver-core").LibSQLDatabase<TRelations>;
}>> & {
    readonly factories: {
        readonly db: (ctx: never) => import("drizzle-orm/libsql/driver-core").LibSQLDatabase<TRelations>;
    };
    readonly hooks: import("@arki/dot/unit").PhaseHooks<never, {
        readonly configure: undefined;
        readonly start: undefined;
        readonly stop: undefined;
        readonly dispose: undefined;
    }, import("@arki/dot/unit").DotConfigureContext> & import("@arki/dot/unit").BootSlot<import("@arki/dot/unit").CtxOf<import("@arki/dot/unit").EmptyShape> & import("@arki/dot/unit").ProvidedValues<{
        db: import("drizzle-orm/libsql/driver-core").LibSQLDatabase<TRelations>;
    }> & import("@arki/dot/unit").KernelCtx, undefined>;
} & import("@arki/dot/unit").InfraRole;
//# sourceMappingURL=dot.d.ts.map