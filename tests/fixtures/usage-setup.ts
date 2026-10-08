import assert from 'node:assert/strict';
import type { PlatformName } from '../../shared/demo-config';
import type { SetupFile, usageSetupAdditions } from '../../shared/usage-examples/setup';

// Apply the guide's additive instructions to copied files, independently of its assembler.
export function applySetupAdditions(platform: PlatformName, base: SetupFile[], additions: ReturnType<typeof usageSetupAdditions>, flags: { feedback: boolean; domainColors: boolean }) {
  const files = base.map(file => ({ ...file }));
  const app = files[0], colors = files[1];
  const replace = (from: string, to: string) => {
    assert.equal(app.code.split(from).length, 2, `Expected one setup insertion point: ${from}`);
    app.code = app.code.replace(from, to);
  };
  if (flags.feedback) {
    const imported = `import { KjunProvider } from "@kjun-ui/${platform}";`;
    replace(imported, imported + '\n' + additions.feedback.imports);
    if (platform === 'vue2') replace('components: { KjunProvider, Example }', `components: { KjunProvider, ${additions.feedback.registration} Example }`);
    const indent = ' '.repeat(platform === 'vue2' ? 4 : 6);
    replace(indent + '<Example />', additions.feedback.content.split('\n').map(line => indent + line).join('\n'));
  }
  if (flags.domainColors) {
    colors.code += '\n' + additions.domainColors.file.code;
    if (platform === 'native') {
      const imported = 'import { appColors, appFont } from "./kjun";';
      replace(imported, imported + '\n' + additions.domainColors.imports);
      replace('fontFamily={appFont}', 'fontFamily={appFont} ' + additions.domainColors.prop);
    }
  }
  return files;
}
