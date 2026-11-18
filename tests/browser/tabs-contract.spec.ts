import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configure = (page: Page, patch: object) => page.evaluate(patch => (window as any).configureTabContract(patch), patch);
const lifecycle = (page: Page) => page.evaluate(() => (window as any).tabLifecycle);
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: panels preserve local state while hidden and dispose it only on removal`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-contract');
    const first = page.getByRole('textbox', { name: '첫 초안' });
    await first.fill('편집한 초안'); await page.getByRole('button', { name: '첫 카운터 0' }).click();
    await expect.poll(() => lifecycle(page)).toEqual({ mounts: 2, unmounts: 0 });
    await page.getByRole('tab', { name: '둘째 탭', exact: true }).click();
    await expect(first).toHaveCount(0);
    await expect(page.getByTestId('tabs').getByRole('tabpanel')).toHaveCount(1);
    await page.keyboard.press('Tab'); await expect(page.getByRole('textbox', { name: '둘째 초안' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: '둘째 카운터 0' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(page.locator('#after')).toBeFocused();
    await page.getByRole('tab', { name: '첫 탭', exact: true }).click();
    await expect(first).toHaveValue('편집한 초안'); await expect(page.getByRole('button', { name: '첫 카운터 1' })).toBeVisible();
    await configure(page, { firstDisabled: true });
    await expect(first).toHaveValue('편집한 초안');
    await configure(page, { removeFirst: true, value: 'two' });
    await expect.poll(() => lifecycle(page)).toEqual({ mounts: 2, unmounts: 1 });
    await configure(page, { removeFirst: false, firstDisabled: false, value: 'one' });
    await expect(first).toHaveValue('initial'); await expect(page.getByRole('button', { name: '첫 카운터 0' })).toBeVisible();
    await configure(page, { shown: false });
    await expect.poll(() => lifecycle(page)).toEqual({ mounts: 3, unmounts: 3 });
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: unavailable tabs cancel pending auxiliary actions`, async ({ page }) => {
    await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000));
    await openFixture(page, platform, '', 'tabs-contract');
    const first = page.getByRole('tab', { name: '첫 탭', exact: true });
    const menus = page.getByTestId('menus');
    const press = async (label = '첫 탭') => {
      const tab = page.getByRole('tab', { name: label, exact: true });
      if (platform === 'native') {
        const box = (await tab.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
      } else await tab.evaluate(node => {
        const event = new Event('touchstart', { bubbles: true });
        Object.defineProperty(event, 'touches', { value: [{ clientX: 20, clientY: 20 }] });
        node.dispatchEvent(event);
      });
    };
    const release = async () => {
      if (platform === 'native') await page.mouse.up();
      else if (await first.count()) await first.evaluate(node => node.dispatchEvent(new Event('touchend', { bubbles: true })));
    };
    if (platform !== 'native') {
      await page.getByRole('tab', { name: '비활성 탭', exact: true }).click({ button: 'right', force: true });
      await expect(menus).toHaveText('[]');
      await first.click({ button: 'right' }); await expect(menus).toHaveText('["one"]');
    }
    const before = platform === 'native' ? '[]' : '["one"]';
    await press('비활성 탭'); await page.clock.runFor(600); await release();
    await expect(menus).toHaveText(before);
    for (const patch of [{ firstDisabled: true }, { removeFirst: true }, { menu: false }]) {
      await press(); await page.clock.runFor(100);
      await configure(page, patch);
      if ('firstDisabled' in patch) await expect(first).toBeDisabled();
      if ('removeFirst' in patch) await expect(first).toHaveCount(0);
      if ('menu' in patch) await expect(page.getByTestId('tabs')).toHaveAttribute('data-menu', 'false');
      // Re-enabling must not revive the gesture that became unavailable.
      await configure(page, { firstDisabled: false, removeFirst: false, menu: true });
      await expect(first).toBeEnabled(); await page.clock.runFor(600); await release();
      await expect(menus).toHaveText(before);
    }
    await press(); await page.clock.runFor(600); await release();
    await expect(menus).toHaveText(platform === 'native' ? '["one"]' : '["one","one"]');
    await press(); await configure(page, { shown: false });
    await expect(page.getByTestId('tabs').getByRole('tab')).toHaveCount(0);
    await page.clock.runFor(600); await release();
    await expect(menus).toHaveText(platform === 'native' ? '["one"]' : '["one","one"]');
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: pressing the selected tab again reports no change`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-contract');
    const changes = page.getByTestId('changes'), first = page.getByRole('tab', { name: '첫 탭', exact: true });
    await first.click();
    await first.press('Enter');
    await expect(changes).toHaveText('[]');
    await page.getByRole('tab', { name: '둘째 탭', exact: true }).click();
    await expect(changes).toHaveText('["two"]');
    await page.getByRole('tab', { name: '둘째 탭', exact: true }).click();
    await expect(changes).toHaveText('["two"]');
  });

  test(`${platform}: an overflowing tab row keeps the selected tab in view and fades the edges with more tabs`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-contract');
    const row = page.getByTestId('overflow'), list = row.getByRole('tablist', { name: '넘치는 탭' });
    // The tab sits inside the 280px row; a tab between others also stays clear of the 24px fade. Web draws the fade
    // on the track, which reaches the focus ring's room past the row; Native draws it on the row.
    const inView = async (label: string, clear = 0) => {
      const box = (await (web ? row.locator('.kjun-tabs-track') : row).boundingBox())!, tab = (await row.getByRole('tab', { name: label, exact: true }).boundingBox())!;
      return tab.x >= box.x + clear - 1 && tab.x + tab.width <= box.x + box.width - clear + 1;
    };
    const track = row.locator('.kjun-tabs-track');
    const scrollY = await page.evaluate(() => scrollY);
    // The last tab starts selected: the row opens scrolled to it without moving the page.
    await expect.poll(() => inView('여덟째')).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(scrollY);
    if (web) {
      await expect(track).toHaveAttribute('data-fade-start', '');
      await expect(track).not.toHaveAttribute('data-fade-end', /.*/);
    }
    await page.evaluate(() => (window as any).configureTabContract({ overflow: 'a' }));
    await expect.poll(() => inView('첫째')).toBe(true);
    if (web) {
      await expect(track).toHaveAttribute('data-fade-end', '');
      await expect(track).not.toHaveAttribute('data-fade-start', /.*/);
    }
    await page.evaluate(() => (window as any).configureTabContract({ overflow: 'e' }));
    await expect.poll(() => inView('다섯째', 24)).toBe(true);
    if (web) {
      await expect(track).toHaveAttribute('data-fade-start', '');
      await expect(track).toHaveAttribute('data-fade-end', '');
    }
    await expect(list.getByRole('tab', { name: '다섯째', exact: true })).toHaveAttribute('aria-selected', 'true');
  });

  test(`${platform}: lazy panes draw their content the first time their tab is selected and keep it`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-contract');
    const row = page.getByTestId('overflow');
    await expect(row.getByText('여덟째 내용')).toBeVisible();
    await expect(row.getByText('첫째 내용')).toHaveCount(0);
    await expect(row.getByText('셋째 내용')).toHaveCount(0);
    await row.getByRole('tab', { name: '첫째', exact: true }).click();
    await expect(row.getByText('첫째 내용')).toBeVisible();
    await row.getByRole('tab', { name: '여덟째', exact: true }).click();
    await expect(row.getByText('첫째 내용')).toHaveCount(1);
    await expect(row.getByText('첫째 내용')).toBeHidden();
    await expect(row.getByText('셋째 내용')).toHaveCount(0);
  });

  test(`${platform}: only the selected tab points at its panel, which alone is a tabpanel`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-contract');
    const tabs = page.getByTestId('tabs');
    const selected = tabs.getByRole('tab', { name: '첫 탭', exact: true }), other = tabs.getByRole('tab', { name: '둘째 탭', exact: true });
    const panel = await selected.getAttribute('aria-controls');
    expect(panel).toBeTruthy();
    await expect(tabs.locator('#' + panel)).toHaveAttribute('role', 'tabpanel');
    await expect(other).not.toHaveAttribute('aria-controls', /.*/);
  });
}
