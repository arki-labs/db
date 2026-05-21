import type { PgColumn } from 'drizzle-orm/pg-core';
import { z } from '@arki/contracts';
export declare const createId: () => string;
export declare const createPrefixedId: <T extends string>(prefix: T) => `${T}${string}`;
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
export declare function createIdFactory<TPrefix extends string, TId extends `${TPrefix}${string}`>(prefix: TPrefix): {
    /**
     * Creates a new ID with the specified prefix
     */
    create: () => TId;
    /**
     * Creates a new ID with the specified prefix
     */
    make: () => TId;
    /**
     * Creates a new ID with the specified prefix
     */
    new: () => TId;
    schema: z.ZodPipe<z.ZodString, z.ZodTransform<Awaited<TId>, string>> | z.ZodPipe<z.core.$ZodBranded<z.ZodString, TId, "out">, z.ZodTransform<Awaited<TId>, string & z.core.$brand<TId>>>;
    /**
     * Drizzle column helper for primary key columns
     * Automatically configures as varchar(256), not null, primary key, with proper type and default
     */
    primaryColumn: (name?: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetIsPrimaryKey<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>>, TId>>;
    optionalColumn: (name: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, TId | null>>;
    requiredColumn: (name: string) => import("drizzle-orm/pg-core").SetHasRuntimeDefault<import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, TId>>;
    /**
     * Drizzle column helper for foreign key reference columns
     * Configures as varchar(256), not null, with proper type (no default or primary key)
     */
    reference: (name: string) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, TId>;
    /**
     * Drizzle column helper for optional foreign key reference columns
     * Configures as varchar(256), nullable, with proper type
     */
    optionalReference: (name: string) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, TId>;
    /**
     * Drizzle column helper for foreign key reference with relation
     * Configures as varchar(256), not null, with proper type and foreign key constraint
     */
    foreignKey: (name: string, referenceFn: () => PgColumn, options?: {
        onDelete?: "cascade" | "restrict" | "no action" | "set null" | "set default";
    }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, TId>;
    /**
     * Drizzle column helper for optional foreign key reference with relation
     * Configures as varchar(256), nullable, with proper type and foreign key constraint
     */
    optionalForeignKey: (name: string, referenceFn: () => PgColumn, options?: {
        onDelete?: "cascade" | "restrict" | "no action" | "set null" | "set default";
    }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, TId>;
    /**
     * Creates a foreign key factory bound to a specific table
     * This allows creating multiple foreign keys to the same table without repeating the reference
     */
    createForeignKeyFactory: (referenceFn: () => PgColumn) => {
        required: (name: string, options?: {
            onDelete?: "cascade" | "restrict" | "no action" | "set null" | "set default";
        }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").SetNotNull<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>>, TId>;
        optional: (name: string, options?: {
            onDelete?: "cascade" | "restrict" | "no action" | "set null" | "set default";
        }) => import("drizzle-orm/pg-core").Set$Type<import("drizzle-orm/pg-core").PgVarcharBuilder<[string, ...string[]]>, TId>;
    };
};
export * from 'drizzle-orm';
export { createInsertSchema, createSelectSchema, createSchemaFactory, createUpdateSchema } from 'drizzle-orm/zod';
//# sourceMappingURL=id-factory.d.ts.map