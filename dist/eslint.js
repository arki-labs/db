import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
/** The marker a transaction scope carries (see `TransactionContext` in `@arki/db/orpc`). */
const MARKER = '~arkiTransaction';
/** Queue writes, by the type that declares the method and the method's name. */
const QUEUE_WRITES = {
    Queue: ['add', 'addBulk'],
    JobDefinition: ['trigger'],
    AnyJobDefinition: ['trigger'],
    QueueClient: ['enqueue'],
    QueueInstance: ['enqueue'],
    BullMQQueueInstance: ['enqueue'],
};
const createRule = ESLintUtils.RuleCreator(name => `https://arki.dev/db/eslint#${name}`);
function isFunction(node) {
    return (node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.type === AST_NODE_TYPES.FunctionDeclaration ||
        node.type === AST_NODE_TYPES.FunctionExpression);
}
/** `x.name` or `x['name']`: the static member name, or undefined for a computed one. */
function staticMemberName(callee) {
    if (callee.type !== AST_NODE_TYPES.MemberExpression)
        return;
    if (!callee.computed && callee.property.type === AST_NODE_TYPES.Identifier)
        return callee.property.name;
    if (callee.property.type === AST_NODE_TYPES.Literal && typeof callee.property.value === 'string') {
        return callee.property.value;
    }
    return;
}
function memberOf(declaration) {
    let node = declaration;
    // A function type always sits inside another node, so `parent` is set on the way up.
    while (ts.isFunctionTypeNode(node) || ts.isParenthesizedTypeNode(node))
        node = node.parent;
    if (ts.isMethodDeclaration(node) ||
        ts.isMethodSignature(node) ||
        ts.isPropertySignature(node) ||
        ts.isPropertyDeclaration(node)) {
        return node;
    }
    return;
}
/** The name of the class, interface or type alias a member is declared in. */
function containerName(member) {
    // Walks up through type literals only; each of those has a parent, so the loop always ends in a return.
    for (let node = member.parent;; node = node.parent) {
        if (ts.isClassLike(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
            return node.name?.text;
        }
        if (!ts.isTypeLiteralNode(node) && !ts.isIntersectionTypeNode(node) && !ts.isParenthesizedTypeNode(node))
            return;
    }
}
/** What the symbol is, when it is an effect: "`fetch`", "`Queue#add`"; undefined otherwise. */
function effectOf(checker, symbol) {
    const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    for (const declaration of resolved.getDeclarations() ?? []) {
        // The global fetch: declared by a lib or @types file, never a local function of the same name.
        if (resolved.getName() === 'fetch' && declaration.getSourceFile().isDeclarationFile)
            return '`fetch`';
        const member = memberOf(declaration);
        if (member === undefined || !ts.isIdentifier(member.name))
            continue;
        const container = containerName(member);
        const method = member.name.text;
        if (container !== undefined && QUEUE_WRITES[container]?.includes(method))
            return `\`${container}#${method}\``;
    }
    return;
}
function carriesMarker(type) {
    return type.getProperty(MARKER) !== undefined;
}
/** Report a call inside transactional code that a rollback cannot undo. */
export const noEffectsInTransaction = createRule({
    name: 'no-effects-in-transaction',
    meta: {
        type: 'problem',
        docs: { description: 'Disallow network calls, queue writes and effects inside a database transaction' },
        messages: {
            effect: '{{what}} inside a transaction runs again on every retry and is not rolled back. Do it after the commit (a journal effect), or outside the transaction.',
        },
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        // Throws when typed linting is off: a silent no-op would look like a pass.
        const services = ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();
        const scopes = new WeakMap();
        const isTransactional = (fn) => {
            const known = scopes.get(fn);
            if (known !== undefined)
                return known;
            const marked = fn.params.some(param => {
                const type = services.getTypeAtLocation(param);
                if (carriesMarker(type))
                    return true;
                const inner = type.getProperty('context');
                return inner !== undefined && carriesMarker(checker.getTypeOfSymbol(inner));
            });
            scopes.set(fn, marked);
            return marked;
        };
        const inTransaction = (node) => context.sourceCode.getAncestors(node).some(ancestor => isFunction(ancestor) && isTransactional(ancestor));
        const describeCallee = (callee) => {
            if (staticMemberName(callee) === 'effect')
                return '`.effect()`';
            const symbols = [];
            const named = services.getSymbolAtLocation(callee.type === AST_NODE_TYPES.MemberExpression ? callee.property : callee);
            if (named !== undefined)
                symbols.push(named);
            const typed = services.getTypeAtLocation(callee).getSymbol();
            if (typed !== undefined)
                symbols.push(typed);
            for (const symbol of symbols) {
                const what = effectOf(checker, symbol);
                if (what !== undefined)
                    return what;
            }
            return;
        };
        return {
            CallExpression(node) {
                if (!inTransaction(node))
                    return;
                const what = describeCallee(node.callee);
                if (what !== undefined)
                    context.report({ node, messageId: 'effect', data: { what } });
            },
        };
    },
});
const rules = { 'no-effects-in-transaction': noEffectsInTransaction };
/** The plugin, with a flat `recommended` config that registers it as `db` and turns `db/no-effects-in-transaction` on. */
const plugin = {
    meta: { name: '@arki/db' },
    rules,
    configs: {
        recommended: {
            plugins: { db: { meta: { name: '@arki/db' }, rules } },
            rules: { 'db/no-effects-in-transaction': 'error' },
        },
    },
};
export default plugin;
//# sourceMappingURL=eslint.js.map