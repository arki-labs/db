/**
 * The column kit: a package writes each table once, against a `ColumnKit<D>`,
 * and the app's kit (`pgColumns` from `@arki/db/pg`, `sqliteColumns` from
 * `@arki/db/sqlite`) builds that dialect's real Drizzle table.
 *
 * A column here is a {@link ColumnSpec}: a record of the Drizzle chain the
 * package wrote (`c.text().notNull()`), typed by the dialect `D`. The kit
 * replays it on Drizzle's own builders in `table()`, and {@link TableOf}
 * computes the same type Drizzle gives the hand-written table. A spec is
 * needed because calling Drizzle's builder methods on "the pg builder or the
 * SQLite builder" collapses to a union and loses `D`.
 */
import type { Column, SQL } from 'drizzle-orm';
import type { Instant } from '@arki/date/types';
import type { z } from '@arki/contracts';
import type { JsonStorableSchema } from '@arki/contracts/drizzle';
import type { Dialect } from './dialect.js';
import type { OnDelete } from './id-columns-shared.js';
import type { IdColumnSource } from './id-factory.js';
import type { PgTableOf } from './columns-pg.js';
import type { SqliteTableOf } from './columns-sqlite.js';
import type { InstantColumnConfig } from './temporal.js';
export type { Dialect } from './dialect.js';
/** The column kinds the kit builds. */
export type ColumnKind = 'text' | 'varchar' | 'char' | 'integer' | 'bigint' | 'serial' | 'boolean' | 'json' | 'timestamp' | 'instant' | 'id';
export type TextEnum = [string, ...string[]];
/** What a spec's chain has set so far. Only the type sees these; the runtime keeps {@link ColumnOp}s. */
export type ColumnFlags = {
    type?: unknown;
    enum?: TextEnum;
    notNull?: true;
    primaryKey?: true;
    default?: true;
    defaultFn?: true;
    onUpdate?: true;
};
/** One step of a column's chain, replayed on the dialect's builder in `table()`. */
export type ColumnOp = {
    readonly op: 'notNull';
} | {
    readonly op: 'primaryKey';
} | {
    readonly op: 'default';
    readonly value: unknown;
} | {
    readonly op: 'defaultNow';
} | {
    readonly op: 'defaultFn';
    readonly fn: () => unknown;
} | {
    readonly op: 'onUpdateFn';
    readonly fn: () => unknown;
} | {
    readonly op: 'unique';
    readonly name: string | undefined;
} | {
    readonly op: 'references';
    readonly ref: () => Column;
    readonly onDelete: OnDelete | undefined;
    readonly onUpdate: OnDelete | undefined;
};
/** Everything a dialect needs to build one column. */
export type ColumnDefinition = {
    readonly kind: ColumnKind;
    readonly name: string | undefined;
    readonly enum: readonly [string, ...string[]] | undefined;
    /** `varchar(n)` / `char(n)`; on SQLite it becomes a `CHECK` on `length()`. */
    readonly length: number | undefined;
    readonly withTimezone: boolean | undefined;
    readonly precision: InstantColumnConfig['precision'];
    /** Stamped on the built column, so `@arki/contracts/drizzle` schemas check it at runtime. */
    readonly schema: z.ZodType | undefined;
    readonly ops: readonly ColumnOp[];
};
/** The JS value a column holds, before `$type`. */
type BaseValue<K extends ColumnKind, F extends ColumnFlags> = K extends 'integer' | 'bigint' | 'serial' ? number : K extends 'boolean' ? boolean : K extends 'json' ? unknown : K extends 'timestamp' ? Date : K extends 'instant' ? Instant : F extends {
    enum: infer E extends TextEnum;
} ? E[number] : string;
/** The value `default()` and `$defaultFn()` accept: the `$type` when set, else the kind's value. */
export type ColumnValue<K extends ColumnKind, F extends ColumnFlags> = F extends {
    type: infer T;
} ? T : BaseValue<K, F>;
/**
 * One column, recorded for the kit. Each method returns a new spec; the
 * flags in its type mirror what Drizzle's builder method would add.
 */
