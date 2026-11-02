/** Dialect-free helpers shared by the pg and SQLite `idColumns`. */
import type { z } from '@arki/contracts';
/**
 * Stash a Zod schema on a Drizzle column builder so that
 * `@arki/contracts`'s `createSelectSchema`/`createInsertSchema`/`createUpdateSchema`
 * wrappers auto-apply it as a refine — turning the brand from a phantom-only
 * type into a real runtime check.
 *
 * The builder's `config` object is the SAME reference passed to the constructed
 * column (see `PgVarcharBuilder.build` → `new PgVarchar(table, this.config)`),
 * so writing here is readable from the column later.
 */
export declare function tagColumnSchema<TBuilder extends object>(builder: TBuilder, schema: z.ZodType): TBuilder;
export type OnDelete = 'cascade' | 'restrict' | 'no action' | 'set null' | 'set default';
//# sourceMappingURL=id-columns-shared.d.ts.map