/** SQLite's `instant` column: a `Temporal.Instant` stored as integer milliseconds since the epoch. */
import { customType } from 'drizzle-orm/sqlite-core';
import { Temporal } from '@arki/date/types';
import { UnexpectedFailure } from '@arki/failure';
import { StoredValueUnreadable } from './errors.js';
/**
 * Milliseconds → `Instant`. NaN or out-of-range stored values cannot become a date; Drizzle's `fromDriver`
 * cannot return a failure, so this throws an `UnexpectedFailure` whose `failure` is `StoredValueUnreadable`.
 */
export function instantFromMilliseconds(milliseconds) {
    try {
        return Temporal.Instant.fromEpochMilliseconds(milliseconds);
    }
    catch (error) {
        throw new UnexpectedFailure(StoredValueUnreadable({ kind: 'sqlite_instant' }, { cause: error }));
    }
}
/**
 * An `integer` column holding an `Instant` at millisecond precision, the
 * SQLite form of `@arki/db/temporal`'s `instant`. Sub-millisecond digits are
 * dropped on write.
 */
export const instant = customType({
    dataType: () => 'integer',
    toDriver: (value) => value.epochMilliseconds,
    fromDriver: instantFromMilliseconds,
});
//# sourceMappingURL=sqlite-instant.js.map