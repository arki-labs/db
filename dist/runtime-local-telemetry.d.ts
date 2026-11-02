/** Preserve the operation's exact result and run it once, even under a broken context manager. */
export declare function observeDbOperation<T>(name: string, run: () => T | Promise<T>): Promise<T>;
/** Synchronous file reads retain their synchronous contract and cache either terminal outcome. */
export declare function observeDbSyncOperation<T>(name: string, run: () => T): T;
//# sourceMappingURL=runtime-local-telemetry.d.ts.map