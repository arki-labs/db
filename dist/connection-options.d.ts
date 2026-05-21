/**
 * Get database connection options from environment variables
 * @returns Connection options object for pg Pool
 */
export declare function getDbConnectionOptions(): {
    connectionString: string;
    min: number;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    statement_timeout: number;
    query_timeout: number;
    idle_in_transaction_session_timeout: number;
};
/**
 * Get individual database connection parameters from environment variables
 * Useful when DB_URL is not available but individual parameters are set
 * @returns Connection parameters object
 */
export declare function getDbConnectionParams(): {
    user: string | undefined;
    password: string | undefined;
    host: string;
    port: number;
    database: string | undefined;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
};
//# sourceMappingURL=connection-options.d.ts.map