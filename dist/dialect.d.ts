/** The dialects `@arki/db` runs on. */
export declare const DIALECTS: readonly ['pg', 'sqlite'];
export type Dialect = (typeof DIALECTS)[number];
/** The dialect of `db` (a database or a transaction), or `undefined` for anything else. */
export declare function dialectOf(db: object): Dialect | undefined;
/** Whether `db` is an open transaction rather than a root database. */
export declare function isTransaction(db: object): boolean;
/**
 * Whether `db` runs on libSQL. Of the SQLite drivers, only libSQL keeps an async
 * transaction callback correct (docs/arki/research/17-multi-database/spike/results.md).
 */
export declare function isLibsql(db: object): boolean;
//# sourceMappingURL=dialect.d.ts.map