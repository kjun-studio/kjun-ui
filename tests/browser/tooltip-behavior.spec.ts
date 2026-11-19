import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const tip = (page: Page, text: string) => page.locator('[role="tooltip"]').filter({ hasText: text });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
// A fresh page has seen no pointer yet: react-aria takes hover as a pointer hover only after a pointer move, which a
// person's mouse always makes on its way to a control, but Playwright's first hover lands on the button in one step.
const enter = (page: Page) => page.mouse.move(1, 1);

for (const platform of ['react', 'vue3', 'native']) {
  if (platform !== 'native') test(`${platform}: scrolling what holds the trigger closes its tooltip at once`, async ({ page }) => {
    await openFixture(page, platform, '', 'tooltip-behavior');
    await enter(page);
    await button(page, '스크롤 대상').hover();
    await expect(tip(page, '스크롤 설명')).toBeVisible();
    await page.getByTestId('scroller').evaluate(el => { el.scrollTop = 30; });
    await expect(tip(page, '스크롤 설명')).toHaveCount(0);
  });

  test(`${platform}: a touch tap neither opens nor leaves a tooltip`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true });
    const page = await context.newPage();
    await openFixture(page, platform, '', 'tooltip-behavior');
    await button(page, '탭 대상').tap();
    await page.waitForTimeout(400);
    await expect(tip(page, '탭 설명')).toHaveCount(0);
    await context.close();
  });

  test(`${platform}: a delay waits for the first tooltip only, and keyboard focus opens at once`, async ({ page }) => {
    await openFixture(page, platform, '', 'tooltip-behavior');
    await enter(page);
    await button(page, '첫째').hover();
    await page.waitForTimeout(250);
    await expect(tip(page, '첫째 설명')).toHaveCount(0);
    await expect(tip(page, '첫째 설명')).toBeVisible();
    // Warm: the next one opens without its 600ms delay.
    const moved = Date.now();
    await button(page, '둘째').hover();
    await expect(tip(page, '둘째 설명')).toBeVisible({ timeout: 400 });
    expect(Date.now() - moved).toBeLessThan(500);
    // Cold again after the cooldown with none open; keyboard focus still opens at once.
    await page.mouse.move(900, 700);
    await expect(tip(page, '둘째 설명')).toHaveCount(0);
    await page.waitForTimeout(700);
    await button(page, '첫째').focus();
    await page.keyboard.press('Tab');
    await expect(tip(page, '둘째 설명')).toBeVisible({ timeout: 400 });
  });

  test(`${platform}: width lg widens the tooltip to 320`, async ({ page }) => {
    await openFixture(page, platform, '', 'tooltip-behavior');
    await enter(page);
    await button(page, '넓은 툴팁').hover();
    const bubble = tip(page, '긴 설명입니다');
    await expect(bubble).toBeVisible();
    await expect.poll(async () => Math.round((await bubble.boundingBox())!.width)).toBe(320);
  });
}
