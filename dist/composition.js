export const DB_COMPOSITION_ERROR_CODES = {
    duplicateSchemaKey: 'DB_COMPOSITION_E001',
    projectionNameMissing: 'DB_COMPOSITION_E002',
    projectionEventsMissing: 'DB_COMPOSITION_E003',
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
    return async (fn) => db.transaction(async (tx) => {
        const scopes = {};
        for (const [name, factory] of Object.entries(factories)) {
            scopes[name] = factory(tx);
        }
        return fn(scopes);
    });
}
//# sourceMappingURL=composition.js.map