import type { AnyRelations, Logger } from 'drizzle-orm';
/**
 * Create a database connection using environment configuration.
 *
 * `relations` is required (mark the field even when empty) so TypeScript can
 * infer the precise relations type for `db.query.*` autocomplete. Use
 * `defineRelations(schema, callback)` to build the value.
 *
 * @throws Error if DB_URL is not configured.
 */
export declare function createDb<TRelations extends AnyRelations>(config: {
    relations: TRelations;
    logger?: boolean | Logger | undefined;
}): import("drizzle-orm/node-postgres").NodePgDatabase<TRelations> & {
    $client: import("pg").Pool;
};
export { getDbConnectionOptions, getDbConnectionParams } from './connection-options.js';
//# sourceMappingURL=factory.d.ts.map