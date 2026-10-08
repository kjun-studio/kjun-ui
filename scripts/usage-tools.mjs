import { build } from 'esbuild';
import { resolve } from 'node:path';
const bundled = await build({
  stdin: { contents: 'export * from "./shared/usage-examples/index.ts"; export * from "./shared/usage-examples/setup.ts"; export * from "./shared/implementation-examples.ts";', resolveDir: resolve(import.meta.dirname, '..'), loader: 'ts' },
  bundle: true, write: false, platform: 'node', format: 'esm', target: 'node24',
});
export const usageTools = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
