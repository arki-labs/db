/**
 * The error codes of the db Dot plugins and the boot-time URL read they share.
 *
 * Internal: `@arki/db/dot` re-exports {@link DB_PLUGIN_ERROR_CODES}. It lives
 * here so `@arki/db/libsql/dot` can use it without loading the Postgres plugin,
 * and `@arki/db/dot` never loads `@libsql/client`.
 */
/**
 * Stable error codes thrown by the db plugins (`@arki/db/dot` and
 * `@arki/db/libsql/dot`). Exported so consumers and
 * coding agents can match against them — never parse the message.
 *
 * @see packages/dot/docs/principles.md — principle 1.3 ("errors are part
 * of the API") and principle 4 ("agent-discoverable everywhere").
 */
export declare const DB_PLUGIN_ERROR_CODES: {
    /**
     * The `db` factory ran without a database URL: no `url` thunk and no `DB_URL`.
     *
     * @fix Set `DB_URL`, or pass a `url` thunk to `db()`.
     * @verify bun run test -- src/dot.test.ts
     */
    readonly dbUrlNotConfigured: 'ARKI_DB_PLUGIN_E001';
    /**
     * `repos({ withTx })` used `withTx` as a repository name. `withTx` is the helper that rebinds every repos set.
     *
     * @fix Rename the repository.
     * @verify bun run test -- src/repos.test.ts
     */
    readonly reservedRepoName: 'ARKI_DB_PLUGIN_E002';
    /**
     * `reader(repo, [name])` named something that is not a method of the repository.
     *
     * @fix List only method names of the repository.
     * @verify bun run test -- src/repos.test.ts
     */
    readonly readerNotAMethod: 'ARKI_DB_PLUGIN_E003';
    /**
     * `sessionPool.connect()` ran while `DB_URL` is a known transaction pooler and no direct URL is set.
     * Through the pooler, LISTEN hears nothing and a session lock outlives its owner.
     *
     * @fix Set `DB_DIRECT_URL`, or pass a `directUrl` thunk to `db()`.
     * @verify bun run test -- src/dot.test.ts
     */
    readonly sessionOnPooledUrl: 'ARKI_DB_PLUGIN_E004';
    /**
     * The database URL does not fit the plugin: a `postgres:` URL given to `db()` from `@arki/db/libsql/dot`, or a
     * SQLite URL (`file:`, `libsql:`, `:memory:`) given to the pg driver of `@arki/db/dot`. The wrong driver would
     * fail later, with a less clear error.
     *
     * @fix Use the plugin that matches the URL, or fix the URL.
     * @verify bun run test -- src/dot.test.ts src/libsql/dot.test.ts
     */
    readonly driverUrlMismatch: 'ARKI_DB_PLUGIN_E005';
};
/** URL schemes that belong to the other driver: the realistic mix-ups, not every invalid URL. */
declare const FOREIGN_SCHEMES: {
    readonly pg: readonly ['file:', 'libsql:', ':memory:'];
    readonly libsql: readonly ['postgres:', 'postgresql:'];
};
/**
 * The URL from the `url` thunk, else `DB_URL`. Validated at the plugin boundary
 * so the DOT lifecycle gets a coded error. `createDb` still throws raw `Error`
 * for non-DOT consumers (its public contract is unchanged).
 */
export declare function readUrl(driver: keyof typeof FOREIGN_SCHEMES, url: (() => string | undefined) | undefined): string;
export {};
//# sourceMappingURL=dot-errors.d.ts.map