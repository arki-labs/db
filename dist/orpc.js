import { ORPCError } from '@orpc/server';
import { isFailure } from '@arki/failure';
import { errorMap, orThrowRpc } from '@arki/failure/orpc';
import { is, recordSchema } from '@arki/schema';
import { DB_TRANSACTION_ERROR_CODES, DbTransactionError, parseTransactionSettings, runTransaction, TRANSACTION_FAILURES, TransactionDefect, } from './transaction.js';
/** Native contracts declare these errors without restating transaction schemas. */
export const transactionErrorMap = errorMap(...TRANSACTION_FAILURES);
/** The context key that marks transactional work. */
const MARKER = '~arkiTransaction';
/**
 * Pass to `implement(contract, config)`. Input is validated before every
 * middleware (once, however often the handler reruns); output right after the
 * handler, so inside the transaction.
 */
export const transactionalProcedureConfig = {
    initialInputValidationIndex: 0,
    initialOutputValidationIndex: Number.POSITIVE_INFINITY,
};
function pipelineError(message, remediation) {
    return new DbTransactionError({ code: DB_TRANSACTION_ERROR_CODES.invalidPipeline, message, remediation });
}
/** The two things a transaction needs from the procedure, checked on its first call. */
function assertPipeline(procedure, self) {
    const { middlewares, outputValidationIndex } = procedure['~orpc'];
    if (middlewares.at(-1) !== self) {
        throw pipelineError('[db] the transaction middleware is not the last `.use()` of this procedure. A middleware after it would run again on every retry.', 'Move `.use(transact)` to the end, right before `.handler()`. Put auth, timing and error mapping before it.');
    }
    if (outputValidationIndex < middlewares.length) {
        throw pipelineError('[db] this procedure validates its output after the transaction has committed, so a bad output would not roll back.', 'Build the implementer with `implement(contract, transactionalProcedureConfig)` from `@arki/db/orpc`.');
    }
}
function isMarked(context) {
    const marker = Reflect.get(context, MARKER);
    return marker === true;
}
function isAsyncIterable(value) {
    return is(value, recordSchema) && Symbol.asyncIterator in value;
}
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
export function transactionalProcedure(db, options) {
    const { repos: selectRepos, clock, ...rest } = options;
    const settings = parseTransactionSettings(rest);
    const checked = new WeakSet();
    async function transact({ context, procedure, next, signal, errors, }) {
        if (!checked.has(procedure)) {
            assertPipeline(procedure, transact);
            checked.add(procedure);
        }
        if (isMarked(context)) {
            throw new DbTransactionError({
                code: DB_TRANSACTION_ERROR_CODES.nestedTransaction,
                message: '[db] this procedure already runs inside a transaction middleware.',
                remediation: 'Use one `.use(transact)` per procedure. Its retry covers the whole handler.',
            });
        }
        const root = typeof db === 'function' ? db(context) : db;
        const source = selectRepos(context);
        // Native oRPC expects a result wrapper. Keep it intact on rollback too.
        let refusedResult;
        const outcome = await runTransaction(root, async (tx) => {
            const scope = { tx, repos: source.withTx(tx), [MARKER]: true };
            const result = await next({ context: scope });
            if (isAsyncIterable(result.output)) {
                throw new DbTransactionError({
                    code: DB_TRANSACTION_ERROR_CODES.unsupportedOutput,
                    message: '[db] a transactional procedure returned a stream. It would be read after the transaction closed.',
                    remediation: 'Return plain data. Stream from a separate, non-transactional procedure.',
                });
            }
            // An abort before the commit rolls back: the caller is gone and will not see the answer.
            signal?.throwIfAborted();
            if (isFailure(result.output)) {
                refusedResult = result;
                const failure = result.output;
                return failure;
            }
            return result;
        }, { ...settings, clock, signal });
        if (!isFailure(outcome))
            return outcome;
        if (refusedResult !== undefined && refusedResult.output === outcome)
            return refusedResult;
        // Exceptions belong only at this foreign framework boundary. Preserve native
        // errors (including output validation), whose declared transport semantics own them.
        if (outcome.cause instanceof ORPCError)
            throw outcome.cause;
        if (isTransactionFailure(outcome))
            return orThrowRpc(outcome, errors);
        return orThrowRpc(TransactionDefect({ cause: outcome }), errors);
    }
    return transact;
}
function isTransactionFailure(value) {
    return TRANSACTION_FAILURES.some(definition => definition.is(value));
}
//# sourceMappingURL=orpc.js.map