export const DB_COMPOSITION_ERROR_CODES = {
    duplicateSchemaKey: 'DB_COMPOSITION_E001',
};
export class DbCompositionError extends Error {
    code;
    constructor(args) {
        super(args.message);
        this.name = 'DbCompositionError';
        this.code = args.code;
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