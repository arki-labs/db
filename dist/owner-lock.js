import { defineId, z } from '@arki/contracts';
import { isFailure, UnexpectedDefect, UnexpectedFailure } from '@arki/failure';
import { debugInit } from './debug.js';
import { DataDirInUse, LocalRuntimeCleanupFailed, LocalRuntimeRefused, LocalRuntimeUnavailable, OWNER_LOCK_FAILURES, OwnerLockContended, } from './runtime-local-failures.js';
const LOCK_FILE = '.arki-owner';
/** How often to look again while another process holds the reclaim lock. */
const RECLAIM_WAIT_MS = 20;
/** Give up after this many rounds (about two seconds of reclaim contention). */
const MAX_ROUNDS = 100;
/** Internal ownership identity; restored lock bytes remain compatible with older owners. */
export const ownerId = defineId('', { kind: 'db.owner', format: 'uuid' });
const holderSchema = z.object({ pid: z.int().positive(), at: z.number(), id: ownerId.schema });
/**
 * The local path a PGlite `dataDir` writes to, or `null` when it is not a
 * file path (`memory://`, `idb://`, `opfs-ahp://`). `file://` is a file path.
 */
export function lockableDataDir(dataDir) {
    const scheme = /^([a-z][a-z\d+.-]*):\/\/(.*)$/i.exec(dataDir);
    if (scheme === null)
        return dataDir;
    const [, name, rest] = scheme;
    return name?.toLowerCase() === 'file' && rest !== undefined && rest !== '' ? rest : null;
}
function errorCode(error) {
    return error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}
/** When this process started, in epoch milliseconds. Shared by every thread of the process. */
function processStartedAt() {
    return Date.now() - process.uptime() * 1000;
}
/** True when the holder's process is gone, so its lock can be taken over. */
function isStale(holder) {
    if (holder.pid === process.pid)
        return holder.at < processStartedAt();
    try {
        // Signal 0 checks that the process exists without touching it.
        process.kill(holder.pid, 0);
        return false;
    }
    catch (error) {
        // EPERM: it exists but belongs to another user, so it is alive.
        return errorCode(error) === 'ESRCH';
    }
}
async function readLock(fs, file) {
    let text;
    try {
        text = await fs.readFile(file, 'utf8');
    }
    catch (error) {
        if (errorCode(error) === 'ENOENT')
            return 'missing';
        throw error;
    }
    try {
        const parsed = holderSchema.safeParse(JSON.parse(text));
        return parsed.success ? parsed.data : 'invalid';
    }
    catch {
        return 'invalid';
    }
}
/** Error codes of a file system without hard links (FAT, some network mounts). */
const NO_HARD_LINKS = new Set(['EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS']);
/**
 * Create `file` holding `holder`, all at once. False when it already exists.
 * Without hard links it falls back to an exclusive write, which a reader can
 * catch half-written (it reads as `invalid`, so as stale).
 */
