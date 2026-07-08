export declare const DB_COMPOSITION_ERROR_CODES: {
    readonly duplicateSchemaKey: "DB_COMPOSITION_E001";
};
export declare class DbCompositionError extends Error {
    readonly code: (typeof DB_COMPOSITION_ERROR_CODES)[keyof typeof DB_COMPOSITION_ERROR_CODES];
    constructor(args: {
        readonly code: (typeof DB_COMPOSITION_ERROR_CODES)[keyof typeof DB_COMPOSITION_ERROR_CODES];
        readonly message: string;
    });
}
type SchemaSlice = Record<string, unknown>;
type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer I) => void ? I : never;
type DuplicateKeys<TSlices extends readonly SchemaSlice[], TSeen extends PropertyKey = never> = TSlices extends readonly [
    infer Head,
    ...infer Tail
] ? Head extends SchemaSlice ? Tail extends readonly SchemaSlice[] ? (keyof Head & TSeen) | DuplicateKeys<Tail, TSeen | keyof Head> : keyof Head & TSeen : never : never;
type DuplicateSchemaError<TKeys extends PropertyKey> = {
    readonly 'ARKI_DB: duplicate schema keys': TKeys;
};
export type ComposedSchema<TSlices extends readonly SchemaSlice[]> = UnionToIntersection<TSlices[number]>;
export declare function composeSchema<const TSlices extends readonly SchemaSlice[]>(...slices: DuplicateKeys<TSlices> extends never ? TSlices : readonly [DuplicateSchemaError<DuplicateKeys<TSlices>>]): ComposedSchema<TSlices>;
export type TransactionalDb<TTransaction> = {
    transaction<TResult>(fn: (tx: TTransaction) => Promise<TResult>): Promise<TResult>;
};
export type UnitOfWorkScopes<TFactories extends Record<string, (tx: never) => unknown>> = {
    readonly [K in keyof TFactories]: ReturnType<TFactories[K]>;
};
export type UnitOfWork<TScopes> = <TResult>(fn: (scopes: TScopes) => Promise<TResult> | TResult) => Promise<TResult>;
export declare function createUnitOfWork<TTransaction, const TFactories extends Record<string, (tx: TTransaction) => unknown>>(db: TransactionalDb<TTransaction>, factories: TFactories): UnitOfWork<{
    readonly [K in keyof TFactories]: ReturnType<TFactories[K]>;
}>;
export {};
//# sourceMappingURL=composition.d.ts.map