/** The flags of a spec nothing has been chained on yet. */
export type NoFlags = Record<never, never>;
export declare class ColumnSpec<D extends Dialect, K extends ColumnKind, F extends ColumnFlags = NoFlags> {
    #private;
    readonly definition: ColumnDefinition;
    /** Type-only: the dialect, kind and flags {@link TableOf} reads. */
    readonly _: {
        readonly dialect: D;
        readonly kind: K;
        readonly flags: F;
    };
    constructor(definition: ColumnDefinition);
    notNull(): ColumnSpec<D, K, F & {
        notNull: true;
    }>;
    primaryKey(): ColumnSpec<D, K, F & {
        primaryKey: true;
    }>;
    default(value: ColumnValue<K, F> | SQL): ColumnSpec<D, K, F & {
        default: true;
    }>;
    /** The database's current time: `defaultNow()` on Postgres, `unixepoch('subsec') * 1000` on SQLite. */
    defaultNow(this: ColumnSpec<D, 'timestamp' | 'instant', F>): ColumnSpec<D, K, F & {
        default: true;
    }>;
    $defaultFn(fn: () => ColumnValue<K, F> | SQL): ColumnSpec<D, K, F & {
        default: true;
        defaultFn: true;
    }>;
    $onUpdateFn(fn: () => ColumnValue<K, F> | SQL): ColumnSpec<D, K, F & {
        onUpdate: true;
    }>;
    /** Narrows the column's TS type, like Drizzle's `$type`; nothing changes at runtime. */
    $type<T>(): ColumnSpec<D, K, Omit<F, 'type'> & {
        type: T;
    }>;
    unique(name?: string): ColumnSpec<D, K, F>;
    /** A foreign key to a column of another kit table. */
    references(ref: () => Column, actions?: {
        onDelete?: OnDelete;
        onUpdate?: OnDelete;
    }): ColumnSpec<D, K, F>;
}
/** A spec of any kind and flags, for constraints. */
export type AnyColumnSpec<D extends Dialect> = ColumnSpec<D, ColumnKind, ColumnFlags>;
/** The enum tuple a text spec carries, or Drizzle's default. */
export type EnumOf<F> = F extends {
    enum: infer E extends TextEnum;
} ? E : TextEnum;
/** The builder Drizzle's own method returns, `this` bound to the concrete builder `B`. */
export type Call<B, M extends string> = B extends Record<M, (...args: never[]) => infer R> ? R : never;
type Step<B, M extends string, On> = On extends true ? Call<B, M> : B;
/**
 * A dialect's base builder `B` after the spec's chain, in the order the kits
 * replay it. `$type` is applied by the dialect first (its helper differs).
 */
export type ApplyFlags<B, F extends ColumnFlags> = Step<Step<Step<Step<Step<B, 'notNull', F['notNull']>, 'primaryKey', F['primaryKey']>, 'default', F['defaultFn'] extends true ? undefined : F['default']>, '$defaultFn', F['defaultFn']>, '$onUpdateFn', F['onUpdate']>;
/**
 * The table a kit builds: for `'pg'`, the type `pgTable(name, columns)` has
 * (`./columns-pg.ts`); for `'sqlite'`, the type `sqliteTable(name, columns)`
 * has (`./columns-sqlite.ts`).
 */
