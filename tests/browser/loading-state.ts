import { expect, type Locator } from '@playwright/test';

// A loading button keeps focus and refuses presses: aria-busy, plus aria-disabled on the web. React Native Web's Pressable
// writes aria-disabled from `disabled` alone, so a loading Native button shows aria-busy only.
export async function expectBusy(control: Locator, platform: string) {
  await expect(control).toHaveAttribute('aria-busy', 'true');
  if (platform !== 'native') await expect(control).toBeDisabled();
}
// Loading has ended, its minimum time included, so a press reaches the action again. Native is enabled throughout
// loading, so check aria-busy before pressing rather than relying on Playwright waiting for an enabled control.
export async function expectIdle(control: Locator) {
  await expect(control).not.toHaveAttribute('aria-busy', 'true');
  await expect(control).toBeEnabled();
}
