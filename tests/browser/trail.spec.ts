import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.18.0: a Breadcrumb whose last item has `to` ends in a link, and ScrollFade scrolls and fades vertically.
const scroller = (page: Page) => page.getByTestId('vertical').locator('div').filter({ hasText: 'Row 1' }).first();
// The element that scrolls: the matched box, one inside it (Native wraps its ScrollView for the fades) or an ancestor.
const box = (page: Page) => scroller(page).evaluate(el => {
  const node = (function find(start: Element) {
    // Only a box that clips: the ScrollFade's ring room reaches past Native's wrapper without making it a scroller.
    const scrolls = (n: Element) => n.scrollHeight > n.clientHeight + 1 && getComputedStyle(n).overflowY !== 'visible';
    const inside = [start, ...start.querySelectorAll('*')].find(scrolls) as HTMLElement | undefined;
    let up = start as HTMLElement;
    while (!inside && up && !scrolls(up)) up = up.parentElement as HTMLElement;
    return inside ?? up;
  })(el);
  const style = getComputedStyle(node);
  return { overflowY: style.overflowY, height: node.clientHeight, content: node.scrollHeight, mask: style.webkitMaskImage || style.maskImage,
    start: node.hasAttribute('data-fade-start'), end: node.hasAttribute('data-fade-end') };
});
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await openFixture(page, platform, '', 'trail');
    });

    test('a last item with `to` is a link and no item claims the current page', async ({ page }) => {
      const trail = page.getByTestId('ancestors');
      await expect(trail.getByRole('link')).toHaveCount(2);
      await expect(trail.getByRole('link', { name: 'Work' })).toBeVisible();
      await expect(trail.locator('[aria-current]')).toHaveCount(0);
      if (platform === 'native') {
        await trail.getByRole('link', { name: 'Work' }).click();
        await expect(page.getByTestId('visited')).toHaveText('["Work"]');
      } else await expect(trail.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    });

    test('a last item without `to` stays the current page', async ({ page }) => {
      const trail = page.getByTestId('current');
      await expect(trail.getByRole('link')).toHaveCount(1);
      await expect(trail.getByRole('link', { name: 'Minutes' })).toHaveCount(0);
      if (platform !== 'native') await expect(trail.locator('[aria-current="page"]')).toHaveText(/Minutes/);
    });

    test('a vertical ScrollFade scrolls up and down inside its height', async ({ page }) => {
      const first = await box(page);
      // The app's 120px is the layout slot; the scroller reaches 4px past it on each side for the items' focus rings.
      expect(first.height).toBe(128);
      expect(first.content).toBeGreaterThan(first.height * 1.5);
      expect(first.overflowY).not.toBe('visible');
      // Native draws its fades as gradients over the scroller: only the far edge at the top.
      if (platform === 'native') { await expect(page.getByTestId('vertical').locator('svg')).toHaveCount(1); return; }
      // The CSS draws the fade from data-fade-start / data-fade-end, leaving the inline style to the app.
      expect(first).toMatchObject({ start: false, end: true });
      expect(first.mask).toMatch(/linear-gradient/);
      await scroller(page).evaluate(el => { let node = el as HTMLElement; while (node.scrollHeight <= node.clientHeight) node = node.parentElement as HTMLElement; node.scrollTop = 100; });
      await expect.poll(async () => (await box(page)).start).toBe(true);
      expect((await box(page)).end).toBe(true);
    });

    test('a trail is a list, and maxItems folds the middle steps into a menu', async ({ page }) => {
      const long = page.getByTestId('long');
      if (platform !== 'native') await expect(long.getByRole('list').getByRole('listitem')).toHaveCount(4);
      else await expect(long.getByRole('navigation', { name: 'Long' })).toBeVisible();
      await expect(long.getByText('Docs', { exact: true })).toHaveCount(0);
      await expect(long.getByText('November', { exact: true })).toBeVisible();
      await expect(long.locator('[aria-current="page"]')).toHaveText(/Report/);
      await long.getByRole('button', { name: '숨긴 경로 보기' }).click();
      await expect(page.getByRole('menuitem', { name: 'Docs' })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: '2026' })).toBeVisible();
      if (platform === 'native') {
        await page.getByRole('menuitem', { name: 'Docs' }).click();
        await expect(page.getByTestId('visited')).toHaveText('["Docs"]');
      } else await expect(page.getByRole('menuitem', { name: 'Docs' })).toHaveAttribute('href', '#docs');
    });

    test('onNavigate routes trail links and the folded steps on every platform', async ({ page }) => {
      const trail = page.getByTestId('routed'), log = page.getByTestId('routed-log');
      const web = platform !== 'native';
      await trail.getByRole('link', { name: 'Home' }).click();
      // Web passes the click so a router can keep the browser from following the href; Native has no event to pass.
      await expect(log).toHaveText(JSON.stringify([web ? 'Home+event' : 'Home']));
      if (web) expect(new URL(page.url()).hash).toBe('');
      await trail.getByRole('button', { name: '숨긴 경로 보기' }).click();
      const folded = page.getByRole('menuitem', { name: '2026' });
      // A folded step drops its href once someone routes, so choosing it never reloads the page.
      if (web) await expect(folded).not.toHaveAttribute('href', /.+/);
      await folded.click();
      await expect(log).toHaveText(JSON.stringify([web ? 'Home+event' : 'Home', '2026']));
      if (web) expect(new URL(page.url()).hash).toBe('');
    });

    test('a link under the pointer takes the brand colour and an underline', async ({ page }) => {
      const link = page.getByTestId('ancestors').getByRole('link', { name: 'Work' });
      // Native draws the label in a text node inside the link; the web link carries its own style.
      const text = platform === 'native' ? link.getByText('Work', { exact: true }) : link;
      const style = () => text.evaluate(el => { const s = getComputedStyle(el); return { color: s.color, line: s.textDecorationLine }; });
      const rest = await style();
      expect(rest.line).toBe('none');
      await link.hover();
      await expect.poll(async () => (await style()).line).toBe('underline');
      expect((await style()).color).not.toBe(rest.color);
    });

    test('a horizontal ScrollFade fades its far edge and a named one takes keyboard focus', async ({ page }) => {
      const region = page.getByRole('region', { name: 'Chips' });
      await expect(region).toBeVisible();
      if (platform === 'native') return;
      await expect(region).toHaveAttribute('data-fade-end', 'true');
      await expect(region).not.toHaveAttribute('data-fade-start');
      // Keyboard focus lifts the fade mask, which would otherwise clip the whole ring away.
      await region.focus();
      await expect(region).toBeFocused();
      await expect(region).toHaveCSS('mask-image', 'none');
      for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
      await expect(region).toHaveAttribute('data-fade-start', 'true');
      await expect(region).not.toHaveAttribute('data-fade-end');
    });
  });
}
