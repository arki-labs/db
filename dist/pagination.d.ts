/**
 * Keyset pagination, the server half. `keyset({ createdAt: 'desc', id: 'desc' })`
 * from `@arki/contracts` declares the order and the cursor; `keysetQuery`
 * turns it into `ORDER BY`, the "after this cursor" predicate, `LIMIT n + 1`
 * and the page. Filters (ownership included) stay in your query, untouched.
 *
 * Timestamps: a JS `Date` keeps milliseconds, Postgres `timestamp` keeps
 * microseconds by default. A cursor rounded to the millisecond can skip rows
 * that differ only in microseconds, so declare keyset timestamp columns with
 * `{ precision: 3 }` (or `mode: 'string'`, which keeps all six digits).
 */
import type { AnyColumn } from 'drizzle-orm';
import type { CursorValues, Keyset, KeysetOrder } from '@arki/contracts';
/** The column behind each key of the order. A table whose columns carry the key names fits as is. */
export type KeysetColumns<O extends KeysetOrder> = {
    readonly [K in keyof O]: AnyColumn;
};
/** What {@link keysetQuery} returns: the pieces of one paged query. */
export type KeysetQuery<O extends KeysetOrder> = ReturnType<typeof keysetQuery<O>>;
/**
 * The query pieces for one keyset. Pass the table when its columns are named
 * like the keys (`keysetQuery(storyOrder, stories)`), or a map otherwise.
 *
 * @example
 * ```ts
 * const byNewest = keysetQuery(storyOrder, stories);
 *
 * async listMine(userId: UserId, { cursor, limit }: { cursor?: string; limit: number }) {
 *   const after = byNewest.after(cursor);
 *   if (isFailure(after)) return after;
 *   const rows = await this.db
 *     .select()
 *     .from(stories)
 *     .where(and(eq(stories.userId, userId), after))
 *     .orderBy(...byNewest.orderBy)
 *     .limit(byNewest.take(limit));
 *   return byNewest.page(rows, limit);   // { items, nextCursor }
 * }
 * ```
 */
export declare function keysetQuery<O extends KeysetOrder>(keys: Keyset<O>, columns: KeysetColumns<O>): {
    orderBy: import("drizzle-orm").SQL<unknown>[];
    after: (cursor: string | undefined) => import("@arki/failure").Failure<"contracts.invalid_cursor", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | import("drizzle-orm").SQL<unknown> | undefined;
    take: (limit: number) => number;
    page: <R extends CursorValues<O>>(rows: readonly R[], limit: number) => import("@arki/failure").Failure<"contracts.invalid_cursor_value", undefined> | import("@arki/failure").Failure<"failure.unexpected_defect", undefined> | import("@arki/failure").Failure<"schema.validator_defect", undefined> | {
        items: R[];
        nextCursor: string | null;
    };
};
//# sourceMappingURL=pagination.d.ts.map