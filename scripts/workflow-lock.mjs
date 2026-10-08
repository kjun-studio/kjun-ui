import { createHash, randomUUID } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const POLL_MS = 500;
const NOTICE_MS = 15000;
const BUSY_EXIT = 75;
const OWNER_ENV = 'KJUN_WORKFLOW_OWNER';
const root = realpathSync(resolve(import.meta.dirname, '..'));
const key = createHash('sha256').update(root).digest('hex').slice(0, 16);
const lockPath = resolve(tmpdir(), `kjun-workflow-${key}.lock`);
const metadataPath = lockPath + '.json';

async function processIdentity(pid) {
  const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
  const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
  return { parent: Number(fields[1]), started: fields[19] };
}

async function isAncestor(owner) {
  let pid = process.pid;
  while (pid > 1) {
    const identity = await processIdentity(pid);
    if (pid === owner.pid) return identity.started === owner.started;
    pid = identity.parent;
  }
  return false;
}

const readOwner = () => readFile(metadataPath, 'utf8').then(JSON.parse).catch(() => null);

export async function acquireWorkflowLock(label, { signal, report = console.log } = {}) {
  if (process.platform !== 'linux') throw Error('KJUN 작업은 kjun_ui_dev Docker 컨테이너에서 실행하세요.');
  signal?.throwIfAborted();
  const inherited = process.env[OWNER_ENV];
  if (inherited) {
    const owner = JSON.parse(inherited);
    const current = await readOwner();
    // npm의 중첩 호출만 재진입한다. 이전 실행의 환경값이나 무관한 프로세스는 잠금을 우회할 수 없다.
    if (owner.path !== lockPath || current?.token !== owner.token || !await isAncestor(owner).catch(() => false)) {
      throw Error('상위 KJUN 작업의 잠금이 유효하지 않습니다. 새 작업으로 다시 실행하세요.');
    }
    return { inherited: true, env: { ...process.env }, release: async () => {} };
  }

  const file = await open(lockPath, 'a+');
  let acquired = false;
  try {
    let noticeAt = 0;
    while (!acquired) {
      signal?.throwIfAborted();
      // flock은 상속한 파일 설명에 잠금을 건다. 파일을 지우지 않아 대기자와 inode가 갈라지지 않는다.
      const result = spawnSync('flock', ['-n', '-E', String(BUSY_EXIT), '3'], {
        stdio: ['ignore', 'ignore', 'pipe', file.fd],
      });
      if (result.error) throw result.error;
      if (result.status === 0) { acquired = true; break; }
      if (result.status !== BUSY_EXIT) throw Error(`flock 실행 실패: ${result.stderr?.toString().trim()}`);
      if (Date.now() >= noticeAt) {
        const owner = await readOwner();
        const elapsed = owner ? ` · ${Math.floor((Date.now() - owner.since) / 1000)}초 경과` : '';
        report(`[KJUN 대기] ${label} ← ${owner?.label || '다른 작업'}${elapsed}`);
        noticeAt = Date.now() + NOTICE_MS;
      }
      await delay(POLL_MS, undefined, { signal });
    }
    signal?.throwIfAborted();
    const identity = await processIdentity(process.pid);
    const owner = { path: lockPath, pid: process.pid, started: identity.started, token: randomUUID(), label, since: Date.now() };
    await writeFile(metadataPath, JSON.stringify(owner));
    report(`[KJUN 실행] ${label}`);
    let released = false;
    return {
      inherited: false,
      fd: file.fd,
      env: { ...process.env, [OWNER_ENV]: JSON.stringify(owner) },
      async release() {
        if (released) return;
        released = true;
        try { await rm(metadataPath, { force: true }); }
        finally { await file.close(); }
      },
    };
  } catch (error) {
    if (acquired) await rm(metadataPath, { force: true });
    await file.close();
    throw error;
  }
}
