/**
 * The database's current time as integer milliseconds since the epoch: the
 * SQLite form of Postgres's `now()` for columns the kit stores as milliseconds
 * (`timestamp`, `instant`). One clock for every writer, unlike `Date.now()`.
 */
export declare const sqliteNowMs: import("drizzle-orm").SQL<number>;
//# sourceMappingURL=sqlite-now.d.ts.map