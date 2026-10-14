export declare const env: Readonly<{
    NODE_ENV: "development" | "production" | "test";
    DB_URL: string;
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
//# sourceMappingURL=env.d.ts.map