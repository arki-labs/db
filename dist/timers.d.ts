/**
 * Let the process exit while this timer waits. Node and Bun return a timer object
 * with `unref`; browsers, Deno's web API and Hermes return a number, which never
 * holds a process open, so there is nothing to do.
 */
export declare function unrefTimer(timer: unknown): void;
//# sourceMappingURL=timers.d.ts.map