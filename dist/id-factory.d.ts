/** Prefixed id generators and `idColumns` for ids declared with `defineId`. */
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { IdGenerationFailure, z } from '@arki/contracts';
import { createIdBody } from '@arki/contracts';
import type { OnDelete } from './id-columns-shared.js';
export type { OnDelete } from './id-columns-shared.js';
/** Generate an unprefixed legacy ID, or the canonical entropy failure. */
export declare const createId: typeof createIdBody;
/** Preserve the supplied prefix exactly, including legacy empty or non-word prefixes. */
export declare const createPrefixedId: <T extends string>(prefix: T) => `${T}${string}` | IdGenerationFailure;
/**
 * What the column helpers need from an id kind: its schema (stamped on every
 * column, so `@arki/contracts/drizzle` schemas check the prefix at runtime)
 * and its generator (the default of generated columns). `defineId('sty_')`
 * from `@arki/contracts` has both.
 */
export type IdColumnSource<TId extends string> = {
    readonly schema: z.ZodType & z.core.$ZodType<TId>;
    readonly create: () => TId | IdGenerationFailure;
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
export declare function idColumns<TSchema extends z.ZodType & z.core.$ZodType<string>>(id: IdColumnSource<z.output<NoInfer<TSchema>>> & {
    readonly schema: TSchema;
}): {
    /**
     * Drizzle column helper for primary key columns
     * Automatically configures as varchar(256), not null, primary key, with proper type and default
     */
    primaryColumn: (name?: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>>, z.output<TSchema>>>;
    optionalColumn: (name: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, z.output<TSchema> | null>>;
    requiredColumn: (name: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, z.output<TSchema>>>;
    /**
     * Drizzle column helper for foreign key reference columns
     * Configures as varchar(256), not null, with proper type (no default or primary key)
     */
    reference: (name: string) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, z.output<TSchema>>;
    /**
     * Drizzle column helper for optional foreign key reference columns
     * Configures as varchar(256), nullable, with proper type
     */
    optionalReference: (name: string) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, z.output<TSchema>>;
    /**
     * Drizzle column helper for foreign key reference with relation
     * Configures as varchar(256), not null, with proper type and foreign key constraint
     */
    foreignKey: (name: string, referenceFn: () => PgColumn, options?: {
        onDelete?: OnDelete;
    }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, z.output<TSchema>>;
    /**
     * Drizzle column helper for optional foreign key reference with relation
     * Configures as varchar(256), nullable, with proper type and foreign key constraint
     */
    optionalForeignKey: (name: string, referenceFn: () => PgColumn, options?: {
        onDelete?: OnDelete;
    }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, z.output<TSchema>>;
    /**
     * Creates a foreign key factory bound to a specific table
     * This allows creating multiple foreign keys to the same table without repeating the reference
     */
    createForeignKeyFactory: (referenceFn: () => PgColumn) => {
        required: (name: string, options?: {
            onDelete?: OnDelete;
        }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, z.output<TSchema>>;
        optional: (name: string, options?: {
            onDelete?: OnDelete;
        }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, z.output<TSchema>>;
    };
};
export * from 'drizzle-orm';
export { createInsertSchema, createSelectSchema, createSchemaFactory, createUpdateSchema } from 'drizzle-orm/zod';
//# sourceMappingURL=id-factory.d.ts.map