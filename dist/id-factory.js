import { varchar } from 'drizzle-orm/pg-core';
import { createIdBody } from '@arki/contracts';
import { isFailure, orThrow } from '@arki/failure';
import { tagColumnSchema } from './id-columns-shared.js';
/** Generate an unprefixed legacy ID, or the canonical entropy failure. */
export const createId = createIdBody;
/** Preserve the supplied prefix exactly, including legacy empty or non-word prefixes. */
export const createPrefixedId = (prefix) => {
    const body = createId();
    return isFailure(body) ? body : `${prefix}${body}`;
};
/**
 * The Drizzle columns of one id kind. The id type comes from the
 * declaration's generator, so it is written once — in the prefix.
 *
 * @example
 * ```typescript
 * // model/ids.ts (browser-safe):  export const storyId = defineId('sty_');
 * // model/tables.ts (server):
 * const story = idColumns(storyId);
 * export const stories = pgTable('stories', {
 *   id: story.primaryColumn(),
 *   parentId: story.optionalReference('parent_id'),
 * });
 * ```
 */
export function idColumns(id) {
    const { schema, create } = id;
    const columns = {
        /**
         * Drizzle column helper for primary key columns
         * Automatically configures as varchar(256), not null, primary key, with proper type and default
         */
        primaryColumn: (name = 'id') => tagColumnSchema(varchar(name, { length: 256 })
            .notNull()
            .primaryKey()
            .$type()
            .$defaultFn(() => {
            // Drizzle requires a scalar default; its foreign callback cannot return a Failure.
            return orThrow(create());
        }), schema),
        optionalColumn: (name) => tagColumnSchema(varchar(name, { length: 256 })
            .$type()
            .$defaultFn(() => null), schema),
        requiredColumn: (name) => tagColumnSchema(varchar(name, { length: 256 })
            .notNull()
            .$type()
            .$defaultFn(() => {
            // Drizzle requires a scalar default; its foreign callback cannot return a Failure.
            return orThrow(create());
        }), schema),
        /**
         * Drizzle column helper for foreign key reference columns
         * Configures as varchar(256), not null, with proper type (no default or primary key)
         */
        reference: (name) => tagColumnSchema(varchar(name, { length: 256 }).notNull().$type(), schema),
        /**
         * Drizzle column helper for optional foreign key reference columns
         * Configures as varchar(256), nullable, with proper type
         */
        optionalReference: (name) => tagColumnSchema(varchar(name, { length: 256 }).$type(), schema),
        /**
         * Drizzle column helper for foreign key reference with relation
         * Configures as varchar(256), not null, with proper type and foreign key constraint
         */
        foreignKey: (name, referenceFn, options) => tagColumnSchema(varchar(name, { length: 256 }).notNull().$type().references(referenceFn, options), schema),
        /**
         * Drizzle column helper for optional foreign key reference with relation
         * Configures as varchar(256), nullable, with proper type and foreign key constraint
         */
        optionalForeignKey: (name, referenceFn, options) => tagColumnSchema(varchar(name, { length: 256 }).$type().references(referenceFn, options), schema),
        /**
         * Creates a foreign key factory bound to a specific table
         * This allows creating multiple foreign keys to the same table without repeating the reference
         */
        createForeignKeyFactory: (referenceFn) => ({
            required: (name, options) => columns.foreignKey(name, referenceFn, options),
            optional: (name, options) => columns.optionalForeignKey(name, referenceFn, options),
        }),
    };
    return columns;
}
// Re-export drizzle and zod utilities
export * from 'drizzle-orm';
export { createInsertSchema, createSelectSchema, createSchemaFactory, createUpdateSchema } from 'drizzle-orm/zod';
//# sourceMappingURL=id-factory.js.map