import { context, metrics, ROOT_CONTEXT, SpanStatusCode, trace } from '@opentelemetry/api';
import { isFailure, UnexpectedDefect } from '@arki/failure';
/** Application-owned reporting cannot change resource ownership or its outcome. */
function report(observe) {
    try {
        const result = observe();
        void Promise.resolve(result).catch(() => {
            // Also observe rejected promises from defective instrumentation.
        });
        return result;
    }
    catch {
        // Reporting is best effort.
        return undefined;
    }
}
/** Preserve the operation's exact result and run it once, even under a broken context manager. */
export async function observeDbOperation(name, run) {
    const span = startSpan(name);
    let execution;
    const execute = () => (execution ??= Promise.resolve().then(run));
    void report(() => {
        const parent = report(() => context.active());
        const active = report(() => (span === undefined ? undefined : trace.setSpan(parent ?? ROOT_CONTEXT, span)));
        if (active !== undefined)
            return context.with(active, execute);
        return;
    });
    const started = performance.now();
    let code;
    const failed = (failure) => {
        code = failure;
        report(() => span?.setAttribute('failure.code', failure));
        report(() => span?.setStatus({ code: SpanStatusCode.ERROR }));
    };
    try {
        const result = await execute();
        if (isFailure(result))
            failed(result.code);
        return result;
    }
    catch (error) {
        failed(UnexpectedDefect.code);
        throw error;
    }
    finally {
        report(() => span?.end());
        // Metrics share the bounded operation names and failure codes of the spans; no private data.
        report(() => {
            const meter = metrics.getMeter('@arki/db');
            const attributes = { operation: name, 'failure.code': code ?? 'none' };
            meter.createCounter('db.operations').add(1, attributes);
            meter.createHistogram('db.operation.duration', { unit: 's' }).record((performance.now() - started) / 1000, attributes);
        });
    }
}
/** Observe every acquired telemetry object as well as later reporter returns. */
function startSpan(name) {
    const parent = report(() => context.active());
    const tracer = report(() => trace.getTracer('@arki/db'));
    return report(() => tracer?.startSpan(name, {}, parent ?? ROOT_CONTEXT));
}
/** Synchronous file reads retain their synchronous contract and cache either terminal outcome. */
export function observeDbSyncOperation(name, run) {
    const span = startSpan(name);
    let terminal;
    let running = false;
    const execute = () => {
        if (terminal !== undefined) {
            if ('value' in terminal)
                return terminal.value;
            throw terminal.error;
        }
        if (running)
            throw new Error('Reentrant synchronous database observation.');
        running = true;
        try {
            const value = run();
            terminal = { value };
            return value;
        }
        catch (error) {
            terminal = { error };
            throw error;
        }
        finally {
            running = false;
        }
    };
    void report(() => {
        const parent = report(() => context.active());
        const active = report(() => (span === undefined ? undefined : trace.setSpan(parent ?? ROOT_CONTEXT, span)));
        if (active !== undefined)
            return context.with(active, execute);
        return;
    });
    try {
        const result = execute();
        if (isFailure(result)) {
            report(() => span?.setAttribute('failure.code', result.code));
            report(() => span?.setStatus({ code: SpanStatusCode.ERROR }));
        }
        return result;
    }
    catch (error) {
        report(() => span?.setAttribute('failure.code', UnexpectedDefect.code));
        report(() => span?.setStatus({ code: SpanStatusCode.ERROR }));
        throw error;
    }
    finally {
        report(() => span?.end());
    }
}
//# sourceMappingURL=runtime-local-telemetry.js.map