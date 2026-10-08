import { test, expect, type Locator, type Page } from '@playwright/test';
import { tokens, type TypographyToken } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
// Packed token roles reach rendered components. scripts/token-mutation.mjs reruns this file with changed tokens.
const px = (value: number) => value + 'px';
const platforms = ['react', 'vue2', 'native'];

// Table spacing and control motion
for (const platform of ['react','vue2','native']) {
  test(`${platform}: packed table spacing and control motion follow token changes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'token-application');
    for (const density of ['regular','compact'] as const) {
      const region = page.getByTestId(density);
      const cell = platform === 'native' ? region.getByText('문서', { exact: true }).locator('..') : region.locator('tbody td').first();
      const header = platform === 'native' ? region.getByText('이름', { exact: true }).locator('..') : region.locator('thead th').first();
      await expect(cell).toHaveCSS('padding-left', tokens.table.cellPadding[density].x + 'px');
      await expect(cell).toHaveCSS('padding-top', tokens.table.cellPadding[density].y + 'px');
      await expect(header).toHaveCSS('padding-left', tokens.table.headerPadding.x + 'px');
      await expect(header).toHaveCSS('padding-top', tokens.table.headerPadding.y + 'px');
    }
    if (platform !== 'native') {
      const duration = tokens.motion.control / 1000 + 's';
      await expect(page.getByTestId('button').getByRole('button')).toHaveCSS('transition-duration', duration + ', ' + duration);
      const input = page.getByTestId('input').getByRole('textbox');
      await expect(input).toHaveCSS('transition-duration', duration + ', ' + duration);
    }
  });
}

// Remaining geometry and state roles
for (const platform of ['react', 'vue2', 'native']) {
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
    const checkboxBox = platform === 'native' ? checkbox.locator(':scope > *').first() : page.getByTestId('checkbox').locator('.ds-checkbox');
    await expect(checkboxBox).toHaveCSS('border-radius', px(tokens.extensions.checkbox.radii.sm));
    if (platform === 'native') await checkbox.click();
    else await checkbox.press('Space');
    await expect(checkbox).toBeChecked();
    const toggle = page.getByRole('switch', { name: '사용 설정' });
    const track = platform === 'native' ? toggle.locator(':scope > *').first() : page.getByTestId('switch').locator('.ds-switch');
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
    await page.screenshot({ path: testInfo.outputPath('geometry-state.png'), fullPage: true });
  });
}

// Typography weights and choice dimensions
async function weightedTypography(text: Locator, spec: TypographyToken, weight = spec.fontWeight) {
  await expect(text).toHaveCSS('font-size', px(spec.fontSizePx));
  await expect(text).toHaveCSS('line-height', px(spec.lineHeightPx));
  await expect(text).toHaveCSS('font-weight', String(weight));
  const spacing = await text.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(spacing === 'normal' ? 0 : parseFloat(spacing)).toBeCloseTo(spec.fontSizePx * spec.letterSpacingEm, 2);
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: packed typography weights and tracking reach visible and measured labels`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1400 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-followup');
    await weightedTypography(page.getByText('빈 상태 제목', { exact: true }), tokens.typography.cardTitle);
    await weightedTypography(page.getByText('빈 상태 설명', { exact: true }), tokens.typography.caption);
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) for (const family of ['group', 'filter']) {
      const section = page.getByTestId(`${family}-${size}`);
      const button = section.getByRole('button', { name: '두 번째 MMM', exact: true });
      const labels = button.getByText('두 번째 MMM', { exact: true });
      const spec = tokens.button.typography[size];
      await weightedTypography(labels.last(), spec, tokens.typography.label.fontWeight);
      await weightedTypography(labels.first(), spec);
      const before = await button.boundingBox();
      await button.click();
      await expect(section.locator('output')).toHaveText('b');
      await weightedTypography(labels.last(), spec);
      const after = await button.boundingBox();
      expect(after!.width).toBeCloseTo(before!.width, 1);
      const first = section.getByRole('button', { name: '첫 번째 WWW', exact: true });
      await weightedTypography(first.getByText('첫 번째 WWW', { exact: true }).last(), spec, tokens.typography.label.fontWeight);
    }
    const tab = page.getByTestId('tabs').getByRole('tab', { name: '두 번째 MMM', exact: true });
    const label = tab.getByText('두 번째 MMM', { exact: true }).last();
    await weightedTypography(label, tokens.typography.control, tokens.typography.label.fontWeight);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await weightedTypography(label, tokens.typography.control);
    await expect(page.getByText('중간 굵기', { exact: true })).toHaveCSS('font-weight', String(tokens.typography.label.fontWeight));
    await expect(page.getByText('강조 굵기', { exact: true })).toHaveCSS('font-weight', String(tokens.typography.control.fontWeight));
  });
}

