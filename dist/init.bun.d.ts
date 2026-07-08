import type { AnyRelations } from 'drizzle-orm';
import type { DrizzlePgConfig } from 'drizzle-orm/pg-core/utils';
import { SQL } from 'bun';
export declare const initDb: <TRelations extends AnyRelations>(connectionString: string, config: Omit<DrizzlePgConfig<TRelations>, "relations"> & {
    relations: TRelations;
}) => import("drizzle-orm/bun-sql/postgres").BunSQLDatabase<TRelations> & {
    $client: SQL;
};
export declare const initDbWithOptions: <TRelations extends AnyRelations>(poolConfig: {
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    min?: number;
    max?: number;
}, config: Omit<DrizzlePgConfig<TRelations>, "relations"> & {
    relations: TRelations;
}) => import("drizzle-orm/bun-sql/postgres").BunSQLDatabase<TRelations> & {
    $client: SQL;
};
export { createDb } from './factory.js';
export { getDbConnectionOptions, getDbConnectionParams } from './connection-options.js';
export { DB_COMPOSITION_ERROR_CODES, DbCompositionError, composeSchema, createUnitOfWork, } from './composition.js';
export type { ComposedSchema, TransactionalDb, UnitOfWork, UnitOfWorkScopes, } from './composition.js';
//# sourceMappingURL=init.bun.d.ts.map