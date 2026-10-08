import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

async function fixture(t) {
  const dir = await mkdtemp(tmpdir() + '/kjun-workflow-test-');
  await mkdir(resolve(dir, 'scripts'));
  for (const name of ['workflow-lock.mjs', 'workflow-run.mjs']) {
    await copyFile(resolve('scripts', name), resolve(dir, 'scripts', name));
  }
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

function start(t, dir, label, code, env = process.env) {
  // 테스트 작업은 별도 checkout 경로의 잠금을 사용하므로 실제 빌드와 충돌하지 않는다.
  const cleanEnv = { ...env };
  if (env === process.env) delete cleanEnv.KJUN_WORKFLOW_OWNER;
  const child = spawn(process.execPath, [resolve(dir, 'scripts/workflow-run.mjs'), label, process.execPath, '-e', code], {
    cwd: dir, env: cleanEnv, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, output }));
  });
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); await done; });
  return { child, done };
}

async function waitForFile(path) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await access(path).then(() => true, () => false)) return;
    await delay(25);
  }
  throw Error('파일 대기 시간 초과: ' + path);
}

test('two independent workflows run in order and report the current owner', { timeout: 15000 }, async t => {
  const dir = await fixture(t);
  const first = start(t, dir, 'first-build', `const fs=require('fs');fs.appendFileSync('events','first-start\\n');fs.writeFileSync('ready','');setTimeout(()=>fs.appendFileSync('events','first-end\\n'),700);`);
  await waitForFile(resolve(dir, 'ready'));
  const second = start(t, dir, 'second-test', `require('fs').appendFileSync('events','second-start\\n');`);
  assert.equal((await first.done).code, 0);
  const result = await second.done;
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /KJUN 대기.*first-build/);
  assert.equal(await readFile(resolve(dir, 'events'), 'utf8'), 'first-start\nfirst-end\nsecond-start\n');
});

test('a nested npm-style invocation reuses its ancestor lock', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  const runner = resolve(dir, 'scripts/workflow-run.mjs');
  const result = await start(t, dir, 'outer', `const {spawnSync}=require('child_process');const r=spawnSync(process.execPath,[${JSON.stringify(runner)},'inner',process.execPath,'-e','console.log("nested-ok")'],{stdio:'inherit'});process.exitCode=r.status;`).done;
  assert.equal(result.code, 0, result.output);
  assert.match(result.output, /nested-ok/);
  assert.doesNotMatch(result.output, /KJUN 대기/);
});

test('failed commands release the lock and preserve their exit code', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  assert.equal((await start(t, dir, 'failure', 'process.exitCode=7').done).code, 7);
  assert.equal((await start(t, dir, 'next', 'console.log("ok")').done).code, 0);
});

test('cancelling a waiter leaves the active owner intact', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  const owner = start(t, dir, 'owner', `require('fs').writeFileSync('ready','');setTimeout(()=>{},1300);`);
  await waitForFile(resolve(dir, 'ready'));
  const waiter = start(t, dir, 'waiter', `require('fs').writeFileSync('must-not-run','');`);
  await delay(250);
  waiter.child.kill('SIGTERM');
  assert.equal((await waiter.done).code, 143);
  assert.equal(await access(resolve(dir, 'must-not-run')).then(() => true, () => false), false);
  assert.equal((await owner.done).code, 0);
  assert.equal((await start(t, dir, 'next', '').done).code, 0);
});

test('termination cleans a stubborn descendant before the next command', { timeout: 15000 }, async t => {
  const dir = await fixture(t);
  const grandchild = `process.on('SIGTERM',()=>{});require('fs').writeFileSync('descendant',String(process.pid));setInterval(()=>{},1000)`;
  const owner = start(t, dir, 'owner', `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'inherit'});setInterval(()=>{},1000);`);
  await waitForFile(resolve(dir, 'descendant'));
  const pid = (await readFile(resolve(dir, 'descendant'), 'utf8')).trim();
  owner.child.kill('SIGTERM');
  assert.equal((await owner.done).code, 143);
  const stat = await readFile(`/proc/${pid}/stat`, 'utf8').catch(() => '');
  assert.ok(!stat || stat.slice(stat.lastIndexOf(')') + 2).startsWith('Z'), stat);
  assert.equal((await start(t, dir, 'next', '').done).code, 0);
});

test('an abruptly killed runner leaves the OS lock with its live child', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  const owner = start(t, dir, 'owner', `const fs=require('fs');fs.writeFileSync('ready','');setTimeout(()=>fs.appendFileSync('events','owner-end\\n'),1000);`);
  await waitForFile(resolve(dir, 'ready'));
  owner.child.kill('SIGKILL');
  const next = start(t, dir, 'next', `require('fs').appendFileSync('events','next\\n');`);
  await owner.done;
  assert.equal((await next.done).code, 0);
  assert.equal(await readFile(resolve(dir, 'events'), 'utf8'), 'owner-end\nnext\n');
});

test('a copied owner environment cannot bypass the lock in another process tree', { timeout: 10000 }, async t => {
  const dir = await fixture(t);
  const owner = start(t, dir, 'owner', `require('fs').writeFileSync('owner',process.env.KJUN_WORKFLOW_OWNER);setTimeout(()=>{},900);`);
  await waitForFile(resolve(dir, 'owner'));
  const inherited = await readFile(resolve(dir, 'owner'), 'utf8');
  const other = await start(t, dir, 'other', 'console.log("must-not-run")', { ...process.env, KJUN_WORKFLOW_OWNER: inherited }).done;
  assert.equal(other.code, 1);
  assert.match(other.output, /잠금이 유효하지/);
  assert.doesNotMatch(other.output, /must-not-run/);
  await owner.done;
});
