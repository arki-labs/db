/** `sqliteColumns`: the column kit that builds SQLite tables (see `./columns.ts`). */
import type { $Type, BuildColumns } from 'drizzle-orm';
import type { SQLiteBooleanBuilder, SQLiteIntegerBuilder, SQLiteTableWithColumns, SQLiteTextBuilder, SQLiteTextJsonBuilder, SQLiteTimestampBuilder } from 'drizzle-orm/sqlite-core';
import type { ApplyFlags, Call, ColumnFlags, ColumnKind, ColumnKit, ColumnSpec, EnumOf, TextEnum } from './columns.js';
import type { SqliteInstantBuilder } from './sqlite-instant.js';
/** The builder `sqliteBase` makes for each kind. */
type SqliteBase<K extends ColumnKind, F> = {
    text: SQLiteTextBuilder<EnumOf<F>>;
    varchar: SQLiteTextBuilder<EnumOf<F>>;
    char: SQLiteTextBuilder<EnumOf<F>>;
    id: SQLiteTextBuilder<TextEnum>;
    integer: SQLiteIntegerBuilder;
    bigint: SQLiteIntegerBuilder;
    serial: Call<SQLiteIntegerBuilder, 'primaryKey'>;
    boolean: SQLiteBooleanBuilder;
    json: SQLiteTextJsonBuilder;
    timestamp: SQLiteTimestampBuilder;
    instant: SqliteInstantBuilder;
}[K];
type SqliteBuilderOf<K extends ColumnKind, F extends ColumnFlags> = ApplyFlags<F extends {
    type: infer T;
} ? $Type<SqliteBase<K, F>, T> : SqliteBase<K, F>, F>;
/** The type `sqliteTable(name, columns)` gives the specs' replayed builders. */
export type SqliteTableOf<N extends string, C> = SQLiteTableWithColumns<{
    name: N;
    schema: undefined;
    columns: BuildColumns<N, {
        [Key in keyof C]: C[Key] extends ColumnSpec<'sqlite', infer K, infer F> ? SqliteBuilderOf<K, F> : never;
    }, 'sqlite'>;
    dialect: 'sqlite';
}>;
export type SqliteColumnsOptions = {
    /** Put before every table name. SQLite has no schemas, so `pgSchema('auth')` becomes `prefix: 'auth_'`. */
    readonly prefix?: string;
};
/**
 * The column kit for SQLite (libSQL). Postgres-only column types map to
 * their nearest SQLite form: `jsonb` → JSON `text`, timestamps → integer
 * milliseconds, `varchar(n)`/`char(n)` → `text` with a `length()` check.
 *
 * @example
 * ```typescript skip="needs a package table factory"
 * const auth = createAuthTables(sqliteColumns({ prefix: 'auth_' }), options);
 * ```
 */
export declare function sqliteColumns(options?: SqliteColumnsOptions): ColumnKit<'sqlite'>;
export {};
//# sourceMappingURL=columns-sqlite.d.ts.map