test.describe('touch choice dimensions', () => {
  test.use({ hasTouch: true, viewport: { width: 900, height: 1600 } });
  for (const platform of ['react', 'vue2', 'native']) {
    test(`${platform}: packed choice dimensions and minimum targets follow their tokens`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, platform, '', 'token-followup');
      for (const size of ['sm', 'md', 'lg'] as const) {
        const section = page.getByTestId(`checkbox-${size}`);
        const checkbox = section.getByRole('checkbox');
        const hit = platform === 'native' ? checkbox : section.locator('.ds-choice');
        const box = platform === 'native' ? checkbox.locator(':scope > *').first() : section.locator('.ds-checkbox');
        await expect(hit).toHaveCSS('min-height', px(tokens.native.minimumTouchTarget));
        await expect(box).toHaveCSS('width', px(tokens.extensions.checkbox.sizes[size]));
        await expect(box).toHaveCSS('height', px(tokens.extensions.checkbox.sizes[size]));
        await box.click(); await expect(checkbox).toBeChecked();
        await expect(box.locator('svg')).toHaveCSS('width', px(tokens.extensions.checkbox.iconSizes[size]));
        const toggleSection = page.getByTestId(`switch-${size}`);
        const toggle = toggleSection.getByRole('switch');
        const target = platform === 'native' ? toggle : toggleSection.locator('.ds-choice');
        const track = platform === 'native' ? toggle.locator(':scope > *').first() : toggleSection.locator('.ds-switch');
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
      await page.screenshot({ path: testInfo.outputPath('choice-tokens.png'), fullPage: true });
    });
  }
});

// Independent display, field, layer and table roles
async function fieldTypography(node: Locator, size: 'sm' | 'md' | 'lg', scale: number) {
  const spec = tokens.input[size], type = tokens.typography.input;
  await expect(node).toHaveCSS('font-size', px(spec.fontSize * scale));
  await expect(node).toHaveCSS('line-height', px(spec.lineHeight * scale));
  await expect(node).toHaveCSS('font-weight', String(type.fontWeight));
  const tracking = await node.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(tracking === 'normal' ? 0 : parseFloat(tracking)).toBeCloseTo(spec.fontSize * type.letterSpacingEm * scale, 2);
}

