/**
 * Finding the database error inside whatever was thrown, as a SQL-standard
 * SQLSTATE. Private to the package: `errors.ts` and `transaction.ts` both read
 * errors through it.
 *
 * Drivers disagree on where the code goes. node-postgres and PGlite put the
 * SQLSTATE in `code`. Bun SQL puts `ERR_POSTGRES_SERVER_ERROR` in `code` and the
 * SQLSTATE in `errno`. SQLite has no SQLSTATE: its drivers put a `SQLITE_*` name
 * (or node:sqlite's `ERR_SQLITE_ERROR`) in `code` and the extended result code in
 * `rawCode` (libSQL), `errcode` (node:sqlite) or `errno` (bun:sqlite), which
 * {@link SQLITE_SQLSTATE} translates. Drizzle wraps all of them in
 * `DrizzleQueryError`, which has no `code` and keeps the driver error as `cause`.
 */
/** The facts a caller decides on: the SQLSTATE and, when Postgres named one, the constraint. */
export type DatabaseErrorFacts = {
    readonly sqlState: string;
    readonly constraint: string | undefined;
};
/**
 * Walks `error`, then its `cause`, and stops at the FIRST object with a string
 * `code`: that object decides. Its SQLSTATE is `errno` (Bun) or else `code`
 * (node-postgres, PGlite), or the translated SQLite code. So a
 * `DrizzleQueryError` defers to the driver error inside it, while an
 * `ORPCError('CONFLICT')` or an `ECONNRESET` is final even when a database error
 * sits deeper. Messages are never matched. A cycle, a deep chain, a throwing
 * getter or an `AggregateError` gives `undefined`. SQLite names columns, not
 * constraints, so a SQLite error never has a `constraint`.
 */
export declare function findDatabaseError(error: unknown): DatabaseErrorFacts | undefined;
//# sourceMappingURL=sql-state.d.ts.map