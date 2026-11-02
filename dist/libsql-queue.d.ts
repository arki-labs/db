/**
 * One turn at a time for a local libSQL client.
 *
 * SQLite has one writer. `@libsql/client` gives each transaction its own pooled
 * connection, and every connection runs on the one JavaScript thread. So a
 * second writer cannot wait inside SQLite: a busy wait would block the thread
 * that has to commit the first. Without this queue a second transaction, or a
 * plain insert while a transaction is open, fails at once with `SQLITE_BUSY`,
 * and a busy timeout does not help at any value
 * (docs/arki/research/17-multi-database/spike/results.md).
 *
 * Only an open transaction holds a lock across an `await`; a local statement
 * runs in one synchronous native call. So the queue costs no parallelism:
 * calls take turns in order, and a transaction keeps its turn until it commits
 * or rolls back. Queries inside the transaction run on the transaction object
 * and never wait. A query on the root database from inside its own
 * transaction waits for that transaction to end, so it never returns: use `tx`.
 */
import type { Client } from '@libsql/client';
/** Wrap `client` so every call, and every transaction for its whole life, takes its turn in order. */
export declare function queueWrites(client: Client): Client;
//# sourceMappingURL=libsql-queue.d.ts.map