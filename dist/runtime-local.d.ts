/** An embedded PGlite database with an owner lock on its data directory. */
import type { Extension } from '@electric-sql/pglite';
import type { AnyRelations, Logger } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import type { LocalRuntimeCloseFailure, LocalRuntimeFailure } from './runtime-local-failures.js';
export * from './runtime-local-failures.js';
export type PgliteInitOptions = {
    /** Path to the PGlite data directory. Defaults to `./.local/db`. */
    dataDir?: string;
    /** Use an in-memory database (overrides dataDir). */
    memory?: boolean;
    /** PGlite extensions to load (e.g. `{ vector }` from `@electric-sql/pglite/vector`). */
    extensions?: Record<string, Extension>;
};
/**
 * Initialize a PGlite-backed Drizzle database for embedded local development.
 *
 * Returns canonical failures, or the Drizzle handle, raw PGlite and owned close.
 * A file data directory has one owner; a live owner returns DataDirInUse.
 * Dead owners are reclaimed. Memory and browser storage take no owner lock.
 * Owned close returns cleanup failures; raw pglite.close keeps PGlite's throwing API.
 *
 * @example
 * ```ts
 * import { isFailure } from '@arki/failure';
 * import { initDbRuntimeLocal } from '@arki/db/runtime-local';
 * const result = await initDbRuntimeLocal({ dataDir: './.local/db' }, { relations });
 * if (isFailure(result)) return result;
 * const { db, pglite } = result;
 * ```
 */
export declare function initDbRuntimeLocal<TRelations extends AnyRelations>(options: PgliteInitOptions, config: {
    relations: TRelations;
    /** Drizzle logger override — `true`/`false` or a custom `Logger`, same as the pg driver. */
    logger?: boolean | Logger | undefined;
}): Promise<{
    db: PgliteDatabase<TRelations>;
    pglite: PGlite;
    close: () => Promise<void | LocalRuntimeCloseFailure>;
} | LocalRuntimeFailure>;
//# sourceMappingURL=runtime-local.d.ts.map