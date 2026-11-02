/** The `@arki/db/sqlite` entry: Drizzle's SQLite column API plus `idColumns` for ids declared with `defineId`. */
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { z } from '@arki/contracts';
import type { OnDelete } from './id-columns-shared.js';
import type { IdColumnSource } from './id-factory.js';
export type { OnDelete } from './id-columns-shared.js';
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
export declare function idColumns<TSchema extends z.ZodType & z.core.$ZodType<string>>(id: IdColumnSource<z.output<NoInfer<TSchema>>> & {
    readonly schema: TSchema;
}): {
    /** Primary key column: text, not null, typed as the id, defaulting to a fresh id. */
    primaryColumn: (name?: string) => import("drizzle-orm/column-builder").HasRuntimeDefault<import("drizzle-orm/column-builder").HasDefault<import("drizzle-orm/column-builder").$Type<import("drizzle-orm/column-builder").IsPrimaryKey<import("drizzle-orm/column-builder").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>>>, z.output<TSchema>>>>;
    /** Nullable id column, null by default. */
    optionalColumn: (name: string) => import("drizzle-orm/column-builder").HasRuntimeDefault<import("drizzle-orm/column-builder").HasDefault<import("drizzle-orm/column-builder").$Type<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>, z.output<TSchema> | null>>>;
    /** Not-null id column that defaults to a fresh id. */
    requiredColumn: (name: string) => import("drizzle-orm/column-builder").HasRuntimeDefault<import("drizzle-orm/column-builder").HasDefault<import("drizzle-orm/column-builder").$Type<import("drizzle-orm/column-builder").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>>, z.output<TSchema>>>>;
    /** Reference column: text, not null, typed as the id (no default, no constraint). */
    reference: (name: string) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/column-builder").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>>, z.output<TSchema>>;
    /** Optional reference column: text, nullable, typed as the id. */
    optionalReference: (name: string) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>, z.output<TSchema>>;
    /** Not-null foreign key column with a database constraint. */
    foreignKey: (name: string, referenceFn: () => SQLiteColumn, options?: {
        onDelete?: OnDelete;
    }) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/column-builder").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>>, z.output<TSchema>>;
    /** Nullable foreign key column with a database constraint. */
    optionalForeignKey: (name: string, referenceFn: () => SQLiteColumn, options?: {
        onDelete?: OnDelete;
    }) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>, z.output<TSchema>>;
    /** Foreign key factory bound to one table, for several keys to the same column. */
    createForeignKeyFactory: (referenceFn: () => SQLiteColumn) => {
        required: (name: string, options?: {
            onDelete?: OnDelete;
        }) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/column-builder").NotNull<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>>, z.output<TSchema>>;
        optional: (name: string, options?: {
            onDelete?: OnDelete;
        }) => import("drizzle-orm/column-builder").$Type<import("drizzle-orm/sqlite-core").SQLiteTextBuilder<[string, ...string[]]>, z.output<TSchema>>;
    };
};
export * from 'drizzle-orm/sqlite-core';
export type { SqliteColumnsOptions, SqliteTableOf } from './columns-sqlite.js';
export { sqliteColumns } from './columns-sqlite.js';
export { instant } from './sqlite-instant.js';
export { sqliteNowMs } from './sqlite-now.js';
export { unrefTimer } from './timers.js';
//# sourceMappingURL=sqlite.d.ts.map