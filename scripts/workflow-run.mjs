import { spawn } from 'node:child_process';
import { acquireWorkflowLock } from './workflow-lock.mjs';

const [label, command, ...args] = process.argv.slice(2);
const STOP_GRACE_MS = 5000;
const controller = new AbortController();
let child;
let lock;
let stopping;
let escalation;

function send(signal) {
  if (!child?.pid) return;
  try {
    if (lock.inherited) child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

function stop(signal) {
  stopping ||= signal;
  controller.abort();
  send(signal);
  escalation ||= setTimeout(() => send('SIGKILL'), STOP_GRACE_MS).unref();
}

const onInterrupt = () => stop('SIGINT');
const onTerminate = () => stop('SIGTERM');
process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onTerminate);
try {
  if (!label || !command) throw Error('사용법: node scripts/workflow-run.mjs <작업명> <명령> [인자...]');
  lock = await acquireWorkflowLock(label, { signal: controller.signal });
  controller.signal.throwIfAborted();
  const result = await new Promise((resolve, reject) => {
    child = spawn(command, args, {
      env: lock.env,
      detached: !lock.inherited,
      // 상위 runner가 강제 종료돼도 직계 자식이 작업을 마칠 때까지 OS 잠금은 유지된다.
      stdio: lock.inherited ? 'inherit' : ['inherit', 'inherit', 'inherit', lock.fd],
    });
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  process.exitCode = stopping === 'SIGINT' ? 130 : stopping === 'SIGTERM' ? 143 : result.code ?? 1;
} catch (error) {
  if (!stopping) console.error(`[KJUN 오류] ${error.message}`);
  process.exitCode = stopping === 'SIGINT' ? 130 : stopping === 'SIGTERM' ? 143 : 1;
} finally {
  // 종료된 명령이 남긴 브라우저/서버도 같은 그룹에 속한다. 다음 작업 전에 모두 정리한다.
  if (lock && !lock.inherited) send('SIGKILL');
  clearTimeout(escalation);
  await lock?.release();
  process.off('SIGINT', onInterrupt);
  process.off('SIGTERM', onTerminate);
}
