import type { Instant } from '@arki/date/types';
import { Temporal } from '@arki/date/types';
/**
 * Milliseconds → `Instant`. NaN or out-of-range stored values cannot become a date; Drizzle's `fromDriver`
 * cannot return a failure, so this throws an `UnexpectedFailure` whose `failure` is `StoredValueUnreadable`.
 */
export declare function instantFromMilliseconds(milliseconds: number): Instant;
/**
 * An `integer` column holding an `Instant` at millisecond precision, the
 * SQLite form of `@arki/db/temporal`'s `instant`. Sub-millisecond digits are
 * dropped on write.
 */
export declare const instant: {
    (): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.Instant;
        driverParam: number;
    }>;
    <TConfig extends Record<string, any> & unknown>(fieldConfig?: TConfig | undefined): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.Instant;
        driverParam: number;
    }>;
    (dbname: string, fieldConfig?: unknown): import("drizzle-orm/sqlite-core").SQLiteCustomColumnBuilder<{
        dataType: 'custom';
        data: Temporal.Instant;
        driverParam: number;
    }>;
};
/** The builder `instant(name)` returns. */
export type SqliteInstantBuilder = ReturnType<typeof instant>;
//# sourceMappingURL=sqlite-instant.d.ts.map