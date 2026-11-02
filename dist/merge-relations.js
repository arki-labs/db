import { DB_COMPOSITION_ERROR_CODES, DbCompositionError } from './composition.js';
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
export function mergeRelations(...parts) {
    const merged = {};
    for (const part of parts) {
        for (const [name, config] of Object.entries(part)) {
            const existing = merged[name];
            if (!existing) {
                merged[name] = { ...config, relations: { ...config.relations } };
                continue;
            }
            for (const key of Object.keys(config.relations)) {
                if (key in existing.relations) {
                    throw new DbCompositionError({
                        code: DB_COMPOSITION_ERROR_CODES.duplicateRelationKey,
                        message: `[db] relation "${name}.${key}" is declared by more than one relations part.`,
                        remediation: 'Declare each relation in exactly one part, or remove the part that repeats it.',
                    });
                }
            }
            Object.assign(existing.relations, config.relations);
        }
    }
    // The one assertion. The loop builds exactly the shape `MergedRelations<TParts>` describes, but
    // TypeScript cannot follow a per-table, per-key spread over a variadic tuple.
    return merged;
}
//# sourceMappingURL=merge-relations.js.map