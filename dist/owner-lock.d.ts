import type { LocalRuntimeCloseFailure, OwnerLockFailure } from './runtime-local-failures.js';
/** Internal ownership identity; restored lock bytes remain compatible with older owners. */
export declare const ownerId: import("@arki/contracts").BrandedIdDeclaration<"", "db.owner">;
/**
 * The local path a PGlite `dataDir` writes to, or `null` when it is not a
 * file path (`memory://`, `idb://`, `opfs-ahp://`). `file://` is a file path.
 */
export declare function lockableDataDir(dataDir: string): string | null;
/** Filesystem refusals are distinct from temporary resource exhaustion and unknown defects. */
export declare function classifyLocalRuntimeFailure(cause: unknown): OwnerLockFailure;
/**
 * Take the owner lock of `dataDir` (creating the directory if needed).
 * Resolves to the release function; release is idempotent and removes the
 * lock only while it is still ours.
 *
 * Returns canonical failures; a failed release may be retried without giving up ownership.
 */
export declare function acquireOwnerLock(dataDir: string): Promise<(() => Promise<void | LocalRuntimeCloseFailure>) | OwnerLockFailure>;
//# sourceMappingURL=owner-lock.d.ts.map