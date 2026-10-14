import { defineRelations } from 'drizzle-orm';
import { DB_COMPOSITION_ERROR_CODES, DbCompositionError } from './composition.js';
import { debugProjection } from './debug.js';
import { initDbWithOptions } from './init.js';
/**
 * Applies a middleware chain around a core handler function.
 */
function applyMiddleware(middleware, name, eventCount, coreHandler) {
    const meta = { name, eventCount };
    let next = coreHandler;
    for (let i = middleware.length - 1; i >= 0; i--) {
        const mw = middleware[i];
        const currentNext = next;
        next = () => mw({ next: currentNext, meta });
    }
    return next();
}
class ProjectionBuilderImpl {
    repos;
    _db;
    _name;
    _eventTypes;
    _middleware = [];
    constructor(repos, _db, middleware) {
        this.repos = repos;
        this._db = _db;
        if (middleware) {
            this._middleware = [...middleware];
        }
    }
    named(name) {
        debugProjection.debug('[builder] Setting projection name: {name}', { name });
        this._name = name;
        return this;
    }
    on(eventTypes) {
        debugProjection.debug('[builder] Registering event types: {eventTypes}', { eventTypes });
        this._eventTypes = [...eventTypes];
        return this;
    }
    handle(handler) {
        if (!this._name) {
            debugProjection.debug('[builder] Error: Projection name is required');
            throw new DbCompositionError({
                code: DB_COMPOSITION_ERROR_CODES.projectionNameMissing,
                message: 'Projection name is required. Call .named() first.',
                remediation: 'Call .named("...") before .handle().',
            });
        }
        if (!this._eventTypes) {
            debugProjection.debug('[builder] Error: Event types are required');
            throw new DbCompositionError({
                code: DB_COMPOSITION_ERROR_CODES.projectionEventsMissing,
                message: 'Event types are required. Call .on() first.',
                remediation: 'Call .on(...) with the event types before .handle().',
            });
        }
        const name = this._name;
        const eventTypes = this._eventTypes;
        const middleware = this._middleware;
        const repos = this.repos;
        const db = this._db;
        debugProjection.debug('[builder] Creating projection definition (name: {name}, eventTypes: {eventTypes}, middlewareCount: {middlewareLength})', { name, eventTypes, middlewareLength: middleware.length });
        return {
            name,
            canHandle: eventTypes,
            handle: async (events) => {
                const context = { repo: repos, db };
                const coreHandler = () => handler(events, context);
                if (middleware.length > 0) {
                    await applyMiddleware(middleware, name, events.length, coreHandler);
                }
                else {
                    await coreHandler();
                }
            },
        };
    }
    use(middleware) {
        debugProjection.debug('[builder] Adding projection middleware (currentCount: {currentCount})', {
            currentCount: this._middleware.length,
        });
        const newBuilder = new ProjectionBuilderImpl(this.repos, this._db, [
            ...this._middleware,
            middleware,
        ]);
        debugProjection.debug('[builder] Middleware added (newCount: {newCount})', {
            newCount: this._middleware.length + 1,
        });
        return newBuilder;
    }
}
class DbBuilderImpl {
    db;
    isDev;
    _repos;
    _repoFactories;
    constructor(db, isDev, repoFactories) {
        this.db = db;
        this.isDev = isDev;
        this._repoFactories = repoFactories ?? new Map();
    }
    registerRepository(key, factory) {
        debugProjection.debug('[builder] Registering repository (key: {key}, currentCount: {currentCount})', {
            key,
            currentCount: this._repoFactories.size,
        });
        const newFactories = new Map(this._repoFactories);
        newFactories.set(key, factory);
        debugProjection.debug('[builder] Repository registered (key: {key}, newCount: {newFactoriesSize})', {
            key,
            newFactoriesSize: newFactories.size,
        });
        return new DbBuilderImpl(this.db, this.isDev, newFactories);
    }
    projectionMiddleware(fn) {
        return fn;
    }
    get projection() {
        if (!this._repos) {
            debugProjection.debug('[builder] Initializing repositories from factories (count: {count})', {
                count: this._repoFactories.size,
            });
            const repos = {};
            for (const [key, factory] of this._repoFactories) {
                debugProjection.debug('[builder] Creating repository: {key}', { key });
                repos[key] = factory(this.db);
            }
            this._repos = repos;
            debugProjection.debug('[builder] All repositories initialized');
        }
        debugProjection.debug('[builder] Creating projection builder');
        return new ProjectionBuilderImpl(this._repos, this.db);
    }
}
class SchemaBuilderImpl {
    relations;
    constructor(relations) {
        this.relations = relations;
    }
    create(options) {
        debugProjection.debug('[builder] Creating database builder (isDev: {isDev}, hasPoolConfig: {hasPoolConfig})', {
            isDev: options.isDev ?? false,
            hasPoolConfig: !!options.poolConfig,
        });
        const poolConfig = {
            connectionString: options.connectionString,
            ...options.poolConfig,
        };
        debugProjection.debug('[builder] Initializing database with pool config');
        const db = initDbWithOptions(poolConfig, {
            relations: this.relations,
            logger: options.isDev,
        });
        debugProjection.debug('[builder] Database builder created successfully');
        return new DbBuilderImpl(db, options.isDev ?? false);
    }
}
class InitialBuilderImpl {
    schema(schema) {
        debugProjection.debug('[builder] Setting database schema (deriving relations via defineRelations)');
        const relations = defineRelations(schema);
        return new SchemaBuilderImpl(relations);
    }
    relations(relations) {
        debugProjection.debug('[builder] Setting database relations (explicit RQBv2)');
        return new SchemaBuilderImpl(relations);
    }
}
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
export const initDb = new InitialBuilderImpl();
//# sourceMappingURL=builder.js.map