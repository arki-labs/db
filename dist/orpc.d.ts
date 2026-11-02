/**
 * `@arki/db/orpc` — one oRPC middleware that makes a contract-first procedure a
 * SERIALIZABLE Postgres transaction.
 *
 *   const transact = transactionalProcedure(db, { repos: () => repositories, retries: 3 });
 *   implement(contract, transactionalProcedureConfig).transfer
 *     .use(transact)                                   // always the last `.use()`
 *     .handler(({ context: { repos }, input }) => moveMoney(repos, input));
 *
 * Per call it opens a transaction, binds the repositories to it with
 * `withTx(tx)` (once per attempt), and runs the handler. On `40001` / `40P01` it
 * runs the handler again in a fresh transaction (see `runTransaction`). Out of
 * retries, the client gets the declared `db.transaction_conflict` error, a 409.
 *
 * The handler's output is validated inside the transaction, so a bad output
 * rolls back. That needs `transactionalProcedureConfig` on `implement`: the
 * middleware checks it, and that it is last, on the first call of each procedure.
 *
 * `@orpc/server` is an optional peer. Import this module only in an app that serves oRPC.
 */
import type { Context, Meta, MiddlewareOptions, ORPCErrorConstructorMap } from '@orpc/server';
import type { Clock } from '@arki/clock';
import type { ErrorMapOf } from '@arki/failure/orpc';
import type { TransactionalDb } from './composition.js';
import type { TransactionSettings } from './transaction.js';
import { TRANSACTION_FAILURES } from './transaction.js';
/** Native contracts declare these errors without restating transaction schemas. */
export declare const transactionErrorMap: ErrorMapOf<readonly [import("@arki/failure").FailureDefinition<"db.transaction_conflict", import("@standard-schema/spec").StandardSchemaV1<{
    attempts: number;
    sqlState: "40001" | "40P01";
}, {
    attempts: number;
    sqlState: "40001" | "40P01";
}>>, import("@arki/failure").FailureDefinition<"db.transaction_unavailable", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_rejected", import("@standard-schema/spec").StandardSchemaV1<{
    sqlState: string;
}, {
    sqlState: string;
}>>, import("@arki/failure").FailureDefinition<"db.transaction_commit_uncertain", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_cancelled", undefined>, import("@arki/failure").FailureDefinition<"db.transaction_defect", undefined>, import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>]>;
/**
 * Where the bound repositories come from: `Repos<F>` from `@arki/db/dot`, or anything with `withTx`.
 * A property, not a method, so the check is strict: factories typed for the pool only
 * (`(db: Db) => …`) do not accept the transaction and fail at `transactionalProcedure(...)`.
 */
export type TransactionRepositorySource<Tx, R extends object> = {
    readonly withTx: (tx: Tx) => R;
};
/** What the middleware adds to the handler's context, and what a transaction-aware usecase takes. */
export type TransactionContext<Tx, R extends object> = {
    readonly tx: Tx;
    /** The repositories bound to `tx`. A fresh set per attempt. */
    readonly repos: R;
    /** Marks transactional code: a second `transact` refuses it, and `db/no-effects-in-transaction` looks for it. */
    readonly '~arkiTransaction': true;
};
export type TransactionalProcedureOptions<C extends Context, Tx, R extends object> = TransactionSettings & {
    /**
     * Picks the repository source from the context. Called once per call; its `withTx` once per attempt.
     * `Tx` is read off the database only, never off `withTx`.
     */
    readonly repos: (context: C) => TransactionRepositorySource<NoInfer<Tx>, R>;
    /** Whose timer the wait between attempts uses. Default: the system clock. */
    readonly clock?: Clock;
};
/**
 * The middleware. Generic in the procedure's output, so one `transact` attaches
 * to every procedure of a feature, whatever each one returns.
 */
export type TransactionalMiddleware<C extends Context, Tx, R extends object> = <TOutput>(options: MiddlewareOptions<C, TOutput, ORPCErrorConstructorMap<ErrorMapOf<typeof TRANSACTION_FAILURES>>, Meta>) => Promise<{
    output: TOutput;
    context: TransactionContext<Tx, R>;
}>;
/** The scope a transaction-aware usecase takes, read off the middleware. Never restated. */
export type TransactionScopeOf<M> = M extends (options: never) => Promise<{
    context: TransactionContext<infer Tx, infer R>;
}> ? TransactionContext<Tx, R> : never;
/**
 * Pass to `implement(contract, config)`. Input is validated before every
 * middleware (once, however often the handler reruns); output right after the
 * handler, so inside the transaction.
 */
export declare const transactionalProcedureConfig: {
    readonly initialInputValidationIndex: 0;
    readonly initialOutputValidationIndex: number;
};
/**
 * Make the transaction middleware, once per feature (or app).
 *
 * - `db`: the root database, or a function that picks it from the context (a
 *   Dot feature's `ctx.db`). A transaction as root is refused (`ARKI_DB_TX_E006`).
 * - `options.repos`: picks the repository source; the handler gets
 *   `source.withTx(tx)` as `context.repos`.
 * - Each request is one `db.transaction` span (from `runTransaction`), carrying the failure code of a rolled-back outcome.
 * - `options.isolation` (`'serializable'`, the default and only level) and
 *   `options.retries` (default 3, at most 10) are checked now: bad values throw
 *   `ARKI_DB_TX_E002` here, not on the first request.
 */
export declare function transactionalProcedure<C extends Context = Record<never, never>, Tx = never, R extends object = never>(db: TransactionalDb<Tx> | ((context: C) => TransactionalDb<Tx>), options: TransactionalProcedureOptions<C, Tx, R>): TransactionalMiddleware<C, Tx, R>;
//# sourceMappingURL=orpc.d.ts.map