// Builds the docs app, serves that build on its own port and runs the docs Playwright suite
// against it, so tests never hit the on-demand compiling dev server or a stale build.
import { spawn } from 'node:child_process';
import { assertDocsPortFree, planDocsTests } from './docs-test-profiles.mjs';

const port = process.env.KJUN_DOCS_TEST_PORT || '4174';
const url = `http://127.0.0.1:${port}`;
const SERVER_TIMEOUT_MS = 120000;
const REQUEST_TIMEOUT_MS = 5000;
const READY_POLL_MS = 500;
const plan = planDocsTests(process.argv.slice(2));
const env = { ...process.env, KJUN_TEST_URL: url, KJUN_DOCS_TEST_PROFILE: plan.profile };
console.log(`[KJUN 검사] ${plan.description}`);
const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  child.once('error', reject);
  child.once('close', (code, signal) => code === 0 ? resolve() : reject(Error(`${command} ${args.join(' ')} exited with ${signal || code}`)));
});

if (plan.listOnly) {
  await run('node', ['node_modules/@playwright/test/cli.js', ...plan.args], { env });
} else {
  await assertDocsPortFree(url);
  // Serial suites run for tens of minutes; give preview frames 30s to report ready in the test build.
  await run('npm', ['--prefix', 'apps/docs', 'run', 'build'], { env: { ...process.env, KJUN_PREVIEW_READY_MS: '30000' } });
  await assertDocsPortFree(url); // 빌드하는 동안 다른 서버가 포트를 차지했을 수 있다.
  const server = spawn('node', ['node_modules/vinext/dist/cli.js', 'start', '--port', port, '--hostname', '127.0.0.1'],
    { cwd: 'apps/docs', stdio: ['ignore', 'ignore', 'inherit'] });
  let serverError;
  server.once('error', error => { serverError = error; });
  try {
    const deadline = Date.now() + SERVER_TIMEOUT_MS;
    for (;;) {
      if (serverError) throw serverError;
      if (server.exitCode !== null) throw Error('Docs test server exited before becoming ready');
      if (await fetch(url + '/', { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).then(response => response.ok, () => false)) break;
      if (Date.now() > deadline) throw Error('Docs test server did not start at ' + url);
      await new Promise(resolve => setTimeout(resolve, READY_POLL_MS));
    }
    await run('node', ['node_modules/@playwright/test/cli.js', ...plan.args], { env });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
}
