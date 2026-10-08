import { build } from 'esbuild';
import { resolve } from 'node:path';
import { usageTools } from './usage-tools.mjs';
const root = resolve(import.meta.dirname, '..');
export async function buildUsageGenerators() {
  // No shared chunks: a retry URL must retry the complete failed category.
  await build({ entryPoints: Object.fromEntries(usageTools.usageCategories.map(group => [group, resolve(root, 'shared/usage-examples', group + '.ts')])),
    outdir: resolve(root, 'apps/docs/public/previews/usage'), bundle: true, splitting: false, format: 'esm', platform: 'browser', target: 'es2020', minify: true,
  });
  console.log(`Built ${usageTools.usageCategories.length} independently retryable usage generator categories.`);
}
if (process.argv[1] === import.meta.filename) await buildUsageGenerators();
