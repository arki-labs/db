/** The poolers `pooledHostOf` knows. An unknown host counts as direct. */
export declare const POOLED_HOSTS: readonly ['neon', 'supabase'];
export type PooledHost = (typeof POOLED_HOSTS)[number];
/**
 * A session feature was given a pooled URL and no direct one.
 * @fix Set `DB_DIRECT_URL` (or pass `directUrl`) to the host's direct URL.
 * @verify bun run test -- src/hosts.test.ts
 */
export declare const SessionNeedsDirectUrl: import("@arki/failure").FailureDefinition<"db.session_needs_direct_url", import("@standard-schema/spec").StandardSchemaV1<{
    host: "neon" | "supabase";
    hint: string;
}, {
    host: "neon" | "supabase";
    hint: string;
}>>;
/** Which known pooler `url` points at, or `undefined` for a direct (or unknown) host. */
export declare function pooledHostOf(url: string): PooledHost | undefined;
/**
 * The URL for session features: LISTEN, session advisory locks, migrations.
 * `directUrl` when given; else `url`, unless `url` is a known pooler.
 */
export declare function resolveDirectUrl(urls: {
    readonly url: string;
    readonly directUrl?: string | undefined;
}): string | import("@arki/failure").Failure<"db.session_needs_direct_url", {
    host: "neon" | "supabase";
    hint: string;
}>;
//# sourceMappingURL=hosts.d.ts.map