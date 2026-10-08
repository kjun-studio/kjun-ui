import { spawn } from 'node:child_process';
import { planBrowserTests } from './browser-test-profiles.mjs';

try {
  const plan = planBrowserTests(process.argv.slice(2));
  console.log(`[KJUN 검사] ${plan.description}`);
  const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', ...plan.args], {
    stdio: 'inherit',
    env: { ...process.env, KJUN_BROWSER_TEST_PROFILE: plan.profile },
  });
  child.once('error', error => { console.error(error.message); process.exitCode = 1; });
  child.once('close', code => { process.exitCode = code ?? 1; });
} catch (error) {
  console.error(`[KJUN 오류] ${error.message}`);
  process.exitCode = 1;
}
