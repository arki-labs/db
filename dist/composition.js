import { runTransactionOnce } from './owned-transaction.js';
import { observeDbOperation } from './runtime-local-telemetry.js';
export const DB_COMPOSITION_ERROR_CODES = {
    /**
     * Two features export a schema entry under the same key, so one would hide the other.
     *
     * @fix Rename one table or relation export so each key is unique across features.
     * @verify bun run test -- src/composition.test.ts
     */
    duplicateSchemaKey: 'DB_COMPOSITION_E001',
    /**
     * A projection was declared without a name.
     *
     * @fix Pass a non-empty `name` when you declare the projection.
     * @verify bun run test -- src/composition.test.ts
     */
    projectionNameMissing: 'DB_COMPOSITION_E002',
    /**
     * A projection was declared without the events it reads.
     *
     * @fix List at least one event in the projection `events`.
     * @verify bun run test -- src/composition.test.ts
     */
    projectionEventsMissing: 'DB_COMPOSITION_E003',
    /**
     * Two features define a relation under the same key.
     *
     * @fix Rename one relation key so each is unique across features.
     * @verify bun run test -- src/merge-relations.test.ts
     */
    duplicateRelationKey: 'DB_COMPOSITION_E004',
};
export class DbCompositionError extends Error {
    code;
    /** How to fix the declaration. Shown by `dot explain` when the import fails. */
    remediation;
    constructor(args) {
        super(args.message);
        this.name = 'DbCompositionError';
        this.code = args.code;
        this.remediation = args.remediation;
    }
}
export function composeSchema(...slices) {
    const seen = new Set();
    const schema = {};
    for (const slice of slices) {
        for (const key of Object.keys(slice)) {
            if (seen.has(key)) {
                throw new DbCompositionError({
                    code: DB_COMPOSITION_ERROR_CODES.duplicateSchemaKey,
                    message: `[db] schema key "${key}" is provided by more than one schema slice.`,
                    remediation: 'Rename the table in one slice, or remove the slice that repeats it.',
                });
            }
            seen.add(key);
            schema[key] = slice[key];
        }
    }
    return schema;
}
export function createUnitOfWork(db, factories) {
    return fn => observeDbOperation('db.unit_of_work', () => runTransactionOnce(db, async (tx) => {
        const scopes = {};
        for (const [name, factory] of Object.entries(factories)) {
            scopes[name] = factory(tx);
        }
        return fn(scopes);
    }));
}
//# sourceMappingURL=composition.js.map