import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSteps: status markers, the width-driven compact layout, step buttons and the vertical trail.
const section = (page: Page, id: string) => page.getByTestId(id);
const items = (page: Page, id: string) => section(page, id).locator('li.kjun-steps-item');
const root = (page: Page, id: string) => section(page, id).locator('.kjun-steps');
const label = (page: Page, id: string, n: number) => items(page, id).nth(n).locator('.kjun-steps-static .kjun-steps-label');
// What a role colour resolves to once the browser has painted it.
const paint = (page: Page, role: string) => page.evaluate(name => {
  const probe = document.createElement('span');
  probe.style.color = `var(--kjun-${name})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}, role);
const setWidth = (page: Page, width: number) => section(page, 'width').evaluate((el, w) => { el.style.width = w + 'px'; }, width);
const visibleBox = async (page: Page, locator: ReturnType<Page['locator']>) => {
  const box = await locator.boundingBox();
  return box && box.width > 1 && box.height > 1 ? box : null;
};

for (const platform of ['react']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1600 });
      await openFixture(page, platform, '', 'steps');
    });

    test('marks each status', async ({ page }) => {
      await expect(items(page, 'wizard')).toHaveCount(5);
      for (const [n, status] of ['complete', 'complete', 'current', 'upcoming', 'upcoming'].entries())
        await expect(items(page, 'wizard').nth(n)).toHaveAttribute('data-status', status);
      await expect(section(page, 'wizard').locator('[aria-current="step"]')).toHaveCount(1);
      await expect(items(page, 'wizard').nth(2)).toHaveAttribute('aria-current', 'step');
      await expect(section(page, 'wizard').getByRole('list', { name: '주문 단계' })).toBeVisible();
      await expect(items(page, 'wizard').nth(0).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('1단계, 약관 동의, 완료');
      await expect(items(page, 'wizard').nth(2).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('3단계, 배송 정보, 현재 단계');
      await expect(items(page, 'wizard').nth(3).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('4단계, 결제, 예정');
      await expect(items(page, 'wizard').nth(0).locator('.kjun-steps-static .kjun-steps-marker svg')).toHaveCount(1);
      await expect(items(page, 'wizard').nth(2).locator('.kjun-steps-static .kjun-steps-marker')).toHaveText('3');
      await expect(items(page, 'wizard').nth(2).locator('.kjun-steps-static .kjun-steps-marker svg')).toHaveCount(0);
      await expect(root(page, 'wizard')).toHaveAttribute('data-status', 'current');
    });

    test('error step', async ({ page }) => {
      await expect(items(page, 'error').nth(2)).toHaveAttribute('data-status', 'error');
      await expect(items(page, 'error').nth(2)).toHaveAttribute('aria-current', 'step');
      await expect(items(page, 'error').nth(2).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('3단계, 결제, 오류');
      await expect(root(page, 'error')).toHaveAttribute('data-status', 'error');
      await expect(label(page, 'error', 2)).toHaveCSS('color', await paint(page, 'danger'));
      await expect(items(page, 'error').nth(2).locator('.kjun-steps-static .kjun-steps-marker svg')).toHaveCount(1);
    });

    test('all complete ignores error', async ({ page }) => {
      await expect(root(page, 'done')).toHaveAttribute('data-status', 'complete');
      await expect(section(page, 'done').locator('[aria-current]')).toHaveCount(0);
      for (let n = 0; n < 3; n++) await expect(items(page, 'done').nth(n)).toHaveAttribute('data-status', 'complete');
    });

    test('compact switches at count × 80', async ({ page }) => {
      const head = section(page, 'fit').locator('.kjun-steps-head');
      await setWidth(page, 400);
      await expect(head).toBeHidden();
      expect(await visibleBox(page, label(page, 'fit', 2))).not.toBeNull();
      await setWidth(page, 399);
      await expect(head).toBeVisible();
      await expect(head.locator('.kjun-steps-head-title')).toHaveText('배송 정보');
      await expect(head.locator('.kjun-steps-head-count')).toHaveText('3 / 5');
      await expect(head.locator('.kjun-steps-head-count b')).toHaveText('3');
      await expect(head.locator('.kjun-steps-head-next')).toHaveText('다음 · 결제');
      // The labels stay in the accessibility tree while they leave the screen.
      expect(await visibleBox(page, label(page, 'fit', 2))).toBeNull();
      await expect(items(page, 'fit').nth(2).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('3단계, 배송 정보, 현재 단계');
      await expect(section(page, 'fit').getByRole('list', { name: '진행 단계' })).toBeAttached();
    });

    test('forced layout', async ({ page }) => {
      await expect(section(page, 'forced').locator('.kjun-steps-head')).toBeVisible();
      await expect(root(page, 'forced')).toHaveAttribute('data-layout', 'compact');
      expect(await visibleBox(page, label(page, 'forced', 2))).toBeNull();
      await expect(section(page, 'wizard').locator('.kjun-steps-head')).toBeHidden();
    });

    test('long labels stay inside their column', async ({ page }) => {
      for (const n of [0, 1]) {
        const column = (await items(page, 'long').nth(n).boundingBox())!;
        const text = label(page, 'long', n);
        const box = (await text.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(column.x - 0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width + 0.5);
        const line = parseFloat(await text.evaluate(el => getComputedStyle(el).lineHeight));
        expect(Number.isFinite(line)).toBe(true);
        expect(box.height).toBeLessThanOrEqual(line * 2 + 1);
      }
      await expect(label(page, 'long', 0)).toHaveAttribute('title', '배송지 입력 및 확인');
      await expect(label(page, 'long', 1)).toHaveAttribute('title', 'Supercalifragilistic');
    });

    test('step select', async ({ page }) => {
      const buttons = section(page, 'select').getByRole('button');
      await expect(buttons).toHaveCount(3);
      await expect(buttons.nth(0)).toHaveAccessibleName('1단계, 약관 동의, 완료');
      expect((await buttons.nth(0).boundingBox())!.height).toBeGreaterThanOrEqual(44);
      // Only the button speaks in the wide layout: the static copy is display:none.
      await expect(items(page, 'select').nth(0).locator('.kjun-steps-static')).toBeHidden();
      await buttons.nth(1).click();
      await expect(page.getByTestId('selected')).toHaveText('1');
      await buttons.nth(0).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('selected')).toHaveText('0');
      await buttons.nth(2).focus();
      await page.keyboard.press('Space');
      await expect(page.getByTestId('selected')).toHaveText('2');
      // The current and later steps are not buttons.
      await expect(items(page, 'select').nth(3).getByRole('button')).toHaveCount(0);
    });

    test('compact has no step buttons', async ({ page }) => {
      const buttons = section(page, 'select').getByRole('button');
      await section(page, 'narrow').getByRole('button').click();
      await expect(section(page, 'width')).toHaveCSS('width', '360px');
      await expect(buttons).toHaveCount(0);
      await section(page, 'wide').getByRole('button').click();
      await expect(buttons).toHaveCount(3);
    });

    test('vertical', async ({ page }) => {
      await expect(root(page, 'vertical')).toHaveAttribute('data-orientation', 'vertical');
      await expect(items(page, 'vertical').nth(1).locator('.kjun-steps-static .kjun-steps-detail')).toHaveText('11:30 · 포장을 마쳤습니다');
      await expect(items(page, 'vertical').nth(1).locator('.kjun-steps-static .kjun-sr-only')).toHaveText('2단계, 상품 준비, 완료, 11:30 · 포장을 마쳤습니다');
      await expect(items(page, 'vertical').nth(3).locator('.kjun-steps-static .kjun-steps-detail')).toHaveText('문 앞에 놓아 두었습니다');
      await expect(section(page, 'vertical').locator('.kjun-steps-head')).toHaveCount(0);
      const marker = items(page, 'vertical').nth(0).locator('.kjun-steps-static .kjun-steps-marker');
      const box = (await marker.boundingBox())!;
      expect(Math.round(box.width)).toBe(12);
      expect(Math.round(box.height)).toBe(12);
      // 16px between one row's end and the next row's start.
      const first = (await items(page, 'vertical').nth(0).boundingBox())!, second = (await items(page, 'vertical').nth(1).boundingBox())!;
      expect(Math.round(second.y - (first.y + first.height))).toBe(16);
      // The connector below a finished step is brand coloured; the one below the current step is not.
      const line = (n: number) => items(page, 'vertical').nth(n).evaluate(el => {
        const style = getComputedStyle(el, '::after');
        return { width: style.width, color: style.backgroundColor };
      });
      expect((await line(0)).color).toBe(await paint(page, 'brand'));
      expect((await line(0)).width).toBe('2px');
      expect((await line(2)).color).toBe(await paint(page, 'secondary'));
    });

    test('vertical step select reaches past the visible row', async ({ page }) => {
      const buttons = section(page, 'vselect').getByRole('button');
      await expect(buttons).toHaveCount(2);
      await expect(buttons.nth(1)).toHaveAccessibleName('2단계, 상품 준비, 완료, 11:30 · 포장을 마쳤습니다');
      await expect(items(page, 'vselect').nth(1).locator('.kjun-steps-static')).toBeHidden();
      await buttons.nth(1).click();
      await expect(page.getByTestId('vselected')).toHaveText('1');
      await buttons.nth(0).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('vselected')).toHaveText('0');
    });

    test('a short vertical row reaches 44px with an invisible layer', async ({ page }) => {
      const button = section(page, 'vbare').getByRole('button').nth(1);
      const box = (await button.boundingBox())!;
      expect(box.height).toBeLessThan(44);
      expect(await button.evaluate(el => parseFloat(getComputedStyle(el, '::after').height))).toBeGreaterThanOrEqual(44);
      // Just below the drawn row, inside the layer.
      await page.mouse.click(box.x + box.width / 2, box.y + box.height + 4);
      await expect(page.getByTestId('vbareselected')).toHaveText('1');
    });

    test('more than ten steps always fold', async ({ page }) => {
      await expect(section(page, 'many').locator('.kjun-steps-head')).toBeVisible();
      await expect(section(page, 'many').locator('.kjun-steps-head-count')).toHaveText('5 / 11');
      expect(await visibleBox(page, label(page, 'many', 4))).toBeNull();
    });

    test('forced full layout keeps labels in a narrow container', async ({ page }) => {
      await expect(root(page, 'full')).toHaveAttribute('data-layout', 'full');
      await expect(section(page, 'full').locator('.kjun-steps-head')).toBeHidden();
      expect(await visibleBox(page, label(page, 'full', 2))).not.toBeNull();
    });
  });
}
