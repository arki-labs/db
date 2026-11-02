import { and, asc, desc, eq, gt, gte, lt, lte, or } from 'drizzle-orm';
import { isFailure } from '@arki/failure';
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
export function keysetQuery(keys, columns) {
    const terms = keys.keys.map(key => ({ key, column: columns[key], descending: keys.order[key] === 'desc' }));
    return {
        orderBy: terms.map(({ column, descending }) => (descending ? desc(column) : asc(column))),
        after: (cursor) => {
            if (cursor === undefined)
                return;
            const values = keys.decode(cursor);
            if (isFailure(values))
                return values;
            const parts = terms.map(term => ({ ...term, value: values[term.key] }));
            // Row R is after the cursor when, at the first key where they differ, R is
            // past it: (a > a0) OR (a = a0 AND b > b0) OR … ("past" is < for desc keys).
            const branches = parts.map((part, index) => and(...parts.slice(0, index).map(earlier => eq(earlier.column, earlier.value)), part.descending ? lt(part.column, part.value) : gt(part.column, part.value)));
            const [first] = parts;
            // Redundant on purpose: a plain bound on the first key lets Postgres use the
            // index as a range scan; the OR alone would make it look at every row.
            const bound = first === undefined ? undefined : first.descending ? lte(first.column, first.value) : gte(first.column, first.value);
            return and(bound, or(...branches));
        },
        take: (limit) => limit + 1,
        page: (rows, limit) => {
            if (rows.length <= limit)
                return { items: [...rows], nextCursor: null };
            const items = rows.slice(0, limit);
            const last = items.at(-1);
            // `undefined` only for a zero-row page (`limit: 0`), which has nothing to continue from.
            const nextCursor = last === undefined ? null : keys.encode(last);
            if (isFailure(nextCursor))
                return nextCursor;
            return { items, nextCursor };
        },
    };
}
//# sourceMappingURL=pagination.js.map