import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px } from './token-propagation-helpers';

test.describe('touch choice dimensions', () => {
  test.use({ hasTouch: true, viewport: { width: 900, height: 1600 } });
  for (const platform of ['react', 'vue3', 'native']) {
    test(`${platform}: packed choice dimensions and minimum targets follow their tokens`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, platform, '', 'token-followup');
      for (const size of ['sm', 'md', 'lg'] as const) {
        const section = page.getByTestId(`checkbox-${size}`);
        const checkbox = section.getByRole('checkbox');
        const hit = platform === 'native' ? checkbox : section.locator('.kjun-choice');
        const box = platform === 'native' ? checkbox.locator(':scope > *').first() : section.locator('.kjun-checkbox');
        await expect(hit).toHaveCSS('min-height', px(tokens.native.minimumTouchTarget));
        await expect(box).toHaveCSS('width', px(tokens.extensions.checkbox.sizes[size]));
        await expect(box).toHaveCSS('height', px(tokens.extensions.checkbox.sizes[size]));
        await box.click(); await expect(checkbox).toBeChecked();
        await expect(box.locator('svg')).toHaveCSS('width', px(tokens.extensions.checkbox.iconSizes[size]));
        const toggleSection = page.getByTestId(`switch-${size}`);
        const toggle = toggleSection.getByRole('switch');
        const target = platform === 'native' ? toggle : toggleSection.locator('.kjun-choice');
        const track = platform === 'native' ? toggle.locator(':scope > *').first() : toggleSection.locator('.kjun-switch');
        // Native draws the off boundary as an overlay before the thumb, so the thumb is the last child.
        const thumb = track.locator(':scope > *').last();
        const geometry = tokens.extensions.switch, border = tokens.border.controlWidth;
        await expect(target).toHaveCSS('min-height', px(tokens.native.minimumTouchTarget));
        await expect(track).toHaveCSS('width', px(geometry.widths[size]));
        await expect(track).toHaveCSS('height', px(geometry.heights[size]));
        // Rendered boxes: off thumbs clear the inset boundary (Native scales, Web resizes) and grow when on.
        const center = (box: { x: number; width: number }) => box.x + box.width / 2;
        await expect.poll(async () => (await thumb.boundingBox())!.width).toBeCloseTo(geometry.heights[size] - 2 * (geometry.padding + border), 1);
        const initial = (await thumb.boundingBox())!;
        expect(initial.x - (await track.boundingBox())!.x - border).toBeCloseTo(geometry.padding, 1);
        await track.click(); await expect(toggle).toBeChecked();
        await expect.poll(async () => center((await thumb.boundingBox())!) - center(initial)).toBeCloseTo(geometry.widths[size] - geometry.heights[size], 1);
        await expect.poll(async () => (await thumb.boundingBox())!.height).toBeCloseTo(geometry.heights[size] - 2 * geometry.padding, 1);
        const [trackBox, thumbBox] = await Promise.all([track.boundingBox(), thumb.boundingBox()]);
        expect(trackBox!.x + trackBox!.width - thumbBox!.x - thumbBox!.width).toBeCloseTo(geometry.padding, 1);
      }
      const input = page.getByRole('textbox', { name: '터치 입력' });
      await input.fill('연결 확인'); await expect(input).toHaveValue('연결 확인');
      if (platform === 'native') {
        const target = input.locator('..');
        await expect(target).toHaveCSS('min-height', px(tokens.native.minimumTouchTarget));
        await input.blur();
        await target.click({ position: { x: 1, y: 1 } });
        await expect(input).toBeFocused();
      }
      await captureReview(page, { path: testInfo.outputPath('choice-tokens.png'), fullPage: true });
    });
  }
});
