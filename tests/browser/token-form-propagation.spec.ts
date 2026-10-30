import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px, fieldTypography, typography } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed remaining geometry and state roles reach interactive components`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-completion');
    const outer = (id: string) => page.getByTestId(id).locator(':scope > *').first();
    await expect(outer('form')).toHaveCSS('margin-bottom', px(tokens.extensions.form.itemGap));
    const input = page.getByRole('textbox', { name: '입력 검사' });
    await input.fill('토큰 변경 후에도 입력 가능');
    await expect(input).toHaveValue('토큰 변경 후에도 입력 가능');
    await expect(input).toHaveCSS('border-top-width', px(tokens.border.controlWidth));
    await expect(input).toHaveCSS('padding-left', px(tokens.input.md.padding - tokens.border.controlWidth));
    const button = page.getByRole('button', { name: '실행 가능' });
    await expect(button).toHaveCSS('gap', px(tokens.button.contentGaps.md));
    const disabled = page.getByRole('button', { name: '실행 불가' });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveCSS('opacity', '1');
    await input.focus(); await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS('outline-width', px(tokens.states.focus.width));
    await expect(button).toHaveCSS('outline-offset', px(tokens.states.focus.offset));
    await page.keyboard.press('Tab');
    const checkbox = page.getByRole('checkbox', { name: '작은 선택' });
    await expect(checkbox).toBeFocused();
    const checkboxBox = platform === 'native' ? checkbox.locator(':scope > *').first() : page.getByTestId('checkbox').locator('.kjun-checkbox');
    await expect(checkboxBox).toHaveCSS('border-radius', px(tokens.extensions.checkbox.radii.sm));
    if (platform === 'native') await checkbox.click();
    else await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    const toggle = page.getByRole('switch', { name: '사용 설정' });
    const track = platform === 'native' ? toggle.locator(':scope > *').first() : page.getByTestId('switch').locator('.kjun-switch');
    await expect(track).toHaveCSS('padding-top', px(tokens.extensions.switch.padding));
    // Native draws the off boundary as an overlay before the thumb, so the thumb is the last child.
    const thumb = track.locator(':scope > *').last();
    const trackHeight = parseFloat(await track.evaluate(el => getComputedStyle(el).height));
    const { padding } = tokens.extensions.switch, border = tokens.border.controlWidth;
    // Rendered boxes: Native scales its thumb, Web resizes it.
    const boxes = async () => { const [trackBox, thumbBox] = await Promise.all([track.boundingBox(), thumb.boundingBox()]); return { trackBox: trackBox!, thumbBox: thumbBox! }; };
    // Off: the thumb also clears the inset boundary, so its gap to the border matches the on-state padding.
    await expect.poll(async () => (await boxes()).thumbBox.height).toBeCloseTo(trackHeight - 2 * (padding + border), 1);
    await expect.poll(async () => { const { trackBox, thumbBox } = await boxes(); return thumbBox.x - trackBox.x - border; }).toBeCloseTo(padding, 1);
    await track.click(); await expect(toggle).toBeChecked();
    await expect.poll(async () => (await boxes()).thumbBox.width).toBeCloseTo(trackHeight - 2 * padding, 1);
    await expect.poll(async () => {
      const { trackBox, thumbBox } = await boxes();
      return trackBox.x + trackBox.width - thumbBox.x - thumbBox.width;
    }).toBeCloseTo(padding, 1);
    await expect(outer('signed')).toHaveCSS('border-radius', px(tokens.extensions.financial.pillRadius));
    await expect(outer('signed')).toHaveCSS('padding-left', px(tokens.extensions.financial.pillPaddingX));
    await expect(outer('progress')).toHaveCSS('gap', px(tokens.extensions.financial.progressGap));
    await expect(outer('pagination')).toHaveCSS('padding-left', px(tokens.extensions.pagination.padding));
    await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
    await expect(page.getByTestId('values')).toHaveText('true/true/2');
    await captureReview(page, { path: testInfo.outputPath('geometry-state.png'), fullPage: true });
  });

  test(`${platform}: packed independent field roles preserve typography, affixes and editing`, async ({ page }) => {
    await openFixture(page, platform, '', 'token-connections');
    for (const scale of platform === 'native' ? [1] : [1, 1.25]) {
      await page.evaluate(scale => document.documentElement.style.fontSize = 16 * scale + 'px', scale);
      for (const size of ['sm', 'md', 'lg'] as const) {
        const input = page.getByRole('textbox', { name: '필드 ' + size, exact: true });
        const textarea = page.getByRole('textbox', { name: '메모 ' + size, exact: true });
        const quantity = page.getByRole('spinbutton', { name: '수량 ' + size, exact: true });
        for (const node of [input, textarea, quantity, page.getByText('선택된 값 ' + size, { exact: true })]) await fieldTypography(node, size, scale);
        const spec = tokens.input[size];
        await expect(input).toHaveCSS('padding-left', px(spec.padding + spec.iconSize + spec.affixGap - tokens.border.controlWidth));
        const minimum = Math.max(spec.height, spec.lineHeight * 2 + spec.textareaPaddingY * 2 + 2 * tokens.border.controlWidth);
        await expect(textarea).toHaveCSS('min-height', px(minimum));
      }
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '16px');
    const input = page.getByRole('textbox', { name: '필드 md', exact: true });
    await input.fill('수정한 입력'); await expect(input).toHaveValue('수정한 입력');
    const duration = await input.evaluate(el => getComputedStyle(el).transitionDuration.split(',')[0]);
    expect(parseFloat(duration) * 1000).toBe(tokens.motion.control);
    const quantity = page.getByRole('spinbutton', { name: '수량 md', exact: true });
    await quantity.focus(); await page.keyboard.press('ArrowUp');
    await expect(quantity).toHaveValue('3');
  });
}
