/** Private owned boundary shared by serializable retries and savepoint-capable openers. */
import type { TransactionConfig, TransactionalDb } from './composition.js';
import type { TransactionFailure } from './errors.js';
/**
 * Refuse SQLite on a sync driver. It runs the callback, then commits when the
 * callback returns, not when its promise settles: after the first `await`, other
 * queries run inside the open transaction and a later throw cannot roll back
 * (docs/arki/research/17-multi-database/spike/results.md).
 */
/** @internal Reject static driver misuse before public policy supervision. */
export declare function assertSafeDriver(db: object): void;
/** The wrapper distinguishes a returned business failure from an owned driver failure. */
export declare function transactionAttempt<Tx, T>(db: TransactionalDb<Tx>, work: (tx: Tx) => Promise<T>, config?: TransactionConfig, signal?: AbortSignal): Promise<{
    value: T | TransactionFailure;
} | {
    failure: TransactionFailure;
}>;
/** Preserve the caller's isolation/savepoint policy and execute exactly once. */
export declare function runTransactionOnce<Tx, T>(db: TransactionalDb<Tx>, work: (tx: Tx) => Promise<T>): Promise<T | TransactionFailure>;
export declare function classifyTransactionFailure(cause: unknown, workCompleted: boolean, signal?: AbortSignal): TransactionFailure;
//# sourceMappingURL=owned-transaction.d.ts.map