export type TableOf<D extends Dialect, N extends string, C> = D extends 'pg' ? PgTableOf<N, C> : SqliteTableOf<N, C>;
/** A column inside `extras`: an index or constraint takes it, or wraps it with `c.desc()`. */
export type ExtraColumn = Column | SQL | SortedColumn;
/** `c.desc(column)`: index the column in descending order. */
export type SortedColumn = {
    readonly column: Column;
    readonly order: 'desc';
};
/** One index or constraint, built by the dialect inside `table()`. */
export type TableExtra = IndexExtra | {
    readonly extra: 'unique';
    readonly name: string;
    readonly columns: readonly Column[];
} | {
    readonly extra: 'check';
    readonly name: string;
    readonly sql: SQL;
};
/** `c.index(name).on(...).where(...)`. */
export declare class IndexSpec {
    readonly name: string;
    readonly isUnique: boolean;
    constructor(name: string, isUnique: boolean);
    on(...columns: [ExtraColumn, ...ExtraColumn[]]): IndexExtra;
}
/** A built index; `.where()` makes it partial. */
export declare class IndexExtra {
    readonly name: string;
    readonly unique: boolean;
    readonly columns: readonly ExtraColumn[];
    readonly predicate: SQL | undefined;
    readonly extra = "index";
    constructor(name: string, unique: boolean, columns: readonly ExtraColumn[], predicate: SQL | undefined);
    where(predicate: SQL): IndexExtra;
}
/** The columns `extras` receives, keyed like the table's columns. */
export type ExtraColumns<C> = {
    readonly [Key in keyof C]: Column;
};
/** Builds a dialect's table from specs; the dialect kits supply it. */
export type TableBuilder<D extends Dialect> = <N extends string, C extends Record<string, AnyColumnSpec<D>>>(name: N, columns: C, extras?: (columns: ExtraColumns<C>) => TableExtra[]) => TableOf<D, N, C>;
type TextFlags<E> = [E] extends [never] ? NoFlags : {
    enum: E extends readonly [string, ...string[]] ? [...E] : never;
};
/** The id columns of one `defineId` kind, as specs. Same set as `idColumns` in `@arki/db`. */
declare function idSpecs<D extends Dialect, TSchema extends z.ZodType & z.core.$ZodType<string>>(id: IdColumnSource<z.output<NoInfer<TSchema>>> & {
    readonly schema: TSchema;
}): {
    /** Primary key: not null, typed as the id, defaulting to a fresh id. */
    primaryColumn: (name?: string) => ColumnSpec<D, "id", Omit<NoFlags & {
        notNull: true;
    } & {
        primaryKey: true;
    }, "type"> & {
        type: z.output<TSchema>;
    } & {
        default: true;
        defaultFn: true;
    }>;
    /** Nullable id column, null by default. */
    optionalColumn: (name: string) => ColumnSpec<D, "id", Omit<NoFlags, "type"> & {
        type: z.output<TSchema> | null;
    } & {
        default: true;
        defaultFn: true;
    }>;
    /** Not-null id column that defaults to a fresh id. */
    requiredColumn: (name: string) => ColumnSpec<D, "id", Omit<NoFlags & {
        notNull: true;
    }, "type"> & {
        type: z.output<TSchema>;
    } & {
        default: true;
        defaultFn: true;
    }>;
    /** Reference column: not null, typed as the id, no constraint. */
    reference: (name: string) => ColumnSpec<D, "id", Omit<NoFlags & {
        notNull: true;
    }, "type"> & {
        type: z.output<TSchema>;
    }>;
    /** Optional reference column: nullable, typed as the id. */
    optionalReference: (name: string) => ColumnSpec<D, "id", Omit<NoFlags, "type"> & {
        type: z.output<TSchema>;
    }>;
    /** Not-null foreign key with a database constraint. */
    foreignKey: (name: string, ref: () => Column, options?: {
        onDelete?: OnDelete;
    }) => ColumnSpec<D, "id", Omit<NoFlags & {
        notNull: true;
    }, "type"> & {
        type: z.output<TSchema>;
    }>;
    /** Nullable foreign key with a database constraint. */
    optionalForeignKey: (name: string, ref: () => Column, options?: {
        onDelete?: OnDelete;
    }) => ColumnSpec<D, "id", Omit<NoFlags, "type"> & {
        type: z.output<TSchema>;
    }>;
    /** Foreign key factory bound to one column, for several keys to it. */
    createForeignKeyFactory: (ref: () => Column) => {
        required: (name: string, options?: {
            onDelete?: OnDelete;
        }) => ColumnSpec<D, "id", Omit<NoFlags & {
            notNull: true;
        }, "type"> & {
            type: z.output<TSchema>;
        }>;
        optional: (name: string, options?: {
            onDelete?: OnDelete;
        }) => ColumnSpec<D, "id", Omit<NoFlags, "type"> & {
            type: z.output<TSchema>;
        }>;
    };
};
/**
 * The Drizzle builder methods the replay calls. They are declared as methods,
 * so TypeScript compares their parameters loosely and every concrete builder
 * (`PgTextBuilder`, `SQLiteIntegerBuilder`, …) fits. Each Drizzle method
 * updates the builder and returns `this`, so the caller keeps its own,
 * precisely typed reference to the same builder.
 */
