import type { Clock } from '@arki/clock';
import type { TransactionalDb } from './composition.js';
import type { TransactionFailure } from './errors.js';
import { TransactionConflict } from './errors.js';
export type { TransactionalDb } from './composition.js';
/** The SQLSTATEs PostgreSQL tells you to retry: serialization failure and deadlock. */
export type RetryableSqlState = ReturnType<typeof TransactionConflict>['data']['sqlState'];
export { TransactionConflict, TransactionUnavailable, TransactionRejected, TransactionCommitUncertain, TransactionCancelled, TransactionDefect, TRANSACTION_FAILURES, } from './errors.js';
export { runTransactionOnce } from './owned-transaction.js';
export type { TransactionFailure } from './errors.js';
/** What a caller may set. An exact type test locks `transactionSettings` to this type. */
export type TransactionSettings = {
    /** The only level in v1. Serializable is what makes "run it again" safe. */
    isolation?: 'serializable' | undefined;
    /** Extra attempts after the first: `3` means at most 4 runs. */
    retries?: number | undefined;
};
/** What a transaction runs with once the defaults are filled in. */
export type ResolvedTransactionSettings = {
    isolation: 'serializable';
    retries: number;
};
export type TransactionOptions = TransactionSettings & {
    /** Whose timer the wait between attempts uses. Default: the system clock. Pass a `MockClock` in tests. */
    readonly clock?: Clock;
    /** Stops before the next attempt and during the wait. An attempt already running finishes or fails on its own. */
    readonly signal?: AbortSignal;
};
export { DB_TRANSACTION_ERROR_CODES, DbTransactionError, isDbTransactionError } from './transaction-errors.js';
export type { DbTransactionErrorCode } from './transaction-errors.js';
/**
 * The retryable SQLSTATE of `error`, or `undefined`.
 *
 * Reads the database error the way every driver reports it: through Drizzle's
 * `DrizzleQueryError`, in `code` (node-postgres, PGlite) or in `errno` (Bun SQL).
 * The first error in the `cause` chain that has a `code` decides, so an
 * `ORPCError('NOT_FOUND')` or an `ECONNRESET` is final even when an older `40001`
 * sits deeper. When unsure, do not retry.
 */
export declare function retryableSqlState(error: unknown): RetryableSqlState | undefined;
/** Parse `{ isolation, retries }`. Bad values throw `ARKI_DB_TX_E002`; nothing is clamped. */
export declare function parseTransactionSettings(settings: TransactionSettings): ResolvedTransactionSettings;
/**
 * Run rollback-safe work at SERIALIZABLE isolation. Returning a Failure rolls
 * back and restores that exact value. Ordinary values commit unchanged.
 * Only SQLSTATE 40001/40P01 retries; COMMIT acknowledgement loss never does.
 * External effects must remain outside the callback because an attempt may rerun.
 * Static configuration misuse still throws DbTransactionError.
 */
export declare function runTransaction<Tx, T>(db: TransactionalDb<Tx>, work: (tx: Tx, attempt: number) => Promise<T>, options?: TransactionOptions): Promise<T | TransactionFailure>;
//# sourceMappingURL=transaction.d.ts.map