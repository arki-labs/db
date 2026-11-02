import type { PgBigInt53Builder, PgBigSerial53Builder, PgBooleanBuilder, PgBuildColumns, PgCharBuilder, PgIntegerBuilder, PgJsonbBuilder, PgSchema, PgTableWithColumns, PgTextBuilder, PgTimestampBuilder, PgVarcharBuilder, Set$Type } from 'drizzle-orm/pg-core';
import type { ApplyFlags, Call, ColumnFlags, ColumnKind, ColumnKit, ColumnSpec, EnumOf } from './columns.js';
import type { PgInstantBuilder } from './temporal.js';
/** The builder `pgBase` makes for each kind. */
type PgBase<K extends ColumnKind, F> = {
    text: PgTextBuilder<EnumOf<F>>;
    varchar: PgVarcharBuilder<EnumOf<F>>;
    char: PgCharBuilder<EnumOf<F>>;
    id: PgVarcharBuilder;
    integer: PgIntegerBuilder;
    bigint: PgBigInt53Builder;
    serial: Call<PgBigSerial53Builder, 'primaryKey'>;
    boolean: PgBooleanBuilder;
    json: PgJsonbBuilder;
    timestamp: PgTimestampBuilder;
    instant: PgInstantBuilder;
}[K];
type PgBuilderOf<K extends ColumnKind, F extends ColumnFlags> = ApplyFlags<F extends {
    type: infer T;
} ? Set$Type<PgBase<K, F>, T> : PgBase<K, F>, F>;
/** The type `pgTable(name, columns)` gives the specs' replayed builders. The schema name is not kept as a literal. */
export type PgTableOf<N extends string, C> = PgTableWithColumns<{
    name: N;
    schema: string | undefined;
    columns: PgBuildColumns<N, {
        [Key in keyof C]: C[Key] extends ColumnSpec<'pg', infer K, infer F> ? PgBuilderOf<K, F> : never;
    }>;
    dialect: 'pg';
}>;
/**
 * The column kit for Postgres. With a schema, tables go in it
 * (`schema.table`); without one, in the search path (`pgTable`).
 *
 * @example
 * ```typescript skip="needs a package table factory"
 * const auth = createAuthTables(pgColumns(pgSchema('auth')), options);
 * ```
 */
export declare function pgColumns(schema?: PgSchema): ColumnKit<'pg'>;
export {};
//# sourceMappingURL=columns-pg.d.ts.map