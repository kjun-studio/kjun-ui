import { test, expect } from '@playwright/test';
// @ts-ignore Shared recorded procedures also run in Firefox and WebKit here.
import { definitions } from '../../shared/accessibility-guides/index.mjs';
// @ts-ignore
import { openCase } from '../../scripts/a11y/context.mjs';
// @ts-ignore
import { verifyKeyboard } from '../../scripts/a11y/keyboard.mjs';
// @ts-ignore
import { verifyLabeling } from '../../scripts/a11y/labeling.mjs';
// @ts-ignore
import { verifyFocus } from '../../scripts/a11y/focus.mjs';
const cases = ['DsTabs', 'DsTabPane', 'DsModal', 'DsInput', 'DsFormGroup', 'DsButton', 'DsTextarea', 'DsCheckbox', 'DsSwitch', 'DsRadioGroup']
  .flatMap(component => ['react', 'vue2', 'native'].map(platform => ({ component, platform })));
cases.push({ component: 'DsTimePicker', platform: 'react' }, { component: 'DsTimePicker', platform: 'vue2' }, { component: 'DsTooltip', platform: 'vue2' });
for (const { component, platform } of cases) {
    test(`${platform}: ${component} keyboard, name and focus contracts`, async ({ page }) => {
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      for (const definition of definitions().filter((d: any) => d.component === component && d.platform === platform && d.applicable)) {
        await openCase(page, definition);
        await ({ keyboard: verifyKeyboard, labeling: verifyLabeling, focus: verifyFocus } as any)[definition.item](page, definition, () => {});
      }
      expect(errors).toEqual([]);
    });
}
