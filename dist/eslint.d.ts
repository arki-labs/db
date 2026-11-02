/**
 * `@arki/db/eslint` — the `no-effects-in-transaction` rule.
 *
 * A transactional procedure reruns its handler on a serialization failure.
 * Database writes roll back; a `fetch`, a queue write or an effect does not.
 * It runs once per attempt and stays done even when the transaction rolls
 * back. This type-aware rule reports those calls inside transactional code:
 *
 * - a function whose parameter type carries the `'~arkiTransaction'` marker
 *   (a usecase taking `TransactionScopeOf<typeof transact>`), or whose
 *   parameter's `context` does (a handler after `.use(transact)`);
 * - and every callback nested inside one.
 *
 * Reported calls: the global `fetch` (also through `globalThis`, an alias or
 * destructuring), BullMQ `Queue#add` / `#addBulk`, `@arki/queue` `trigger()`
 * and `enqueue()`, and any `.effect()`.
 *
 * Not seen (a guard, not a proof): calls through dynamic property names,
 * values whose type was erased to a plain object type, helper functions whose
 * parameters do not carry the marker, and SDK wrappers (a payment client's
 * `create()` is just a method). Review the usecases a transaction calls.
 *
 * @example
 * // eslint.config.js (typed linting is required)
 * import db from '@arki/db/eslint';
 * export default [db.configs.recommended];
 */
import type { TSESLint } from '@typescript-eslint/utils';
/** Report a call inside transactional code that a rollback cannot undo. */
export declare const noEffectsInTransaction: TSESLint.RuleModule<"effect", [], unknown, TSESLint.RuleListener> & {
    name: string;
};
/** The plugin, with a flat `recommended` config that registers it as `db` and turns `db/no-effects-in-transaction` on. */
declare const plugin: TSESLint.FlatConfig.Plugin & {
    readonly configs: {
        readonly recommended: TSESLint.FlatConfig.Config;
    };
};
export default plugin;
//# sourceMappingURL=eslint.d.ts.map