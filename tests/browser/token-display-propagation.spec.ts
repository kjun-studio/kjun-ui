import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed independent display roles reach icons, dots, alerts and actions`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    // Native badges sit in a transparent alignment row, so the dot is one level deeper.
    const badge = page.getByTestId('badge'), dot = badge.locator(platform === 'native' ? ':scope > * > * > :empty' : ':scope > * > :empty');
    await expect(dot).toHaveCSS('width', px(tokens.extensions.badge.dotSize));
    await expect(dot).toHaveCSS('height', px(tokens.extensions.badge.dotSize));
    await page.getByRole('button', { name: '점 전환', exact: true }).click();
    await expect(dot).toHaveCount(0);
    await expect(badge).toContainText('점 있는 배지');
    await page.getByRole('button', { name: '점 전환', exact: true }).click();
    await expect(dot).toHaveCSS('width', px(tokens.extensions.badge.dotSize));
    await expect(page.getByTestId('empty').locator('svg')).toHaveCSS('width', px(tokens.extensions.empty.iconSize));
    const description = page.getByText('연결 설명', { exact: true });
    await expect(platform === 'native' ? description.locator('..') : description).toHaveCSS('margin-top', px(tokens.extensions.alert.descriptionGap));
    const close = page.getByTestId('alert').getByRole('button');
    await expect(close).toHaveCSS('width', px(tokens.extensions.alert.closeSize));
    await expect(close).toHaveCSS('height', px(tokens.extensions.alert.closeSize));
    await expect(page.getByTestId('actions').locator(':scope > *')).toHaveCSS('gap', px(tokens.modal.actionsGap));
    await page.getByRole('button', { name: '승인 연결', exact: true }).click();
    await close.click();
    await expect(page.getByTestId('alert').getByRole('alert')).toHaveCount(0);
    await expect(page.getByTestId('events')).toHaveText('2/1');
    await captureReview(page.getByTestId('empty'), { path: info.outputPath('empty-role.png') });
    await captureReview(badge, { path: info.outputPath('badge-role.png') });
  });
}
