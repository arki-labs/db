var _a;
import { jsonStorageSchema } from '@arki/contracts/drizzle';
import { orThrow } from '@arki/failure';
export class ColumnSpec {
    definition;
    constructor(definition) {
        this.definition = definition;
    }
    #with(op) {
        return new _a({ ...this.definition, ops: [...this.definition.ops, op] });
    }
    notNull() {
        return this.#with({ op: 'notNull' });
    }
    primaryKey() {
        return this.#with({ op: 'primaryKey' });
    }
    default(value) {
        return this.#with({ op: 'default', value });
    }
    /** The database's current time: `defaultNow()` on Postgres, `unixepoch('subsec') * 1000` on SQLite. */
    defaultNow() {
        return new _a({
            ...this.definition,
            ops: [...this.definition.ops, { op: 'defaultNow' }],
        });
    }
    $defaultFn(fn) {
        return this.#with({ op: 'defaultFn', fn });
    }
    $onUpdateFn(fn) {
        return this.#with({ op: 'onUpdateFn', fn });
    }
    /** Narrows the column's TS type, like Drizzle's `$type`; nothing changes at runtime. */
    $type() {
        return new _a(this.definition);
    }
    unique(name) {
        return this.#with({ op: 'unique', name });
    }
    /** A foreign key to a column of another kit table. */
    references(ref, actions) {
        return this.#with({ op: 'references', ref, onDelete: actions?.onDelete, onUpdate: actions?.onUpdate });
    }
}
_a = ColumnSpec;
/** `c.index(name).on(...).where(...)`. */
export class IndexSpec {
    name;
    isUnique;
    constructor(name, isUnique) {
        this.name = name;
        this.isUnique = isUnique;
    }
    on(...columns) {
        return new IndexExtra(this.name, this.isUnique, columns, undefined);
    }
}
/** A built index; `.where()` makes it partial. */
export class IndexExtra {
    name;
    unique;
    columns;
    predicate;
    extra = 'index';
    constructor(name, unique, columns, predicate) {
        this.name = name;
        this.unique = unique;
        this.columns = columns;
        this.predicate = predicate;
    }
    where(predicate) {
        return new IndexExtra(this.name, this.unique, this.columns, predicate);
    }
}
/** The id columns of one `defineId` kind, as specs. Same set as `idColumns` in `@arki/db`. */
function idSpecs(id) {
    const { schema, create } = id;
    const base = (name) => new ColumnSpec(definition('id', name, { schema }));
    // Drizzle requires a scalar default; its foreign callback cannot return a Failure.
    const fresh = () => orThrow(create());
    const columns = {
        /** Primary key: not null, typed as the id, defaulting to a fresh id. */
        primaryColumn: (name = 'id') => base(name).notNull().primaryKey().$type().$defaultFn(fresh),
        /** Nullable id column, null by default. */
        optionalColumn: (name) => base(name)
            .$type()
            .$defaultFn(() => null),
        /** Not-null id column that defaults to a fresh id. */
        requiredColumn: (name) => base(name).notNull().$type().$defaultFn(fresh),
        /** Reference column: not null, typed as the id, no constraint. */
        reference: (name) => base(name).notNull().$type(),
        /** Optional reference column: nullable, typed as the id. */
        optionalReference: (name) => base(name).$type(),
        /** Not-null foreign key with a database constraint. */
        foreignKey: (name, ref, options) => base(name).notNull().$type().references(ref, options),
        /** Nullable foreign key with a database constraint. */
        optionalForeignKey: (name, ref, options) => base(name).$type().references(ref, options),
        /** Foreign key factory bound to one column, for several keys to it. */
        createForeignKeyFactory: (ref) => ({
            required: (name, options) => columns.foreignKey(name, ref, options),
            optional: (name, options) => columns.optionalForeignKey(name, ref, options),
        }),
    };
    return columns;
}
/** Replay a spec's chain on a dialect's builder. `now` is the dialect's current-time default. */
export function replayColumn(builder, ops, dialect) {
    for (const step of ops) {
        switch (step.op) {
            case 'notNull': {
                builder.notNull();
                break;
            }
            case 'primaryKey': {
                builder.primaryKey();
                break;
            }
            case 'default': {
                builder.default(step.value);
                break;
            }
            case 'defaultNow': {
                builder.default(dialect.now);
                break;
            }
            case 'defaultFn': {
                builder.$defaultFn(step.fn);
                break;
            }
            case 'onUpdateFn': {
                builder.$onUpdateFn(step.fn);
                break;
            }
            case 'unique': {
                builder.unique(step.name);
                break;
            }
            case 'references': {
                builder.references(() => dialect.columnOf(step.ref()), { onDelete: step.onDelete, onUpdate: step.onUpdate });
                break;
            }
        }
    }
}
function definition(kind, name, extra = {}) {
    return {
        kind,
        name,
        enum: undefined,
        length: undefined,
        withTimezone: undefined,
        precision: undefined,
        schema: undefined,
        ops: [],
        ...extra,
    };
}
/** The shared part of `pgColumns` and `sqliteColumns`: everything but building the table. */
export function createColumnKit(dialect, table) {
    function json(name, schema) {
        return new ColumnSpec(definition('json', name, { schema: schema && jsonStorageSchema(schema) }));
    }
    return {
        dialect,
        table,
        text: (name, options) => new ColumnSpec(definition('text', name, { enum: options?.enum })),
        varchar: (name, options) => new ColumnSpec(definition('varchar', name, { enum: options.enum, length: options.length })),
        char: (name, options) => new ColumnSpec(definition('char', name, { enum: options.enum, length: options.length })),
        integer: (name) => new ColumnSpec(definition('integer', name)),
        bigint: (name) => new ColumnSpec(definition('bigint', name)),
        serial: (name) => new ColumnSpec(definition('serial', name)),
        boolean: (name) => new ColumnSpec(definition('boolean', name)),
        json,
        timestamp: (name, options) => new ColumnSpec(definition('timestamp', name, { withTimezone: options?.withTimezone })),
        instant: (name, options) => new ColumnSpec(definition('instant', name, { withTimezone: options?.withTimezone, precision: options?.precision })),
        id: (declaration) => idSpecs(declaration),
        index: (name) => new IndexSpec(name, false),
        uniqueIndex: (name) => new IndexSpec(name, true),
        unique: (name) => ({ on: (...columns) => ({ extra: 'unique', name, columns }) }),
        check: (name, sql) => ({ extra: 'check', name, sql }),
        desc: (column) => ({ column, order: 'desc' }),
    };
}
//# sourceMappingURL=columns.js.map