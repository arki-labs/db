import { text } from 'drizzle-orm/sqlite-core';
import { orThrow } from '@arki/failure';
import { tagColumnSchema } from './id-columns-shared.js';
/**
 * The SQLite columns of one id kind. Same shape as the Postgres `idColumns`
 * in `@arki/db`; the id type comes from the declaration's generator, so it
 * is written once, in the prefix. SQLite `text` has no length, so there is no
 * `varchar(256)`.
 *
 * @example
 * ```typescript
 * const story = idColumns(storyId);
 * export const stories = sqliteTable('stories', {
 *   id: story.primaryColumn(),
 *   parentId: story.optionalReference('parent_id'),
 * });
 * ```
 */
export function idColumns(id) {
    const { schema, create } = id;
    const columns = {
        /** Primary key column: text, not null, typed as the id, defaulting to a fresh id. */
        primaryColumn: (name = 'id') => tagColumnSchema(text(name)
            .notNull()
            .primaryKey()
            .$type()
            .$defaultFn(() => {
            // Drizzle requires a scalar default; its foreign callback cannot return a Failure.
            return orThrow(create());
        }), schema),
        /** Nullable id column, null by default. */
        optionalColumn: (name) => tagColumnSchema(text(name)
            .$type()
            .$defaultFn(() => null), schema),
        /** Not-null id column that defaults to a fresh id. */
        requiredColumn: (name) => tagColumnSchema(text(name)
            .notNull()
            .$type()
            .$defaultFn(() => {
            // Drizzle requires a scalar default; its foreign callback cannot return a Failure.
            return orThrow(create());
        }), schema),
        /** Reference column: text, not null, typed as the id (no default, no constraint). */
        reference: (name) => tagColumnSchema(text(name).notNull().$type(), schema),
        /** Optional reference column: text, nullable, typed as the id. */
        optionalReference: (name) => tagColumnSchema(text(name).$type(), schema),
        /** Not-null foreign key column with a database constraint. */
        foreignKey: (name, referenceFn, options) => tagColumnSchema(text(name).notNull().$type().references(referenceFn, options), schema),
        /** Nullable foreign key column with a database constraint. */
        optionalForeignKey: (name, referenceFn, options) => tagColumnSchema(text(name).$type().references(referenceFn, options), schema),
        /** Foreign key factory bound to one table, for several keys to the same column. */
        createForeignKeyFactory: (referenceFn) => ({
            required: (name, options) => columns.foreignKey(name, referenceFn, options),
            optional: (name, options) => columns.optionalForeignKey(name, referenceFn, options),
        }),
    };
    return columns;
}
export * from 'drizzle-orm/sqlite-core';
export { sqliteColumns } from './columns-sqlite.js';
export { instant } from './sqlite-instant.js';
export { sqliteNowMs } from './sqlite-now.js';
export { unrefTimer } from './timers.js';
//# sourceMappingURL=sqlite.js.map