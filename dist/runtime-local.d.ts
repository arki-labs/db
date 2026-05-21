import type { AnyRelations } from 'drizzle-orm';
import { PGlite, type Extension } from '@electric-sql/pglite';
import { type PgliteDatabase } from 'drizzle-orm/pglite';
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
 * Returns the raw PGlite instance alongside the Drizzle handle so callers can
 * share it with `@arki/queue/runtime-local` (one process, one PGlite).
 *
 * @example
 * ```ts
 * import { initDbRuntimeLocal } from '@arki/db/runtime-local';
 * const { db, pglite } = await initDbRuntimeLocal({ dataDir: './.local/db' }, { relations });
 * ```
 */
export declare function initDbRuntimeLocal<TRelations extends AnyRelations>(options: PgliteInitOptions, config: {
    relations: TRelations;
}): Promise<{
    db: PgliteDatabase<TRelations>;
    pglite: PGlite;
}>;
//# sourceMappingURL=runtime-local.d.ts.map