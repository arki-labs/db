/**
 * Postgres columns that read and write `@arki/date` values instead of `Date`.
 *
 * - `plainDate(name)` — a `date` column ↔ `PlainDate`: a calendar date with no
 *   time and no zone, so nothing can shift it across midnight.
 * - `instant(name)` — a `timestamp with time zone` column ↔ `Instant`.
 * - `instant(name, { withTimezone: false })` — an existing `timestamp` column
 *   ↔ `Instant`, with the stored wall clock read as UTC. This is Drizzle's own
 *   convention for `timestamp(name)`, so switching a column to it changes the
 *   TypeScript type and nothing in the database.
 *
 * Both columns declare Drizzle's `:string` codecs, so every driver (node-postgres,
 * postgres.js, PGlite, Bun SQL) hands back Postgres text and one strict parser
 * covers them all. Values Temporal cannot hold (`infinity`, BC dates) throw a
 * `RangeError` instead of becoming a wrong date.
 *
 * A raw `sql` selection mapped with `.mapWith(column)` skips the codec, and Bun
 * SQL then returns a `Date`. That is accepted too: Bun reads `timestamptz` as
 * the exact moment, `timestamp` as its UTC wall clock and `date` as UTC
 * midnight, the same meanings the text parser uses (milliseconds only).
 *
 * There is no `ZonedDateTime` column: Postgres stores no zone. Keep the zone in
 * its own `text` column and project on read with `zoned(instant, zone)`.
 */
import type { Instant, PlainDate } from '@arki/date/types';
import { Temporal } from '@arki/date/types';
/** `PlainDate` → `YYYY-MM-DD`. */
export declare function plainDateToDriver(value: PlainDate): string;
/** Postgres `date` text (or a `Date` at UTC midnight, from Bun SQL) → `PlainDate`. */
export declare function plainDateFromDriver(text: string | Date): PlainDate;
/** `Instant` → ISO text with `Z`. A `timestamp` column ignores the suffix and stores the UTC wall clock. */
export declare function instantToDriver(value: Instant): string;
/**
 * Postgres `timestamptz` or `timestamp` text → `Instant`. The two are told apart
 * by format, not guessed: `timestamptz` text always ends in an offset and
 * `timestamp` text never does; the latter is read as UTC. A `Date` (Bun SQL,
 * raw selections) is taken as the exact moment it holds.
 */
export declare function instantFromDriver(text: string | Date): Instant;
/** A `date` column holding a `PlainDate`. */
export declare const plainDate: {
    <TConfig extends Record<string, any> & unknown>(fieldConfig?: TConfig | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.PlainDate;
        driverParam: string;
    }>;
    (dbName: string, fieldConfig?: unknown): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.PlainDate;
        driverParam: string;
    }>;
};
export type InstantColumnConfig = Readonly<{
    /** `true` (default): `timestamp with time zone`. `false`: an existing `timestamp` column, read as UTC. */
    withTimezone?: boolean;
    /** Fractional-second digits stored, 0–6. Default: Postgres's 6. */
    precision?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}>;
/** A `timestamp with time zone` (or, opted in, `timestamp`) column holding an `Instant`. */
export declare const instant: {
    <TConfig extends Record<string, any> & Readonly<{
        /** `true` (default): `timestamp with time zone`. `false`: an existing `timestamp` column, read as UTC. */
        withTimezone?: boolean;
        /** Fractional-second digits stored, 0–6. Default: Postgres's 6. */
        precision?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    }>>(fieldConfig?: TConfig | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.Instant;
        driverParam: string;
    }>;
    (dbName: string, fieldConfig?: Readonly<{
        /** `true` (default): `timestamp with time zone`. `false`: an existing `timestamp` column, read as UTC. */
        withTimezone?: boolean;
        /** Fractional-second digits stored, 0–6. Default: Postgres's 6. */
        precision?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    }> | undefined): import("drizzle-orm/pg-core").PgCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.Instant;
        driverParam: string;
    }>;
};
//# sourceMappingURL=temporal.d.ts.map