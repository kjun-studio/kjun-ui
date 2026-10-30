import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const schema = 1;
const statePath = 'artifacts/docs-test-build.json';
const inputRoots = ['apps/docs', 'shared', 'previews', 'scripts', 'package.json', 'package-lock.json', 'tsconfig.json', 'artifacts/manifest.json'];
const optionalInputs = ['.env', '.env.local', '.env.production', '.env.production.local', '.npmrc',
  'node_modules/.package-lock.json', 'apps/docs/node_modules/.package-lock.json'];
const excludedDirectories = new Set(['node_modules', 'dist', '.next', '.vinext', '.vite', '.wrangler', '.git']);
const requiredOutputs = ['server/index.js', 'server/BUILD_ID', 'server/vinext-server.json', 'client/vinext-client-entry-manifest.json'];
const launchEnvironment = new Set(['KJUN_WORKFLOW_OWNER', 'KJUN_DOCS_TEST_PROFILE', 'KJUN_DOCS_TEST_PORT',
  'KJUN_TEST_URL', 'KJUN_REVIEW_CAPTURES', 'PWD', 'OLDPWD', 'INIT_CWD', 'SHLVL', '_']);
const digest = value => createHash('sha256').update(value).digest('hex');

// Read content, not mtime: additions, deletions and same-size replacements all invalidate reuse.
// Store only aggregate hashes, including for .env files and environment values.
async function fingerprintFiles(root, entries, { optional = [], filter = false } = {}) {
  const files = [];
  async function visit(path, allowMissing = false) {
    const absolute = resolve(root, path);
    let info;
    try { info = await lstat(absolute); }
    catch (error) { if (allowMissing && error.code === 'ENOENT') return; throw error; }
    if (info.isSymbolicLink()) throw Error(`문서 빌드 입력/산출물에 지원하지 않는 심볼릭 링크가 있습니다: ${path}`);
    if (info.isDirectory()) {
      for (const entry of (await readdir(absolute)).sort()) {
        if (filter && (excludedDirectories.has(entry) || entry === '.DS_Store' || entry.endsWith('.tsbuildinfo'))) continue;
        await visit(path + '/' + entry);
      }
    } else if (info.isFile()) files.push(path);
    else throw Error(`문서 빌드 입력/산출물이 일반 파일이 아닙니다: ${path}`);
  }
  for (const entry of entries) await visit(entry);
  for (const entry of optional) await visit(entry, true);
  files.sort();
  const hash = createHash('sha256');
  for (let i = 0; i < files.length; i += 16) {
    const batch = await Promise.all(files.slice(i, i + 16).map(async path => [path, digest(await readFile(resolve(root, path)))]));
    for (const item of batch) hash.update(JSON.stringify(item) + '\n');
  }
  return hash.digest('hex');
}

async function inputs(root, env) {
  const environment = Object.fromEntries(Object.entries(env)
    .filter(([key]) => !launchEnvironment.has(key) && !/^npm_|^PLAYWRIGHT_/i.test(key))
    .sort(([a], [b]) => a.localeCompare(b)));
  return digest(JSON.stringify({ schema, node: process.version, platform: process.platform, arch: process.arch,
    environment, files: await fingerprintFiles(root, inputRoots, { optional: optionalInputs, filter: true }) }));
}

async function outputs(root) {
  for (const path of requiredOutputs) {
    const info = await stat(resolve(root, 'apps/docs/dist', path));
    if (!info.isFile() || info.size === 0) throw Error(`문서 빌드 산출물이 불완전합니다: ${path}`);
  }
  return fingerprintFiles(root, ['apps/docs/dist']);
}

async function readState(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' || error instanceof SyntaxError) return null; throw error; }
}

// Call under the existing workflow lock. verify always checks current packed packages and their
// installed docs consumer, even on a cache hit. build uses the normal locked docs build script.
export async function ensureDocsBuild({ root, env, verify, build, report = console.log }) {
  const started = performance.now();
  const path = resolve(root, statePath);
  await verify();
  const before = await inputs(root, env);
  const state = await readState(path);
  let reason = '재사용 기록 없음';
  if (state?.schema === schema && typeof state.inputs === 'string' && typeof state.outputs === 'string') {
    reason = '입력 변경';
    if (state.inputs === before) {
      reason = '산출물 누락 또는 변경';
      let current;
      try { current = await outputs(root); }
      catch (error) { if (error.code !== 'ENOENT' && !error.message.startsWith('문서 빌드 산출물이 불완전')) throw error; }
      if (current === state.outputs) {
        // A source edit during output verification must not serve the old build.
        if (await inputs(root, env) !== before) throw Error('문서 빌드 입력이 검사 중 변경됐습니다. 다시 실행하세요.');
        const elapsedMs = Math.round(performance.now() - started);
        report(`[KJUN 문서 빌드] 재사용 · 입력·산출물 일치 (${elapsedMs}ms)`);
        return { reused: true, elapsedMs };
      }
    }
  }
  report(`[KJUN 문서 빌드] 새 빌드 · ${reason}`);
  // Clear the marker before attempting a build. Failed/interrupted builds are never reusable.
  await rm(path, { force: true });
  await build();
  const output = await outputs(root);
  if (await inputs(root, env) !== before) throw Error('문서 빌드 도중 입력이 변경됐습니다. 다시 실행하세요.');
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temporary, JSON.stringify({ schema, inputs: before, outputs: output, builtAt: new Date().toISOString() }) + '\n');
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
  const elapsedMs = Math.round(performance.now() - started);
  report(`[KJUN 문서 빌드] 빌드 완료 · 재사용 기록 저장 (${elapsedMs}ms)`);
  return { reused: false, reason, elapsedMs };
}
