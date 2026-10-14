import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { debugInit } from './debug.js';
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
export async function initDbRuntimeLocal(options, config) {
    const url = options.memory === true ? 'memory://' : (options.dataDir ?? './.local/db');
    debugInit.debug('[runtime-local] Initializing PGlite at: {url}', { url });
    const pglite = options.extensions ? new PGlite(url, { extensions: options.extensions }) : new PGlite(url);
    await pglite.waitReady;
    debugInit.debug('[runtime-local] PGlite ready');
    const db = drizzle({
        client: pglite,
        relations: config.relations,
        ...(config.logger === undefined ? {} : { logger: config.logger }),
    });
    debugInit.debug('[runtime-local] Drizzle database initialized');
    return { db, pglite };
}
//# sourceMappingURL=runtime-local.js.map