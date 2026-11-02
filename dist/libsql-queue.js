import { findDatabaseError } from './sql-state.js';
/** Wrap `client` so every call, and every transaction for its whole life, takes its turn in order. */
export function queueWrites(client) {
    let last = Promise.resolve();
    /** Waits for every earlier turn, then resolves with the function that ends this one. */
    const take = async () => {
        const { promise, resolve } = Promise.withResolvers();
        const previous = last;
        last = promise;
        await previous;
        return resolve;
    };
    const inTurn = async (call) => {
        const release = await take();
        try {
            return await call();
        }
        finally {
            release();
        }
    };
    return {
        execute: (statement, args) => inTurn(() => (typeof statement === 'string' ? client.execute(statement, args) : client.execute(statement))),
        batch: (statements, mode) => inTurn(() => client.batch(statements, mode)),
        migrate: statements => inTurn(() => client.migrate(statements)),
        executeMultiple: sql => inTurn(() => client.executeMultiple(sql)),
        sync: () => inTurn(() => client.sync()),
        transaction: async (mode) => {
            const release = await take();
            try {
                return holdTurn(await client.transaction(mode), release);
            }
            catch (error) {
                // Workaround for @libsql/client 0.18 (libsql 0.5.29): when BEGIN fails with SQLITE_BUSY
                // (another process holds the write lock), the failed statement is not finalized until
                // garbage collection, and its pooled connection then fails every COMMIT with "SQL
                // statements in progress". Reopening the pool drops that connection. Safe here: this call
                // holds the turn, so no other call is using a connection. Remove once libSQL finalizes
                // failed statements (repro: packages/db/src/transaction.sqlite.test.ts, "another process").
                if (findDatabaseError(error)?.sqlState === '40001')
                    client.reconnect();
                release();
                throw error;
            }
        },
        close: () => {
            client.close();
        },
        reconnect: () => {
            client.reconnect();
        },
        get closed() {
            return client.closed;
        },
        get protocol() {
            return client.protocol;
        },
    };
}
/** The transaction keeps the turn until it commits, rolls back or closes, whether or not that call succeeds. */
function holdTurn(transaction, release) {
    const ending = (end) => () => {
        try {
            return end();
        }
        finally {
            release();
        }
    };
    const settle = async (end) => {
        try {
            await end();
        }
        finally {
            release();
        }
    };
    return {
        execute: statement => transaction.execute(statement),
        batch: statements => transaction.batch(statements),
        executeMultiple: sql => transaction.executeMultiple(sql),
        commit: () => settle(() => transaction.commit()),
        rollback: () => settle(() => transaction.rollback()),
        close: ending(() => {
            transaction.close();
        }),
        get closed() {
            return transaction.closed;
        },
    };
}
//# sourceMappingURL=libsql-queue.js.map