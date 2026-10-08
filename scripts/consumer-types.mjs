import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

export async function verifyConsumerTypes(root, directory) {
  const tsc = resolve(root, 'node_modules/.bin/tsc');
  const catalog = JSON.parse(await readFile(resolve(root, 'shared/component-catalog.json'), 'utf8'));
  const publicNames = [...catalog.filter(item => item.kind !== 'internal').map(item => item.name), 'KjunProvider', 'KjunFeedbackProvider'];
  const common = ['--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2018', '--esModuleInterop'];
  for (const format of ['esm', 'cjs']) {
    const target = resolve(directory, 'types-' + format);
    await mkdir(target, { recursive: true });
    await writeFile(target + '/package.json', JSON.stringify({ type: format === 'esm' ? 'module' : 'commonjs' }));
    let source = await readFile(resolve(root, 'tests/fixtures/consumer-types.ts'), 'utf8');
    source += '\n' + ['R', 'N', 'V'].map(namespace => 'void [' + publicNames.map(name => namespace + '.' + name).join(', ') + '];').join('\n');
    if (format === 'cjs') source = source
      .replace(/import \* as (\w+) from ('[^']+');/g, 'import $1 = require($2);')
      .replace("import { tokens, type KjunColors, type InputSize } from '@kjun-ui/tokens';", "import T = require('@kjun-ui/tokens'); const { tokens } = T; type KjunColors = T.KjunColors; type InputSize = T.InputSize;")
      .replace("import { icons, type IconNode } from '@kjun-ui/tokens/icons';", "import I = require('@kjun-ui/tokens/icons'); const { icons } = I; type IconNode = I.IconNode;");
    await writeFile(target + '/consumer.' + (format === 'esm' ? 'mts' : 'cts'), source);
    await writeFile(target + '/plugin.' + (format === 'esm' ? 'mts' : 'cts'), format === 'esm'
      ? `import plugin from '@kjun-ui/vue2/plugin';\nimport { type VueConstructor } from 'vue';\ndeclare const Vue: VueConstructor;\nplugin.install(Vue);\n// @ts-expect-error plugin is a typed install object.\nplugin.missing();\n`
      : `import plugin = require('@kjun-ui/vue2/plugin');\nimport { type VueConstructor } from 'vue';\ndeclare const Vue: VueConstructor;\nplugin.install(Vue);\n// @ts-expect-error CommonJS exports the install object itself.\nplugin.default.install(Vue);\n// @ts-expect-error plugin is not any.\nplugin.missing();\n`);
    for (const resolution of ['Bundler', 'Node16', 'NodeNext']) {
      execFileSync(tsc, ['consumer.' + (format === 'esm' ? 'mts' : 'cts'), 'plugin.' + (format === 'esm' ? 'mts' : 'cts'), ...common,
        '--moduleResolution', resolution, '--module', resolution === 'Bundler' ? 'Preserve' : resolution],
      { cwd: target, stdio: 'inherit' });
      console.log(`Packed types verified: ${resolution} / ${format}`);
    }
  }
}
