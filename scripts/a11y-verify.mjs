import { chromium, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { platform, arch, release } from 'node:os';
import { resolve } from 'node:path';
import { assertCurrentConsumer } from './package-state.mjs';
import { definitions } from '../shared/accessibility-guides/index.mjs';
import { definitionHash, json, root } from './a11y/records.mjs';
import { generateAccessibility } from './accessibility.mjs';
import { openCase } from './a11y/context.mjs';
import { verifyKeyboard } from './a11y/keyboard.mjs';
import { verifyLabeling } from './a11y/labeling.mjs';
import { verifyFocus } from './a11y/focus.mjs';
process.chdir(root);
expect.configure({ timeout: 1800 });
const arg = key => { const index = process.argv.indexOf(key); return index < 0 ? null : process.argv[index + 1]; };
const onlyComponent = arg('--component'), onlyPlatform = arg('--platform');
const defs = definitions();
if (onlyComponent && !defs.some(def => def.component === onlyComponent)) throw Error('Unknown component filter');
if (onlyPlatform && !['react', 'vue2', 'native'].includes(onlyPlatform)) throw Error('Unknown platform filter');
const startedAt = new Date().toISOString();
const run = {
  schemaVersion: 1, id: 'a11y-' + startedAt.replace(/[-:.]/g, '') + '-' + randomBytes(4).toString('hex'),
  startedAt, finishedAt: startedAt, definitionHash: await definitionHash(),
  environment: { os: platform() + ' ' + release(), architecture: arch(), node: process.version,
    browser: 'not-started', playwright: (await json('node_modules/@playwright/test/package.json')).version,
    runtimes: {}, viewport: { width: 1280, height: 900 }, locale: 'ko-KR', timezone: 'Asia/Seoul' },
  packages: [], devices: { ios: 'not-run', android: 'not-run' }, screenReader: 'not-run', setupError: null,
  results: defs.map(def => ({ id: def.id, component: def.component, platform: def.platform, item: def.item,
    status: def.applicable ? 'not-run' : 'not-applicable', startedAt: null, finishedAt: null,
    procedure: def.procedure, expected: def.expected, actual: def.applicable ? '실행 대기 또는 실행 필터 범위 밖' : def.reason,
    reason: def.applicable ? '검사가 아직 실행되지 않았습니다.' : def.reason, observations: [] })),
};
let browser;
try {
  // Always prepare current tarballs and a fresh independent consumer; no docs server is started.
  if (!process.argv.includes('--prepared')) for (const command of ['build:packages', 'pack:local', 'verify:consumers', 'examples:generate'])
    execFileSync('npm', ['run', command], { stdio: 'inherit' });
  run.packages = await json('artifacts/manifest.json');
  const { directory } = await assertCurrentConsumer();
  const lock = JSON.parse(await readFile(resolve(directory, 'package-lock.json'), 'utf8'));
  for (const pkg of run.packages) {
    const bytes = await readFile(resolve(root, 'artifacts', pkg.file));
    const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
    if (integrity !== pkg.integrity || lock.packages['node_modules/' + pkg.name]?.integrity !== integrity)
      throw Error('Packed/installed integrity mismatch: ' + pkg.name);
  }
  for (const name of ['react', 'vue', 'react-native', 'react-native-web', 'react-aria-components']) {
    const pkg = JSON.parse(await readFile(resolve(directory, 'node_modules', name, 'package.json'), 'utf8'));
    run.environment.runtimes[name] = pkg.version;
  }
  browser = await chromium.launch(); run.environment.browser = 'Chromium ' + browser.version();
  let completed = 0;
  for (const def of defs) {
    if (!def.applicable || (onlyComponent && def.component !== onlyComponent) || (onlyPlatform && def.platform !== onlyPlatform)) continue;
    const result = run.results.find(result => result.id === def.id);
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4179', viewport: run.environment.viewport,
      locale: run.environment.locale, timezoneId: run.environment.timezone, permissions: ['clipboard-read', 'clipboard-write'] });
    // Match the packed fixture's initial ready window; behavior assertions keep
    // their own shorter timeout after the consumer has initialized.
    const page = await context.newPage(); page.setDefaultTimeout(2200); page.setDefaultNavigationTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let timer;
    result.startedAt = new Date().toISOString();
    try {
      await Promise.race([(async () => {
        await openCase(page, def);
        await ({ keyboard: verifyKeyboard, labeling: verifyLabeling, focus: verifyFocus })[def.item](page, def, message => result.observations.push(message));
        if (def.profile !== 'boundary') expect(errors, 'Uncaught consumer errors').toEqual([]);
      })(), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Check exceeded 25 seconds')), 25000); })]);
      result.status = 'passed'; result.actual = result.observations.join('; ') || '명시한 의미·상태·키보드 단언을 모두 확인했습니다.'; result.reason = null;
    } catch (error) {
      result.status = 'failed'; result.actual = '명시된 검사 조건을 충족하지 못했습니다.';
      result.reason = String(error.stack || error).replace(/\u001b\[[0-9;]*m/g, '').slice(0, 6500);
      result.observations.push('실패 당시 접근성 트리:\n' + await page.locator('body').ariaSnapshot({ timeout: 1000 }).catch(() => '캡처 불가'));
    } finally {
      clearTimeout(timer); result.finishedAt = new Date().toISOString(); await context.close();
    }
    completed++;
    if (result.status === 'failed') console.log('FAIL ' + def.id + ': ' + result.reason.split('\n').slice(0, 2).join(' '));
    else if (completed % 30 === 0) console.log('Checked ' + completed + ' applicable items');
  }
} catch (error) {
  run.setupError = String(error.stack || error);
  for (const result of run.results.filter(result => result.status === 'not-run')) result.actual = result.reason = '검사 준비/실행 중단: ' + run.setupError;
} finally {
  await browser?.close(); run.finishedAt = new Date().toISOString();
  await mkdir(resolve(root, 'docs/accessibility-runs'), { recursive: true });
  const path = resolve(root, 'docs/accessibility-runs', run.id + '.json');
  // Exclusive creation keeps failed runs and reruns immutable.
  await writeFile(path, JSON.stringify(run, null, 2) + '\n', { flag: 'wx' });
  console.log('Saved ' + path);
  await generateAccessibility();
}
const counts = Object.fromEntries(['passed', 'failed', 'not-run', 'not-applicable'].map(status => [status, run.results.filter(result => result.status === status).length]));
console.log(JSON.stringify(counts));
if (run.setupError || counts.failed) process.exitCode = 1;
