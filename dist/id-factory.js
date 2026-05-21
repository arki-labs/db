import { createId as createCuid } from '@paralleldrive/cuid2';
import { varchar } from 'drizzle-orm/pg-core';
import { COLUMN_ZOD_SCHEMA, z } from '@arki/contracts';
// Core ID creation
export const createId = () => createCuid();
export const createPrefixedId = (prefix) => {
    return `${prefix}${createId()}`;
};
/**
 * Stash a Zod schema on a Drizzle column builder so that
 * `@arki/contracts`'s `createSelectSchema`/`createInsertSchema`/`createUpdateSchema`
 * wrappers auto-apply it as a refine — turning the brand from a phantom-only
 * type into a real runtime check.
 *
 * The builder's `config` object is the SAME reference passed to the constructed
 * column (see `PgVarcharBuilder.build` → `new PgVarchar(table, this.config)`),
 * so writing here is readable from the column later.
 */
function tagColumnSchema(builder, schema) {
    const cfg = builder.config;
    cfg[COLUMN_ZOD_SCHEMA] = schema;
    return builder;
}
/**
 * Type-safe ID factory that generates all ID-related utilities at once
 *
 * @param prefix - The prefix for the ID type (e.g., 'pt', 'usr', 'ant')
 * @returns An object with create function, schema, and column helpers
 *
 * @example
 * ```typescript
 * export type PoetId = `pt${string}`;
 * const poetId = createIdFactory<'pt', PoetId>('pt');
 *
 * export const createPoetId = poetId.create;
 * export const poetIdSchema = poetId.schema;
 *
 * export const poets = schema.table('poets', {
 *   id: poetId.primaryColumn(),
 *   // ... other columns
 * });
 * ```
 */
export function createIdFactory(prefix) {
    /**
     * Zod validation schema for the ID type. Uses refine instead of transform
     * for better type safety; auto-applied at parse time by @arki/contracts'
     * schema wrappers when this factory's columns appear on the table.
     */
    const schema = z
        .string()
        .startsWith(prefix)
        .brand()
        .transform(id => id);
    const factory = {
        /**
         * Creates a new ID with the specified prefix
         */
        create: () => createPrefixedId(prefix),
        /**
         * Creates a new ID with the specified prefix
         */
        make: () => createPrefixedId(prefix),
        /**
         * Creates a new ID with the specified prefix
         */
        new: () => createPrefixedId(prefix),
        schema,
        /**
         * Drizzle column helper for primary key columns
         * Automatically configures as varchar(256), not null, primary key, with proper type and default
         */
        primaryColumn: (name = 'id') => tagColumnSchema(varchar(name, { length: 256 })
            .notNull()
            .primaryKey()
            .$type()
            .$defaultFn(() => createPrefixedId(prefix)), schema),
        optionalColumn: (name) => tagColumnSchema(varchar(name, { length: 256 })
            .$type()
            .$defaultFn(() => null), schema),
        requiredColumn: (name) => tagColumnSchema(varchar(name, { length: 256 })
            .notNull()
            .$type()
            .$defaultFn(() => createPrefixedId(prefix)), schema),
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
            required: (name, options) => factory.foreignKey(name, referenceFn, options),
            optional: (name, options) => factory.optionalForeignKey(name, referenceFn, options),
        }),
    };
    return factory;
}
// Re-export drizzle and zod utilities
export * from 'drizzle-orm';
export { createInsertSchema, createSelectSchema, createSchemaFactory, createUpdateSchema } from 'drizzle-orm/zod';
//# sourceMappingURL=id-factory.js.map