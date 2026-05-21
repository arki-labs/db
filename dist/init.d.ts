import type { AnyRelations } from 'drizzle-orm';
import type { DrizzlePgConfig } from 'drizzle-orm/pg-core/utils';
import type { PoolConfig } from 'pg';
export declare const initDb: <TRelations extends AnyRelations>(connectionString: string, config: Omit<DrizzlePgConfig<TRelations>, "relations"> & {
    relations: TRelations;
}) => import("drizzle-orm/node-postgres").NodePgDatabase<TRelations> & {
    $client: import("pg").Pool;
};
export declare const initDbWithOptions: <TRelations extends AnyRelations>(poolConfig: PoolConfig, config: Omit<DrizzlePgConfig<TRelations>, "relations"> & {
    relations: TRelations;
}) => import("drizzle-orm/node-postgres").NodePgDatabase<TRelations> & {
    $client: import("pg").Pool;
};
export { createDb } from './factory.js';
export { getDbConnectionOptions, getDbConnectionParams } from './connection-options.js';
//# sourceMappingURL=init.d.ts.map