export type { DatabaseErrorFacts } from './sql-state.js';
/** The SQL-standard SQLSTATE (and constraint, on Postgres) of a database error, on either dialect. */
export { findDatabaseError } from './sql-state.js';
/**
 * True when the database refused a write because a unique index already holds
 * the value: the "insert, and answer CONFLICT on a duplicate" check. Pass
 * `constraint` to match one named index only.
 *
 * @example
 * try {
 *   await db.insert(Source).values(row);
 * } catch (error) {
 *   if (isUniqueViolation(error, 'idx_sources_user_sender')) throw new ORPCError('CONFLICT');
 *   throw error;
 * }
 */
export declare function isUniqueViolation(error: unknown, constraint?: string): boolean;
/**
 * PostgreSQL aborted every allowed attempt with a serialization conflict or deadlock.
 * @fix Shorten transactions or retry the operation later.
 * @verify bun run test -- src/transaction.pg.test.ts
 */
export declare const TransactionConflict: import("@arki/failure").FailureDefinition<"db.transaction_conflict", import("@standard-schema/spec").StandardSchemaV1<{
    attempts: number;
    sqlState: "40001" | "40P01";
}, {
    attempts: number;
    sqlState: "40001" | "40P01";
}>>;
/**
 * The driver could not execute the transaction because its connection failed.
 * @fix Inspect the private cause and restore database connectivity.
 * @verify bun run test -- src/transaction.test.ts
 */
export declare const TransactionUnavailable: import("@arki/failure").FailureDefinition<"db.transaction_unavailable", undefined>;
/**
 * PostgreSQL explicitly rejected a statement or COMMIT, including constraint violations.
 * @fix Correct the write using the SQLSTATE; this does not imply a transient outage.
 * @verify bun run test -- src/transaction.pg.test.ts
 */
export declare const TransactionRejected: import("@arki/failure").FailureDefinition<"db.transaction_rejected", import("@standard-schema/spec").StandardSchemaV1<{
    sqlState: string;
}, {
    sqlState: string;
}>>;
/**
 * Work completed but the driver did not confirm COMMIT; writes may already be durable.
 * @fix Reconcile using an idempotency key or durable receipt; never blindly repeat the write.
 * @verify bun run test -- src/transaction.pg.test.ts
 */
export declare const TransactionCommitUncertain: import("@arki/failure").FailureDefinition<"db.transaction_commit_uncertain", undefined>;
/**
 * Cancellation stopped work before COMMIT or while waiting for another attempt.
 * @fix Respect the caller cancellation; start a new operation only under a new policy.
 * @verify bun run test -- src/transaction.test.ts
 */
export declare const TransactionCancelled: import("@arki/failure").FailureDefinition<"db.transaction_cancelled", undefined>;
/**
 * Transaction work or its driver threw an unclassified defect.
 * @fix Inspect the private cause and fix the failing implementation.
 * @verify bun run test -- src/transaction.test.ts
 */
export declare const TransactionDefect: import("@arki/failure").FailureDefinition<"db.transaction_defect", undefined>;
/**
 * A stored value cannot be read as the column's type: Postgres `infinity`, a BC date, malformed text, or
 * SQLite milliseconds that are NaN or out of range. Drizzle's `fromDriver` cannot return a failure, so the
 * column codecs throw this as an `UnexpectedFailure` (`error.failure` is this value); the raw `RangeError` is its `cause`.
 * @fix Repair or remove the stored value, or read the column as text and handle the special value yourself.
 * @verify bun run test -- src/temporal.test.ts
 */
export declare const StoredValueUnreadable: import("@arki/failure").FailureDefinition<"db.stored_value_unreadable", import("@standard-schema/spec").StandardSchemaV1<{
    kind: "date" | "sqlite_instant" | "timestamp";
}, {
    kind: "date" | "sqlite_instant" | "timestamp";
}>>;
/** One source for transaction failures, native contract maps and exact result unions. */
export declare const TRANSACTION_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.transaction_conflict", import("@standard-schema/spec").StandardSchemaV1<{
    attempts: number;
    sqlState: "40001" | "40P01";
}, {
    attempts: number;
    sqlState: "40001" | "40P01";
}>>, import("@arki/failure").FailureDefinition<"db.transaction_unavailable", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_rejected", import("@standard-schema/spec").StandardSchemaV1<{
    sqlState: string;
}, {
    sqlState: string;
}>>, import("@arki/failure").FailureDefinition<"db.transaction_commit_uncertain", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_cancelled", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_defect", undefined>, import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
export type TransactionFailure = ReturnType<(typeof TRANSACTION_FAILURES)[number]>;
//# sourceMappingURL=errors.d.ts.map