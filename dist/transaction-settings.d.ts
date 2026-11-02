/** The Zod check behind `TransactionSettings`, apart so the `transaction` declarations stay free of Zod. */
import { z } from 'zod';
export declare const transactionSettings: z.ZodObject<{
    isolation: z.ZodDefault<z.ZodLiteral<"serializable">>;
    retries: z.ZodDefault<z.ZodInt>;
}, z.core.$strict>;
//# sourceMappingURL=transaction-settings.d.ts.map