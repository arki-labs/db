/** The part of a `pg` pool client a listener uses. */
export type ListenClient = {
    query(text: string): Promise<unknown>;
    on(event: 'notification', listener: (message: {
        readonly channel: string;
        readonly payload?: string;
    }) => void): unknown;
    on(event: 'error', listener: (error: Error) => void): unknown;
    on(event: 'end', listener: () => void): unknown;
    release(error?: Error | boolean): void;
};
/** The part of a `pg` pool a listener uses: `new pg.Pool(...)`, or a Drizzle node-postgres database's `$client`. */
export type ListenPool = {
    connect(): Promise<ListenClient>;
};
export type ListenOptions = {
    /** Wait between reconnect attempts, in milliseconds. Default 1000. */
    readonly retryMs?: number;
    /** Every `healthMs` the client runs `select 1`; no answer by the next check means the connection is lost. Default 5000. */
    readonly healthMs?: number;
    /** `ready` after every successful `LISTEN` (the first one included); `disconnected` when the client is lost. Not called after stop. */
    readonly onState?: (state: 'ready' | 'disconnected') => void;
};
/**
 * The first connection or `LISTEN` of a listener failed (no free client, permission denied, no `LISTEN` support).
 * Nothing retries: the start rejects with an `UnexpectedFailure` whose `failure` is this value and whose
 * `cause` is the raw pool error. (`WakeListener` in `@arki/journal` is `Unlisten | Promise<Unlisten>`, so the
 * start cannot return a failure without changing that contract.)
 * @fix Check the pool, the credentials and that the server supports `LISTEN`, then start the listener again.
 * @verify bun run test -- src/pg-listen.test.ts
 */
export declare const ListenUnavailable: import("@arki/failure").FailureDefinition<"db.listen_unavailable", undefined>;
/**
 * Hear `channel` on a dedicated client of `pool`. It resolves with the function that
 * stops it, the shape of the journal's `WakeListener`:
 * `journal.worker(db, { listen: listenOnPool(listenPool, journal.wakeChannel) })`.
 * The first connection is made when listening starts; if it fails, the start rejects.
 * Stop closes the client instead of handing it back: its handlers stay on it, and a
 * reused client would run them for a stopped listener.
 */
export declare function listenOnPool(pool: ListenPool, channel: string, options?: ListenOptions): (onMessage: (payload: string) => void) => Promise<() => Promise<void>>;
//# sourceMappingURL=pg-listen.d.ts.map