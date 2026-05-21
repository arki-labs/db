import type { AnyRelations } from 'drizzle-orm';
import type { BunSQLDatabase } from 'drizzle-orm/bun-sql/postgres';
import type { DrizzlePgConfig } from 'drizzle-orm/pg-core/utils';
/**
 * Initialize database with Bun's native SQL driver.
 * @param connectionString - PostgreSQL connection string.
 * @param config - Drizzle pg configuration.
 */
export declare const initDb: <TRelations extends AnyRelations>(connectionString: string, config: Omit<DrizzlePgConfig<TRelations>, "relations"> & {
    relations: TRelations;
}) => BunSQLDatabase<TRelations>;
/**
 * Create a database connection using environment configuration with Bun SQL.
 * @param config - Drizzle pg configuration.
 * @throws Error if DB_URL is not configured.
 */
export declare function createDb<TRelations extends AnyRelations>(config: Omit<DrizzlePgConfig<TRelations>, 'relations'> & {
    relations: TRelations;
}): BunSQLDatabase<TRelations>;
export { getDbConnectionOptions, getDbConnectionParams } from './connection-options.js';
export type { BunSQLDatabase } from 'drizzle-orm/bun-sql/postgres';
//# sourceMappingURL=bun.d.ts.map