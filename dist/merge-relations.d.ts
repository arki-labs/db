import type { AnyRelations } from 'drizzle-orm';
/** Two parts, merged per table: tables from either side stay, shared tables get both `relations` maps. */
type MergeTwo<TLeft extends AnyRelations, TRight extends AnyRelations> = {
    [K in keyof TLeft | keyof TRight]: {
        table: K extends keyof TLeft ? TLeft[K]['table'] : K extends keyof TRight ? TRight[K]['table'] : never;
        name: K & string;
        relations: (K extends keyof TLeft ? TLeft[K]['relations'] : Record<never, never>) & (K extends keyof TRight ? TRight[K]['relations'] : Record<never, never>);
    };
};
/** Tail-recursive (accumulator), so dozens of parts stay far from TypeScript's non-tail recursion limit. */
type MergedRelations<TParts extends readonly AnyRelations[], TMerged extends AnyRelations = Record<never, never>> = TParts extends readonly [infer Head extends AnyRelations, ...infer Rest extends readonly AnyRelations[]] ? MergedRelations<Rest, MergeTwo<TMerged, Head>> : TMerged;
/**
 * Join several `defineRelationsPart(...)` results into one relations config, merging PER TABLE.
 *
 * Drizzle's `{ ...a, ...b }` replaces a whole table entry, so two parts that add relations to the same
 * table silently lose keys. `mergeRelations` keeps every table once and merges the `relations` maps.
 * The same `(table, relation key)` in two parts is a bug: it throws `DB_COMPOSITION_E004` naming both.
 * The result type is the per-table merge, so `drizzle({ relations })` and `db.query.X.findMany({ with })`
 * infer exactly as with one big `defineRelations`.
 *
 * @example
 * ```ts
 * import { defineRelationsPart, mergeRelations } from '@arki/db/orm';
 *
 * // sources/relations.ts: a feature declares only the relations it owns.
 * export const sourcesRelations = defineRelationsPart(schema, (r) => ({
 *   ContentSource: { user: r.one.User({ from: r.ContentSource.userId, to: r.User.id }) },
 * }));
 *
 * // relations.ts: the base part registers every table (with `{}`), the feature parts add keys.
 * export const relations = mergeRelations(defineRelationsPart(schema), sourcesRelations, contentRelations);
 * export type Relations = typeof relations;
 * ```
 */
export declare function mergeRelations<const TParts extends readonly AnyRelations[]>(...parts: TParts): MergedRelations<TParts>;
export {};
//# sourceMappingURL=merge-relations.d.ts.map