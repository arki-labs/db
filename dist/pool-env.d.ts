/**
 * Every `@arki/db` variable except the connection URL.
 *
 * `env` (`./env.ts`) requires `DB_URL`, and reading any of its fields
 * validates all of them. Code that already has a URL (`createDb({ url })`,
 * the `db({ url })` plugin) or that builds a connection from the `PG*` parts
 * reads its settings from `poolEnv`, so it runs with no `DB_URL` set.
 */
import { z } from '@arki/contracts';
/** The schema of every variable but `DB_URL`; `env.ts` adds `DB_URL` to it. */
export declare const poolEnvSchema: {
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PGUSER: z.ZodOptional<z.ZodString>;
    PGPASSWORD: z.ZodOptional<z.ZodString>;
    PGHOST: z.ZodDefault<z.ZodString>;
    PGPORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    PGDATABASE: z.ZodOptional<z.ZodString>;
    PGSSLMODE: z.ZodDefault<z.ZodEnum<{
        allow: "allow";
        disable: "disable";
        prefer: "prefer";
        require: "require";
        "verify-ca": "verify-ca";
        "verify-full": "verify-full";
    }>>;
    DB_POOL_MIN: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_POOL_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_POOL_IDLE_TIMEOUT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_POOL_CONNECTION_TIMEOUT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_LOGGING: z.ZodDefault<z.ZodCoercedBoolean<unknown>>;
    DB_MIGRATIONS_FOLDER: z.ZodDefault<z.ZodString>;
    DB_SCHEMA: z.ZodDefault<z.ZodString>;
    DB_STATEMENT_TIMEOUT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_QUERY_TIMEOUT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_IDLE_IN_TRANSACTION_SESSION_TIMEOUT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DB_SEED_ON_START: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean, string | undefined>>;
    DB_DROP_ON_START: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean, string | undefined>>;
};
/** Destructure every variable from `process.env` so none is tree-shaken away. */
export declare const poolRuntimeEnv: {
    NODE_ENV: string | undefined;
    PGUSER: string | undefined;
    PGPASSWORD: string | undefined;
    PGHOST: string | undefined;
    PGPORT: string | undefined;
    PGDATABASE: string | undefined;
    PGSSLMODE: string | undefined;
    DB_POOL_MIN: string | undefined;
    DB_POOL_MAX: string | undefined;
    DB_POOL_IDLE_TIMEOUT: string | undefined;
    DB_POOL_CONNECTION_TIMEOUT: string | undefined;
    DB_LOGGING: string | undefined;
    DB_MIGRATIONS_FOLDER: string | undefined;
    DB_SCHEMA: string | undefined;
    DB_STATEMENT_TIMEOUT: string | undefined;
    DB_QUERY_TIMEOUT: string | undefined;
    DB_IDLE_IN_TRANSACTION_SESSION_TIMEOUT: string | undefined;
    DB_SEED_ON_START: string | undefined;
    DB_DROP_ON_START: string | undefined;
};
export declare const poolEnv: Readonly<{
    NODE_ENV: "development" | "production" | "test";
    PGUSER?: string | undefined;
    PGPASSWORD?: string | undefined;
    PGHOST: string;
    PGPORT: number;
    PGDATABASE?: string | undefined;
    PGSSLMODE: "allow" | "disable" | "prefer" | "require" | "verify-ca" | "verify-full";
    DB_POOL_MIN: number;
    DB_POOL_MAX: number;
    DB_POOL_IDLE_TIMEOUT: number;
    DB_POOL_CONNECTION_TIMEOUT: number;
    DB_LOGGING: boolean;
    DB_MIGRATIONS_FOLDER: string;
    DB_SCHEMA: string;
    DB_STATEMENT_TIMEOUT: number;
    DB_QUERY_TIMEOUT: number;
    DB_IDLE_IN_TRANSACTION_SESSION_TIMEOUT: number;
    DB_SEED_ON_START: boolean;
    DB_DROP_ON_START: boolean;
}>;
//# sourceMappingURL=pool-env.d.ts.map