export type ReplayBuilder = {
    notNull(): unknown;
    primaryKey(): unknown;
    default(value: unknown): unknown;
    $defaultFn(fn: () => unknown): unknown;
    $onUpdateFn(fn: () => unknown): unknown;
    unique(name?: string): unknown;
    references(ref: () => Column, actions: {
        onDelete?: OnDelete;
        onUpdate?: OnDelete;
    }): unknown;
};
/** Replay a spec's chain on a dialect's builder. `now` is the dialect's current-time default. */
export declare function replayColumn(builder: ReplayBuilder, ops: readonly ColumnOp[], dialect: {
    readonly now: SQL;
    readonly columnOf: (column: Column) => Column;
}): void;
/**
 * The columns one database offers a package's table factory. A factory is
 * generic over the dialect, takes the kit, and returns its tables:
 *
 * @example
 * ```typescript skip="needs a declared id kind"
 * export function noteTables<D extends Dialect>(c: ColumnKit<D>) {
 *   const notes = c.table('notes', {
 *     id: c.id(noteId).primaryColumn(),
 *     title: c.text('title').notNull(),
 *     createdAt: c.timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
 *   });
 *   return { notes };
 * }
 * const tables = noteTables(pgColumns());
 * ```
 */
export type ColumnKit<D extends Dialect> = {
    readonly dialect: D;
    table: TableBuilder<D>;
    text<const E extends readonly [string, ...string[]] = never>(name?: string, options?: {
        readonly enum: E;
    }): ColumnSpec<D, 'text', TextFlags<E>>;
    /** `varchar(n)` on Postgres; `text` with a `length() <= n` check on SQLite. */
    varchar<const E extends readonly [string, ...string[]] = never>(name: string | undefined, options: {
        readonly length: number;
        readonly enum?: E;
    }): ColumnSpec<D, 'varchar', TextFlags<E>>;
    /** `char(n)` on Postgres; `text` with a `length() <= n` check on SQLite. */
    char<const E extends readonly [string, ...string[]] = never>(name: string | undefined, options: {
        readonly length: number;
        readonly enum?: E;
    }): ColumnSpec<D, 'char', TextFlags<E>>;
    integer(name?: string): ColumnSpec<D, 'integer'>;
    /** A 64-bit integer read as a JS `number` (`bigint` mode `'number'` on Postgres). */
    bigint(name?: string): ColumnSpec<D, 'bigint'>;
    /**
     * An auto-incrementing integer primary key, read as a JS `number`: `bigserial` on Postgres,
     * `integer primary key autoincrement` on SQLite. Ids only grow, so a reader can keep a cursor.
     */
    serial(name?: string): ColumnSpec<D, 'serial'>;
    boolean(name?: string): ColumnSpec<D, 'boolean'>;
    /** `jsonb` on Postgres, JSON `text` on SQLite. With a Zod schema, typed and checked by it. */
    json<TSchema extends z.ZodType>(name: string | undefined, schema: JsonStorableSchema<TSchema>): ColumnSpec<D, 'json', {
        type: z.output<TSchema>;
    }>;
    json(name?: string): ColumnSpec<D, 'json'>;
    /** A `Date` column: `timestamp` (± time zone) on Postgres, milliseconds on SQLite. */
    timestamp(name?: string, options?: {
        readonly withTimezone?: boolean;
    }): ColumnSpec<D, 'timestamp'>;
    /** A `Temporal.Instant` column: `@arki/db/temporal`'s `instant` on Postgres, milliseconds on SQLite. */
    instant(name?: string, options?: InstantColumnConfig): ColumnSpec<D, 'instant'>;
    /** The id columns of a `defineId` kind. */
    id<TSchema extends z.ZodType & z.core.$ZodType<string>>(declaration: IdColumnSource<z.output<NoInfer<TSchema>>> & {
        readonly schema: TSchema;
    }): ReturnType<typeof idSpecs<D, TSchema>>;
    index(name: string): IndexSpec;
    uniqueIndex(name: string): IndexSpec;
    unique(name: string): {
        on(...columns: [Column, ...Column[]]): TableExtra;
    };
    check(name: string, sql: SQL): TableExtra;
    desc(column: Column): SortedColumn;
};
/** The shared part of `pgColumns` and `sqliteColumns`: everything but building the table. */
export declare function createColumnKit<D extends Dialect>(dialect: D, table: TableBuilder<D>): ColumnKit<D>;
//# sourceMappingURL=columns.d.ts.map