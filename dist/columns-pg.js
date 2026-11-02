import { is, SQL, sql } from 'drizzle-orm';
import { bigint, bigserial, boolean, char, check, ExtraConfigColumn, index, integer, jsonb, PgColumn, pgTable, text, timestamp, unique, uniqueIndex, varchar, } from 'drizzle-orm/pg-core';
import { invariant } from '@arki/failure';
import { createColumnKit, replayColumn } from './columns.js';
import { tagColumnSchema } from './id-columns-shared.js';
import { instant } from './temporal.js';
/**
 * The column kit for Postgres. With a schema, tables go in it
 * (`schema.table`); without one, in the search path (`pgTable`).
 *
 * @example
 * ```typescript skip="needs a package table factory"
 * const auth = createAuthTables(pgColumns(pgSchema('auth')), options);
 * ```
 */
export function pgColumns(schema) {
    // The overloads above carry the computed type; Drizzle's own `pgTable` does the same.
    function table(name, columns, extras) {
        const builders = Object.fromEntries(Object.entries(columns).map(([key, spec]) => [key, pgColumn(spec.definition)]));
        const extraConfig = extras && ((self) => extras(self).map((extra) => pgExtra(extra)));
        return schema ? schema.table(name, builders, extraConfig) : pgTable(name, builders, extraConfig);
    }
    return createColumnKit('pg', table);
}
function pgBase(definition) {
    // Drizzle names a column '' until the table gives it its key.
    const name = definition.name ?? '';
    const { enum: values, length } = definition;
    switch (definition.kind) {
        case 'text': {
            return values ? text(name, { enum: values }) : text(name);
        }
        case 'varchar': {
            return values ? varchar(name, { length, enum: values }) : varchar(name, { length });
        }
        case 'char': {
            return values ? char(name, { length, enum: values }) : char(name, { length });
        }
        case 'id': {
            return varchar(name, { length: 256 });
        }
        case 'integer': {
            return integer(name);
        }
        case 'bigint': {
            return bigint(name, { mode: 'number' });
        }
        case 'serial': {
            return bigserial(name, { mode: 'number' }).primaryKey();
        }
        case 'boolean': {
            return boolean(name);
        }
        case 'json': {
            return jsonb(name);
        }
        case 'timestamp': {
            return timestamp(name, { withTimezone: definition.withTimezone, mode: 'date' });
        }
        case 'instant': {
            return instant(name, { withTimezone: definition.withTimezone, precision: definition.precision });
        }
    }
}
function pgColumn(definition) {
    const builder = pgBase(definition);
    // What Drizzle's `defaultNow()` emits; the custom `instant` column has no such method.
    replayColumn(builder, definition.ops, { now: sql `now()`, columnOf: pgColumnOf });
    return definition.schema ? tagColumnSchema(builder, definition.schema) : builder;
}
function pgColumnOf(column) {
    invariant(is(column, PgColumn), () => `@arki/db/pg: column "${column.name}" belongs to a SQLite table, not a Postgres one.`);
    return column;
}
function pgIndexColumn(column) {
    if (is(column, SQL))
        return column;
    if ('order' in column) {
        invariant(is(column.column, ExtraConfigColumn), '@arki/db/pg: `c.desc()` takes a column of the table being defined.');
        return column.column.desc();
    }
    return pgColumnOf(column);
}
function pgExtra(extra) {
    switch (extra.extra) {
        case 'index': {
            const [first, ...rest] = extra.columns.map((column) => pgIndexColumn(column));
            invariant(first, `@arki/db/pg: index "${extra.name}" has no columns.`);
            const built = (extra.unique ? uniqueIndex : index)(extra.name).on(first, ...rest);
            return extra.predicate ? built.where(extra.predicate) : built;
        }
        case 'unique': {
            const [first, ...rest] = extra.columns.map((column) => pgColumnOf(column));
            invariant(first, `@arki/db/pg: unique constraint "${extra.name}" has no columns.`);
            return unique(extra.name).on(first, ...rest);
        }
        case 'check': {
            return check(extra.name, extra.sql);
        }
    }
}
//# sourceMappingURL=columns-pg.js.map