async function createWhole(fs, file, holder) {
    const text = JSON.stringify(holder);
    const temp = `${file}.${holder.id}.tmp`;
    await fs.writeFile(temp, text, { flag: 'wx' });
    let operationCause;
    let created = false;
    try {
        try {
            await fs.link(temp, file);
            created = true;
        }
        catch (error) {
            const code = errorCode(error);
            if (code !== 'EEXIST') {
                if (code === undefined || !NO_HARD_LINKS.has(code))
                    throw error;
                created = await writeExclusive(fs, file, text);
            }
        }
    }
    catch (error) {
        operationCause = { cause: error };
    }
    try {
        await fs.rm(temp, { force: true });
    }
    catch (error) {
        throw new UnexpectedFailure(LocalRuntimeCleanupFailed({
            cause: operationCause === undefined
                ? error
                : new AggregateError([operationCause.cause, error], 'Owner lock creation and temporary cleanup failed.'),
        }));
    }
    if (operationCause !== undefined)
        throw operationCause.cause;
    return created;
}
async function writeExclusive(fs, file, text) {
    try {
        await fs.writeFile(file, text, { flag: 'wx' });
        return true;
    }
    catch (error) {
        if (errorCode(error) === 'EEXIST')
            return false;
        throw error;
    }
}
/** Remove `file` only when it still holds what we read (`expected`). */
async function removeIfUnchanged(fs, file, expected) {
    const now = await readLock(fs, file);
    const same = typeof now === 'string' || typeof expected === 'string' ? now === expected : now.id === expected.id;
    if (same && now !== 'missing')
        await fs.rm(file, { force: true });
}
/** Filesystem refusals are distinct from temporary resource exhaustion and unknown defects. */
export function classifyLocalRuntimeFailure(cause) {
    try {
        const returned = cause instanceof UnexpectedFailure ? cause.failure : cause;
        for (const definition of OWNER_LOCK_FAILURES) {
            if (definition.is(returned))
                return returned;
        }
        const code = errorCode(cause);
        if (code !== undefined &&
            ['EACCES', 'EPERM', 'EROFS', 'ENOTDIR', 'EISDIR', 'EINVAL', 'EEXIST', 'ELOOP', 'ENAMETOOLONG'].includes(code))
            return LocalRuntimeRefused({ cause });
        if (code !== undefined &&
            ['ENOSPC', 'EDQUOT', 'EMFILE', 'ENFILE', 'EIO', 'ESTALE', 'EBUSY', 'ENOENT'].includes(code))
            return LocalRuntimeUnavailable({ cause });
        return UnexpectedDefect({ cause });
    }
    catch {
        return UnexpectedDefect({ cause });
    }
}
/**
 * Take the owner lock of `dataDir` (creating the directory if needed).
 * Resolves to the release function; release is idempotent and removes the
 * lock only while it is still ours.
 *
 * Returns canonical failures; a failed release may be retried without giving up ownership.
 */
export async function acquireOwnerLock(dataDir) {
    try {
        const id = ownerId.create();
        if (isFailure(id))
            return id;
        return await takeOwnerLock(dataDir, id);
    }
    catch (error) {
        return classifyLocalRuntimeFailure(error);
    }
}
async function takeOwnerLock(dataDir, id) {
    const fs = await import('node:fs/promises');
    const { default: path } = await import('node:path');
    await fs.mkdir(dataDir, { recursive: true });
    const lockFile = path.join(dataDir, LOCK_FILE);
    const reclaimFile = `${lockFile}.reclaim`;
    const me = { pid: process.pid, at: Date.now(), id };
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
        if (await createWhole(fs, lockFile, me)) {
            let released = false;
            let releasing;
            return () => {
                if (released)
                    return Promise.resolve();
                if (releasing !== undefined)
                    return releasing;
                releasing = (async () => {
                    try {
                        await removeIfUnchanged(fs, lockFile, me);
                        released = true;
                        return;
                    }
                    catch (error) {
                        return LocalRuntimeCleanupFailed({ cause: error });
                    }
                    finally {
                        releasing = undefined;
                    }
                })();
                return releasing;
            };
        }
        const holder = await readLock(fs, lockFile);
        if (holder === 'missing')
            continue; // released between our attempt and the read
        if (holder !== 'invalid' && !isStale(holder))
            return DataDirInUse({ pid: holder.pid });
        // Stale or unreadable: take it over under the reclaim lock.
        if (!(await createWhole(fs, reclaimFile, me))) {
            const reclaimer = await readLock(fs, reclaimFile);
            if (reclaimer === 'invalid' || (reclaimer !== 'missing' && isStale(reclaimer))) {
                await removeIfUnchanged(fs, reclaimFile, reclaimer);
            }
            else if (reclaimer !== 'missing') {
                await new Promise(resolve => setTimeout(resolve, RECLAIM_WAIT_MS));
            }
            continue;
        }
        let reclaimCause;
        try {
            debugInit.debug('[runtime-local] reclaiming a stale owner lock: {lockFile}', { lockFile });
            await removeIfUnchanged(fs, lockFile, holder);
        }
        catch (error) {
            reclaimCause = { cause: error };
        }
        try {
            await fs.rm(reclaimFile, { force: true });
        }
        catch (error) {
            throw new UnexpectedFailure(LocalRuntimeCleanupFailed({
                cause: reclaimCause === undefined
                    ? error
                    : new AggregateError([reclaimCause.cause, error], 'Owner reclaim and reclaim cleanup failed.'),
            }));
        }
        if (reclaimCause !== undefined)
            throw reclaimCause.cause;
    }
    const last = await readLock(fs, lockFile);
    if (typeof last !== 'string')
        return DataDirInUse({ pid: last.pid });
    return OwnerLockContended();
}
//# sourceMappingURL=owner-lock.js.map