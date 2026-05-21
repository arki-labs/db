import type { AnyRelations } from 'drizzle-orm';
import { defineRelations } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PoolConfig } from 'pg';
/**
 * Projection middleware context
 */
export type ProjectionMiddlewareContext = {
    next: () => Promise<void>;
    meta: {
        name: string;
        eventCount: number;
    };
};
/**
 * Projection middleware function
 */
export type ProjectionMiddleware = (context: ProjectionMiddlewareContext) => Promise<void>;
/**
 * Projection handler context
 */
export type ProjectionHandlerContext<TRepos, TRelations extends AnyRelations = AnyRelations> = {
    repo: TRepos;
    db: NodePgDatabase<TRelations>;
};
/**
 * Projection handler function
 */
export type ProjectionHandler<TEvent, TRepos, TRelations extends AnyRelations = AnyRelations> = (events: TEvent[], context: ProjectionHandlerContext<TRepos, TRelations>) => Promise<void>;
/**
 * Projection builder interface
 */
export type ProjectionBuilder<TEvent = never, TRepos = never, TRelations extends AnyRelations = AnyRelations> = {
    named<TName extends string>(name: TName): ProjectionBuilderWithName<TEvent, TRepos, TRelations, TName>;
};
export type ProjectionBuilderWithName<_TEvent, TRepos, TRelations extends AnyRelations, TName extends string> = {
    on<TEventType extends {
        type: string;
    }>(eventTypes: readonly TEventType['type'][] | TEventType['type'][]): ProjectionBuilderWithEvents<TEventType, TRepos, TRelations, TName>;
};
export type ProjectionBuilderWithEvents<TEvent, TRepos, TRelations extends AnyRelations, TName extends string> = {
    handle(handler: ProjectionHandler<TEvent, TRepos, TRelations>): ProjectionDefinition<TName>;
};
/**
 * Emmett-compatible projection definition.
 */
export type ProjectionDefinition<TName extends string = string> = {
    name: TName;
    canHandle: string[];
    handle: (events: {
        type: string;
    }[]) => Promise<void>;
};
/**
 * Database builder with projection support
 */
export type DbBuilder<TRelations extends AnyRelations, TRepos extends Record<string, unknown>> = {
    readonly db: NodePgDatabase<TRelations>;
    readonly isDev: boolean;
    registerRepository<K extends string, R>(key: K, factory: (db: NodePgDatabase<TRelations>) => R): DbBuilder<TRelations, TRepos & Record<K, R>>;
    projectionMiddleware(fn: ProjectionMiddleware): ProjectionMiddleware;
    readonly projection: ProjectionBuilderRoot<TRepos, TRelations>;
};
/**
 * Projection builder root that can have middleware applied
 */
export type ProjectionBuilderRoot<TRepos, TRelations extends AnyRelations = AnyRelations> = {
    use(middleware: ProjectionMiddleware): ProjectionBuilderRoot<TRepos, TRelations>;
} & ProjectionBuilder<never, TRepos, TRelations>;
/**
 * Schema configuration step
 */
export type SchemaBuilder<TRelations extends AnyRelations> = {
    create(options: {
        connectionString: string;
        isDev?: boolean;
        poolConfig?: Partial<PoolConfig>;
    }): DbBuilder<TRelations, Record<string, never>>;
};
/**
 * Initial builder step
 */
export type InitialBuilder = {
    /**
     * Set the database tables. Internally builds a relations config via
     * `defineRelations()` so consumers keep passing a plain table record.
     *
     * Use this for backends that don't define explicit relations and rely on
     * auto-derivation (no joins). For explicit RQBv2 relations, prefer
     * `.relations(...)` with a `defineRelations(tables, cb)` result.
     */
    schema<TSchema extends Record<string, unknown>>(schema: TSchema): SchemaBuilder<ReturnType<typeof defineRelations<TSchema>>>;
    /**
     * Pass a pre-built relations object (the result of
     * `defineRelations(tables, cb)`) so the database knows about every table
     * AND the explicit one/many relations declared by the application.
     */
    relations<TRelations extends AnyRelations>(relations: TRelations): SchemaBuilder<TRelations>;
};
/**
 * Initialize the database builder.
 *
 * @example
 * ```typescript
 * const d = initDb
 *   .schema(schema)
 *   .create({
 *     connectionString: env.DB_URL,
 *     isDev: process.env.NODE_ENV === 'development',
 *   });
 *
 * const db = d.db;
 * const projection = d.projection.named('my-proj').on(['EventA']).handle(async (events, ctx) => {
 *   // handler
 * });
 * ```
 */
export declare const initDb: InitialBuilder;
//# sourceMappingURL=builder.d.ts.map