for (const platform of platforms) {
  test(`${platform}: packed independent display roles reach icons, dots, alerts and actions`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    const badge = page.getByTestId('badge'), dot = badge.locator(':scope > * > :empty');
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
    await page.getByTestId('empty').screenshot({ path: info.outputPath('empty-role.png') });
    await badge.screenshot({ path: info.outputPath('badge-role.png') });
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
        if (platform !== 'vue2') await expect(textarea).toHaveCSS('min-height', px(minimum));
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

  test(`${platform}: packed independent layer roles reach modal widths, headings, drawer and tooltip`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    const trigger = page.getByRole('button', { name: '도움말 연결', exact: true });
    await page.mouse.move(1, 1); await page.mouse.move(4, 4);
    await trigger.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    const tooltipBox = platform === 'native' ? page.getByText('연결 도움말', { exact: true }).locator('..') : tooltip;
    await expect(tooltipBox).toHaveCSS('padding-left', px(tokens.extensions.tooltip.paddingX));
    await expect(tooltipBox).toHaveCSS('padding-top', px(tokens.extensions.tooltip.paddingY));
    await tooltip.screenshot({ path: info.outputPath('tooltip-role.png') });
    await page.mouse.move(1400, 0);
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      await page.getByRole('button', { name: '창 ' + size, exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '연결 창 제목', exact: true });
      const surface = platform === 'react' ? dialog.locator('..') : dialog;
      await expect(surface).toHaveCSS('width', px(tokens.modal.widths[size]));
      const heading = page.getByText('연결 창 제목', { exact: true });
      await expect(heading).toHaveCSS('font-size', px(tokens.modal.titleSize));
      await expect(heading).toHaveCSS('line-height', px(tokens.modal.titleLineHeight));
      await expect(heading).toHaveCSS('font-weight', String(tokens.modal.titleWeight));
      expect(parseFloat(await heading.evaluate(el => getComputedStyle(el).letterSpacing)) || 0).toBeCloseTo(tokens.modal.titleSize * tokens.typography.sectionTitle.letterSpacingEm, 2);
      if (size === 'md') await surface.screenshot({ path: info.outputPath('modal-role.png') });
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    }
    await page.getByRole('button', { name: '연결 패널 열기', exact: true }).click();
    const drawer = page.getByRole('dialog').filter({ hasText: '연결 패널' });
    await expect(drawer.getByRole('button', { name: '닫기', exact: true })).toHaveCSS('border-radius', px(tokens.extensions.drawer.closeRadius));
    await page.keyboard.press('Escape'); await expect(drawer).toHaveCount(0);
    await page.getByRole('button', { name: '메뉴 연결', exact: true }).click();
    const menuItem = page.getByRole('menuitem', { name: '연결 메뉴 항목', exact: true });
    await expect.poll(() => menuItem.evaluate(el => {
      for (let node = el.parentElement; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (parseFloat(style.borderTopWidth) > 0) return style.borderRadius;
      }
      return null;
    })).toBe(px(tokens.extensions.menu.radius));
    await page.keyboard.press('Escape'); await expect(menuItem).toHaveCount(0);
  });

  test(`${platform}: packed independent table, pagination and state roles remain usable`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    const table = page.getByTestId('table');
    const dimensions = await table.evaluate(el => [...el.querySelectorAll('*')].map(node => ({ w: getComputedStyle(node).width, h: getComputedStyle(node).height })));
    expect(dimensions.some(value => value.w === px(tokens.table.actionColumnWidth) && value.h === px(tokens.table.skeletonHeight))).toBe(true);
    const next = page.getByTestId('pagination').getByRole('button', { name: '다음 페이지', exact: true });
    const size = platform === 'native' ? Math.max(tokens.extensions.pagination.itemSize, tokens.native.minimumTouchTarget) : tokens.extensions.pagination.itemSize;
    await expect(next).toHaveCSS('width', px(size));
    await expect(next).toHaveCSS('border-radius', px(tokens.extensions.pagination.radius));
    await next.click(); await expect(page.getByTestId('events')).toHaveText('0/2');
    // A blocking error is an md DsAlert; its message takes the alert body type like any other alert.
    await expect(page.getByText('연결 오류 메시지', { exact: true })).toHaveCSS('font-size', px(tokens.typography.body.fontSizePx));
    await page.setViewportSize({ width: 320, height: 1000 });
    const segments = page.getByTestId('segments');
    if (platform === 'native') {
      const separator = segments.getByText('·', { exact: true });
      await expect(separator).toHaveCSS('margin-left', px(tokens.extensions.kpiRow.separatorGap));
      await expect(separator).toHaveCSS('margin-right', px(tokens.extensions.kpiRow.separatorGap));
      await expect(segments.getByText('/', { exact: true })).not.toBeVisible();
      await expect(segments.getByText('첫 조각', { exact: true })).toHaveCSS('margin-right', px(tokens.dimension.value4));
    } else {
      const labeled = segments.locator(platform === 'react' ? '.kjun-kpi-row__segment--labeled' : '.ds-kpi-row__segment--labeled').last();
      expect(await labeled.evaluate(el => getComputedStyle(el, '::before').marginLeft)).toBe(px(tokens.extensions.kpiRow.separatorGap));
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await segments.screenshot({ path: info.outputPath('kpi-role.png') });
  });
}

