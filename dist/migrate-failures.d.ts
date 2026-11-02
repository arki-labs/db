/**
 * Migration source files could not be read or decoded.
 * @fix Inspect the private cause and restore the generated migration directory before running again.
 * @verify bun run test -- src/migrate-outcomes.test.ts
 */
export declare const MigrationReadFailed: import("@arki/failure").FailureDefinition<"db.migration_read_failed", undefined>;
/**
 * The current migration bookkeeping state could not be read.
 * @fix Restore database access and inspect its bookkeeping before deciding what to apply.
 * @verify bun run test -- src/migrate-outcomes.test.ts
 */
export declare const MigrationStateFailed: import("@arki/failure").FailureDefinition<"db.migration_state_failed", undefined>;
/**
 * The native migrator did not confirm completion; schema or bookkeeping changes may exist.
 * @fix Reconcile the database schema and migration bookkeeping before explicitly running again. Do not retry blindly.
 * @verify bun run test -- src/migrate-outcomes.test.ts
 */
export declare const MigrationUnconfirmed: import("@arki/failure").FailureDefinition<"db.migration_unconfirmed", undefined>;
/** Exact declarations for each owned migration operation. */
export declare const MIGRATION_READ_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.migration_read_failed", undefined>];
export declare const MIGRATION_STATE_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.migration_read_failed", undefined>, import("@arki/failure").FailureDefinition<"db.migration_state_failed", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
export declare const MIGRATION_APPLY_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.migration_read_failed", undefined>, import("@arki/failure").FailureDefinition<"db.migration_unconfirmed", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
//# sourceMappingURL=migrate-failures.d.ts.map