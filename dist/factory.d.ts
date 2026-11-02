/** Build a Drizzle database from the environment: `createDb` and the connection-option helpers. */
import type { AnyRelations, Logger } from 'drizzle-orm';
/**
 * Create a database connection using environment configuration.
 * `url` overrides `DB_URL`; the pool settings still come from the env. With
 * `url`, `DB_URL` is never read, so it may be unset.
 *
 * `relations` is required (mark the field even when empty) so TypeScript can
 * infer the precise relations type for `db.query.*` autocomplete. Use
 * `defineRelations(schema, callback)` to build the value.
 *
 * @throws Error if neither `url` nor DB_URL is configured.
 */
export declare function createDb<TRelations extends AnyRelations>({ url, ...config }: {
    relations: TRelations;
    logger?: boolean | Logger | undefined;
    url?: string | undefined;
}): import("drizzle-orm/node-postgres").NodePgDatabase<TRelations> & {
    $client: import("pg").Pool;
};
export { getDbConnectionOptions, getDbConnectionParams } from './connection-options.js';
//# sourceMappingURL=factory.d.ts.map