// Market typography, thresholds and motion distances
async function typography(node: Locator, role: TypographyToken, scale = 1) {
  await expect(node).toHaveCSS('font-size', role.fontSizePx * scale + 'px');
  await expect(node).toHaveCSS('line-height', role.lineHeightPx * scale + 'px');
  await expect(node).toHaveCSS('font-weight', String(role.fontWeight));
  const spacing = await node.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(spacing === 'normal' ? 0 : parseFloat(spacing)).toBeCloseTo(role.letterSpacingEm * role.fontSizePx * scale, 2);
}

async function displacement(page: Page, selector: string, action: string, duration: number) {
  return page.evaluate(async ({ selector, action, duration }) => {
    const samples: number[] = [], endpoints: number[] = [];
    const magnitude = (transform: string, translate: string) => {
      const matrix = new DOMMatrixReadOnly(transform || 'none');
      const offset = !translate || translate === 'none' ? [0, 0] : translate.split(' ').map(parseFloat);
      return Math.max(Math.abs(matrix.m41 + (offset[0] || 0)), Math.abs(matrix.m42 + (offset[1] || 0)));
    };
    const sample = () => {
      const element = document.querySelector(selector);
      if (!element) return;
      const style = getComputedStyle(element);
      samples.push(magnitude(style.transform, style.translate));
      // A busy browser may skip the last exit frame before removing the node.
      // Inspect the browser's actual animation endpoints as well as painted frames.
      for (const animation of element.getAnimations()) {
        for (const frame of (animation.effect as KeyframeEffect).getKeyframes()) {
          if (frame.transform || frame.translate) endpoints.push(magnitude(String(frame.transform || 'none'), String(frame.translate || 'none')));
        }
      }
    };
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    const interval = setInterval(sample, 8);
    try {
      if (action === 'modal-enter') (window as any).configureMotion({ modal: true });
      else if (action === 'modal-exit') (window as any).configureMotion({ modal: false });
      else if (action === 'popup') [...document.querySelectorAll<HTMLElement>('button,[role="button"]')].find(el => el.textContent === 'Open menu')!.click();
      else (window as any).feedback.toast.info('Distance toast', { duration: 0 });
      await new Promise(resolve => setTimeout(resolve, duration + 100));
      sample();
      return { samples, endpoints };
    } finally { observer.disconnect(); clearInterval(interval); }
  }, { selector, action, duration });
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: packed market typography and skeleton lines share scalable roles`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'visual-reaudit');
    const loaded = page.getByTestId('loaded');
    for (const scale of platform === 'native' ? [1] : [1, 1.25]) {
      await page.evaluate(scale => { document.documentElement.style.fontSize = 16 * scale + 'px'; }, scale);
      await typography(loaded.getByText('한빛테크', { exact: true }), tokens.typography.body, scale);
      await typography(loaded.getByText('HBT', { exact: true }), tokens.typography.caption, scale);
      if (platform !== 'native') await expect(page.getByTestId('loading').locator('.kjun-market-skeleton-identity').first())
        .toHaveCSS('grid-template-rows', `${tokens.typography.body.lineHeightPx * scale}px ${tokens.typography.caption.lineHeightPx * scale}px`);
    }
    const sort = loaded.getByText('현재가', { exact: true });
    await sort.click();
    await expect(page.getByTestId('state')).toContainText('"sort":"price"');
    await loaded.screenshot({ path: testInfo.outputPath('market-typography.png') });
  });

  test(`${platform}: packed responsive thresholds govern KPI and form columns at boundaries`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'typography');
    for (const delta of [-1, 0, 1]) {
      await page.setViewportSize({ width: tokens.responsive.kpiHero + delta, height: 1000 });
      await typography(page.getByTestId('hero').getByText('1,234,567,890', { exact: true }), delta <= 0 ? tokens.typography.displayMd : tokens.typography.displayLg);
      await page.setViewportSize({ width: tokens.responsive.kpiRow + delta, height: 1000 });
      await typography(page.getByTestId('row').getByText('12,345', { exact: true }), delta <= 0 ? tokens.typography.numberLg : tokens.typography.displaySm);
    }
    await openFixture(page, platform, '', 'visual-reaudit');
    const fields = page.getByTestId('form-columns').locator(':scope > * > *');
    for (const delta of [-1, 0, 1]) {
      await page.setViewportSize({ width: tokens.responsive.formColumns + delta, height: 1000 });
      await expect.poll(async () => {
        const a = (await fields.nth(0).boundingBox())!, b = (await fields.nth(1).boundingBox())!;
        return Math.abs(a.y - b.y) < 1;
      }).toBe(delta >= 0);
    }
  });

  test(`${platform}: packed modal threshold and aliased menu typography survive resizing`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '?scenario=layers', 'motion');
    const panel = page.locator('.kjun-modal, .ds-modal-container, [role="dialog"][aria-label="Motion modal"]');
    await page.getByRole('button', { name: 'Open modal', exact: true }).click();
    for (const delta of [-1, 0, 1]) {
      const width = tokens.responsive.modal + delta;
      await page.setViewportSize({ width, height: 1000 });
      const available = width - 2 * tokens.modal.mobileInset;
      await expect.poll(async () => (await panel.boundingBox())!.width)
        .toBeCloseTo(delta <= 0 ? available : Math.min(tokens.modal.widths.md, available), 0);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const label = page.getByText('Menu choice', { exact: true });
    await typography(label, tokens.typography.body);
    if (platform !== 'native') {
      await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
      await typography(label, tokens.typography.body, 1.25);
    }
    await label.click();
    await expect(label).toHaveCount(0);
  });

  test(`${platform}: packed modal popup and toast displacements follow motion roles`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '?scenario=layers', 'motion');
    const modal = '.kjun-modal, .ds-modal-container, [role="dialog"][aria-label="Motion modal"]';
    const toast = platform === 'native' ? '[data-testid^="toast-slot-"] > *' : platform === 'vue2' ? '.kjun-toast-stack > *' : '[data-toast-id] > *';
    const cases: [string, string, number, number][] = [
      [modal, 'modal-enter', tokens.motionDistance.modalEnter, tokens.motion.layerEnter],
      [modal, 'modal-exit', tokens.motionDistance.modalExit, tokens.motion.layerExit],
      ['.kjun-floating, [role="menu"], [aria-label="메뉴"]', 'popup', tokens.motionDistance.popup, tokens.motion.popupEnter],
      [toast, 'toast', tokens.motionDistance.toast, tokens.motion.toastEnter],
    ];
    for (const [selector, action, distance, duration] of cases) {
      const { samples, endpoints } = await displacement(page, selector, action, duration);
      expect(samples.length, action).toBeGreaterThan(2);
      expect(Math.max(...samples, ...endpoints), action).toBeGreaterThan(distance * 0.5);
      expect(Math.max(...samples, ...endpoints), action).toBeLessThanOrEqual(distance + 0.1);
      if (action === 'modal-exit') await expect(page.locator(modal)).toHaveCount(0);
      else await expect.poll(() => page.locator(selector).first().evaluate(element => {
        const style = getComputedStyle(element), matrix = new DOMMatrixReadOnly(style.transform);
        const offset = style.translate === 'none' ? [0, 0] : style.translate.split(' ').map(parseFloat);
        return Math.max(Math.abs(matrix.m41 + (offset[0] || 0)), Math.abs(matrix.m42 + (offset[1] || 0)));
      }), { message: action + ' settles at its final position' }).toBeCloseTo(0, 1);
      if (action === 'popup') await page.keyboard.press('Escape');
    }
  });
}
