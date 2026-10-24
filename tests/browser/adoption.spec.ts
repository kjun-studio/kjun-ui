import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { demoPalettes } from '../../shared/demo-colors';

// 0.14.0 adoption additions: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'adoption');
      await expect(section(page, 'external-feedback')).toBeVisible();
    });

    test('a confirm and a toast opened from a plain function show in the provider', async ({ page }) => {
      await section(page, 'external-feedback').getByRole('button', { name: 'open from function' }).click();
      await expect(page.getByRole('dialog').filter({ hasText: 'Opened from a function' }).last()).toBeVisible();
      await expect(page.getByText('Toast from a function', { exact: true })).toBeVisible();
    });

    test('pressable cards are buttons; plain and disabled cards do not press', async ({ page }) => {
      const cards = section(page, 'cards');
      const card = cards.getByRole('button', { name: 'Question card' });
      await card.click();
      await expect(cards.getByText('presses 1', { exact: true })).toBeVisible();
      if (platform !== 'native') {
        await card.focus(); await page.keyboard.press('Enter');
        await expect(cards.getByText('presses 2', { exact: true })).toBeVisible();
        // A card that only passes onClick through keeps its plain markup.
        await expect(cards.getByRole('button', { name: 'Plain card' })).toHaveCount(0);
        await expect(cards.getByText('Plain card', { exact: true })).toBeVisible();
      }
      const disabled = cards.getByRole('button', { name: 'Disabled card' });
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await disabled.click({ force: true });
      await expect(cards.getByText(platform === 'native' ? 'presses 1' : 'presses 2', { exact: true })).toBeVisible();
    });

    test('text tones map to brand, danger, success, warning and onBrand', async ({ page }) => {
      const colors = demoPalettes.default as Record<string, string>;
      const css = async (value: string) => page.evaluate(v => { const el = document.createElement('i'); el.style.color = v; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c; }, value);
      for (const [tone, role] of [['brand', 'brand'], ['danger', 'danger'], ['success', 'success'], ['warning', 'warning'], ['inverse', colors.onBrand ? 'onBrand' : 'inverse']]) {
        await expect(section(page, 'tones').getByText('tone ' + tone, { exact: true })).toHaveCSS('color', await css(colors[role]));
      }
    });

    test('destructive rows color the title, chevrons are decorative, list items align with rows and sections can drop their surface', async ({ page }) => {
      const list = section(page, 'settings-list');
      const colors = demoPalettes.default as Record<string, string>;
      const danger = await page.evaluate(v => { const el = document.createElement('i'); el.style.color = v; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c; }, colors.danger);
      await expect(list.getByText('Delete account', { exact: true })).toHaveCSS('color', danger);
      // The chevron is decorative: the row keeps its title as its name.
      await expect(list.getByRole(platform === 'native' ? 'button' : 'button', { name: 'Profile', exact: true })).toBeVisible();
      const profile = (await list.getByText('Profile', { exact: true }).boundingBox())!;
      const theme = (await list.getByText('Theme switcher', { exact: true }).boundingBox())!;
      expect(Math.round(theme.x)).toBe(Math.round(profile.x));
      const sectionBox = list.locator(platform === 'native' ? ':scope > * > * > *' : '.kjun-list-section').first();
      await expect(sectionBox).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    });

    test('avatar fallback uses the given background and text colors', async ({ page }) => {
      const avatars = section(page, 'avatars');
      const initial = avatars.getByText('K', { exact: true });
      await expect(initial).toHaveCSS('color', 'rgb(250, 240, 230)');
      // The background shows behind the fallback; check it on the initial's nearest painted ancestor.
      const bg = await initial.evaluate(el => { let n: Element | null = el; while (n) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; n = n.parentElement; } return ''; });
      expect(bg).toBe('rgb(10, 20, 30)');
      // The fallback icon takes the text color too.
      const iconColor = await avatars.locator('svg').first().evaluate(svg => {
        const stroke = [svg, ...svg.querySelectorAll('*')].map(n => n.getAttribute('stroke')).find(v => v && v !== 'none' && v !== 'currentColor');
        if (!stroke) return getComputedStyle(svg).color;
        const el = document.createElement('i'); el.style.color = stroke; document.body.append(el); const c = getComputedStyle(el).color; el.remove(); return c;
      });
      expect(iconColor).toBe('rgb(250, 240, 230)');
    });

    test('circle progress draws the value arc and keeps progressbar semantics', async ({ page }) => {
      const area = section(page, 'circle-progress');
      const bar = area.getByRole('progressbar', { name: 'Weekly goal' });
      await expect(bar).toHaveAttribute('aria-valuenow', '40');
      // The value arc covers 40% of the circumference.
      const drawn = await bar.evaluate(el => {
        const arc = [...el.querySelectorAll('svg *')].find(n => n.getAttribute('stroke-dasharray'));
        if (!arc) return -1;
        const dash = parseFloat(arc.getAttribute('stroke-dasharray')!), offset = parseFloat(arc.getAttribute('stroke-dashoffset') || '0');
        return Math.round(((dash - offset) / dash) * 100);
      });
      expect(drawn).toBe(40);
      const circle = (await bar.boundingBox())!;
      expect(Math.round(circle.width)).toBe(Math.round(circle.height));
      // The percentage sits inside the circle; label and subLabel stack below it, centred.
      const percent = (await area.getByText('40%', { exact: true }).boundingBox())!;
      expect(percent.y).toBeGreaterThan(circle.y);
      expect(percent.y + percent.height).toBeLessThan(circle.y + circle.height);
      const label = (await area.getByText('Weekly goal', { exact: true }).boundingBox())!;
      const sub = (await area.getByText('4 of 10', { exact: true }).boundingBox())!;
      expect(label.y).toBeGreaterThanOrEqual(circle.y + circle.height);
      expect(sub.y).toBeGreaterThanOrEqual(label.y + label.height);
      for (const box of [percent, label, sub]) expect(Math.abs(box.x + box.width / 2 - (circle.x + circle.width / 2))).toBeLessThan(2);
    });

    test('small circles hide the centre percentage', async ({ page }) => {
      const area = section(page, 'circle-progress');
      await expect(area.getByRole('progressbar', { name: 'Small goal' })).toHaveAttribute('aria-valuenow', '70');
      await expect(area.getByText('70%', { exact: true })).toHaveCount(0);
    });

    test('buttons and badges follow an explicit stack alignment', async ({ page }) => {
      const centre = (b: { x: number; width: number }) => b.x + b.width / 2;
      const stack = (await section(page, 'align-center').boundingBox())!;
      for (const target of [page.getByRole('button', { name: 'Centered', exact: true }), section(page, 'align-center').getByText('Centered badge', { exact: true })]) {
        expect(Math.abs(centre((await target.boundingBox())!) - centre(stack))).toBeLessThan(2);
      }
      const row = (await section(page, 'align-end').boundingBox())!;
      const bottom = (await page.getByRole('button', { name: 'Bottom', exact: true }).boundingBox())!;
      expect(Math.abs(bottom.y + bottom.height - (row.y + row.height))).toBeLessThan(2);
    });

    test('default stacks keep buttons at their natural width', async ({ page }) => {
      // Web buttons already follow the parent (a default Stack stretches them); this pins the Native default.
      test.skip(platform !== 'native', 'Native default only');
      const stack = (await section(page, 'align-default').boundingBox())!;
      const button = (await page.getByRole('button', { name: 'Default', exact: true }).boundingBox())!;
      expect(Math.abs(button.x - stack.x)).toBeLessThan(1);
      expect(button.width).toBeLessThan(stack.width / 2);
    });

    test('pressable web cards lift on hover', async ({ page }) => {
      test.skip(platform === 'native', 'Native shows the press scale only');
      const card = section(page, 'cards').getByRole('button', { name: 'Question card' });
      await page.mouse.move(0, 0);
      const rest = await card.evaluate(el => getComputedStyle(el).boxShadow);
      await card.hover();
      await expect.poll(() => card.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe(rest);
    });
  });
}
