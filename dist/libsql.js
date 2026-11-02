import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { queueWrites } from './libsql-queue.js';
/** Whether `url` names a database in this process: a file or memory, not a server. */
export function isLocalLibsqlUrl(url) {
    return url === ':memory:' || url.startsWith('file:');
}
/** The Drizzle handle and the function that closes its client. */
export function createLibsqlDb(options) {
    const client = createClient({
        url: options.url,
        ...(options.authToken === undefined ? {} : { authToken: options.authToken }),
    });
    const db = drizzle({
        client: isLocalLibsqlUrl(options.url) ? queueWrites(client) : client,
        relations: options.relations,
        ...(options.logger === undefined ? {} : { logger: options.logger }),
    });
    return {
        db,
        close: () => {
            client.close();
        },
    };
}
//# sourceMappingURL=libsql.js.map