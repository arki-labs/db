/**
 * A live process already owns this data directory.
 * @fix Close its existing handle or choose another data directory.
 * @verify bun run test -- src/runtime-local.test.ts
 */
export declare const DataDirInUse: import("@arki/failure").FailureDefinition<"db.local_data_dir_in_use", import("@standard-schema/spec").StandardSchemaV1<{
    pid: number;
}, {
    pid: number;
}>>;
/**
 * The owner lock kept changing throughout the bounded acquisition attempts.
 * @fix Wait for competing openers to finish before opening the directory again.
 * @verify bun run test -- src/owner-lock.test.ts
 */
export declare const OwnerLockContended: import("@arki/failure").FailureDefinition<"db.local_owner_lock_contended", undefined>;
/**
 * The filesystem temporarily could not perform the local database operation.
 * @fix Restore filesystem capacity or availability before trying again.
 * @verify bun run test -- src/owner-lock.test.ts
 */
export declare const LocalRuntimeUnavailable: import("@arki/failure").FailureDefinition<"db.local_runtime_unavailable", undefined>;
/**
 * The filesystem rejected the selected local database path or operation.
 * @fix Choose a writable directory with the required filesystem permissions.
 * @verify bun run test -- src/owner-lock.test.ts
 */
export declare const LocalRuntimeRefused: import("@arki/failure").FailureDefinition<"db.local_runtime_refused", undefined>;
/**
 * Closing resources or releasing their owner lock could not be confirmed.
 * @fix Inspect the private causes; retain ownership until the handle is confirmed closed.
 * @verify bun run test -- src/runtime-local-cleanup.test.ts
 */
export declare const LocalRuntimeCleanupFailed: import("@arki/failure").FailureDefinition<"db.local_runtime_cleanup_failed", undefined>;
/** Exact owner acquisition failures; entropy failures keep their original identity. */
export declare const OWNER_LOCK_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.local_data_dir_in_use", import("@standard-schema/spec").StandardSchemaV1<{
    pid: number;
}, {
    pid: number;
}>>, import("@arki/failure").FailureDefinition<"db.local_owner_lock_contended", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_unavailable", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_refused", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_cleanup_failed", undefined>, import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
export type OwnerLockFailure = ReturnType<(typeof OWNER_LOCK_FAILURES)[number]>;
/** The owned close operation reports cleanup uncertainty explicitly. */
export declare const LOCAL_RUNTIME_CLOSE_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.local_runtime_cleanup_failed", undefined>];
export type LocalRuntimeCloseFailure = ReturnType<(typeof LOCAL_RUNTIME_CLOSE_FAILURES)[number]>;
/** One source for the public local runtime's exact failure union. */
export declare const LOCAL_RUNTIME_FAILURES: readonly [import("@arki/failure").FailureDefinition<"db.local_data_dir_in_use", import("@standard-schema/spec").StandardSchemaV1<{
    pid: number;
}, {
    pid: number;
}>>, import("@arki/failure").FailureDefinition<"db.local_owner_lock_contended", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_unavailable", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_refused", undefined>, import("@arki/failure").FailureDefinition<"db.local_runtime_cleanup_failed", undefined>, import("@arki/failure").FailureDefinition<"contracts.random_source_unavailable", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>];
export type LocalRuntimeFailure = ReturnType<(typeof LOCAL_RUNTIME_FAILURES)[number]>;
//# sourceMappingURL=runtime-local-failures.d.ts.map