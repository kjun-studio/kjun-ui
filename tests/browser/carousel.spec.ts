import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunCarousel: native scrolling that snaps to slides, moved by buttons, dots and keys, never on its own.
const section = (page: Page, id: string) => page.getByTestId(id);
// The scrolling element: .kjun-carousel-viewport on the web, the ScrollView's element on Native Web.
const scroller = (page: Page, id: string) => section(page, id).locator('*').evaluateAll(nodes => {
  const el = nodes.find(node => ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) as HTMLElement;
  return { left: Math.round(el.scrollLeft), width: el.clientWidth, content: el.scrollWidth };
});
const slideBox = (page: Page, id: string, label: string) => section(page, id).getByText(label, { exact: true }).evaluate(el => {
  const box = el.getBoundingClientRect();
  return { left: Math.round(box.left), width: Math.round(box.width) };
});
const dot = (page: Page, id: string, n: number) => section(page, id).getByRole('button', { name: n + '번 슬라이드' });

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1200 });
      await openFixture(page, platform, '', 'carousel');
    });

    test('a dot moves to its slide, reports the change and marks itself current', async ({ page }) => {
      await dot(page, 'banner', 3).click();
      await expect.poll(async () => (await scroller(page, 'banner')).left).toBe(2 * (await scroller(page, 'banner')).width + 2 * 12);
      await expect(page.getByTestId('changes')).toHaveText('[2]');
      if (web) await expect(dot(page, 'banner', 3)).toHaveAttribute('aria-current', 'true');
    });

    test('a title sits above the slides', async ({ page }) => {
      const title = section(page, 'titled').getByText('추천 상품', { exact: true });
      const first = await slideBox(page, 'titled', 'Alpha');
      const heading = await title.boundingBox();
      expect(heading!.y + heading!.height).toBeLessThanOrEqual((await section(page, 'titled').getByText('Alpha', { exact: true }).boundingBox())!.y);
      expect(first.width).toBe(200);
    });

    test('a single slide draws no dots', async ({ page }) => {
      await expect(section(page, 'single').getByRole('button')).toHaveCount(0);
      await expect(dot(page, 'banner', 1)).toBeVisible();
    });

    test('peek shows the next slide at the edge and auto keeps each slide width', async ({ page }) => {
      const peek = await slideBox(page, 'peek', 'Alpha'), next = await slideBox(page, 'peek', 'Bravo');
      const { width } = await scroller(page, 'peek');
      expect(peek.width).toBe(width - 24 - 8);
      expect(next.left - peek.left).toBe(peek.width + 8);
      expect((await slideBox(page, 'auto', 'Alpha')).width).toBe(200);
      await expect(section(page, 'auto').getByRole('button', { name: /번 슬라이드/ })).toHaveCount(0);
    });

    test('a controlled index scrolls to its slide', async ({ page }) => {
      await page.getByRole('button', { name: 'Show Charlie' }).click();
      await expect(page.getByTestId('index')).toHaveText('2');
      await expect.poll(async () => (await scroller(page, 'controlled')).left).toBe(2 * (await scroller(page, 'controlled')).width + 2 * 12);
    });

    test('a swipe settles on the nearest slide and reports it', async ({ page }) => {
      const { width } = await scroller(page, 'banner');
      await section(page, 'banner').locator('*').evaluateAll((nodes, x) => {
        const el = nodes.find(node => ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) as HTMLElement;
        // Native Web's ScrollView node replaces scrollTo with React Native's own signature, so set the position directly.
        el.scrollLeft = x;
      }, width + 12);
      await expect(page.getByTestId('changes')).toHaveText('[1]');
    });

    test('removing the last slide still lets a controlled index scroll', async ({ page }) => {
      await page.getByRole('button', { name: 'Remove last' }).click();
      await page.getByRole('button', { name: 'Show Charlie' }).click();
      await expect(page.getByTestId('index')).toHaveText('2');
      await expect.poll(async () => (await scroller(page, 'controlled')).left).toBe(2 * (await scroller(page, 'controlled')).width + 2 * 12);
    });

    test('indicators="count" shows the position as text', async ({ page }) => {
      const counted = section(page, 'counted');
      await expect(counted.getByText('1 / 4', { exact: true })).toBeVisible();
      await expect(counted.getByRole('button', { name: /번 슬라이드/ })).toHaveCount(0);
      const { width } = await scroller(page, 'counted');
      await counted.locator('*').evaluateAll((nodes, x) => {
        const el = nodes.find(node => ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) as HTMLElement;
        el.scrollLeft = x;
      }, width + 12);
      await expect(counted.getByText('2 / 4', { exact: true })).toBeVisible();
    });

    test('dots on a card rail mark the places it can stop, and the last one stays put', async ({ page }) => {
      const dots = section(page, 'rail').getByRole('button', { name: /번 슬라이드/ });
      await expect(dots).toHaveCount(3);
      await dots.nth(2).click();
      await expect.poll(async () => (await scroller(page, 'rail')).left).toBeGreaterThan(0);
      await page.waitForTimeout(400);
      await expect(page.getByTestId('rail-changes')).toHaveText('[2]');
      if (web) await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
    });

    test('a carousel drawn while hidden opens on its starting slide', async ({ page }) => {
      await page.getByRole('button', { name: 'Reveal' }).click();
      await expect.poll(async () => (await scroller(page, 'hidden')).left).toBe(2 * (await scroller(page, 'hidden')).width + 2 * 12);
    });

    test('snapAlign center keeps the current slide centred with a neighbour on each side', async ({ page }) => {
      const { width } = await scroller(page, 'centered');
      const view = await section(page, 'centered').locator('*').evaluateAll(nodes =>
        Math.round((nodes.find(node => ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) as HTMLElement).getBoundingClientRect().left));
      const first = await slideBox(page, 'centered', 'Alpha');
      expect(first.width).toBe(width - 2 * (24 + 12));
      expect(first.left - view).toBe(24 + 12);
      await dot(page, 'centered', 2).click();
      await expect.poll(async () => (await slideBox(page, 'centered', 'Bravo')).left - view).toBe(24 + 12);
    });

    test('bleed reaches into the page gutter while the first slide lines up with the content', async ({ page }) => {
      const box = (await section(page, 'bled').boundingBox())!;
      const view = await section(page, 'bled').locator('*').evaluateAll(nodes => {
        const rect = (nodes.find(node => ['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) as HTMLElement).getBoundingClientRect();
        return { left: Math.round(rect.left), right: Math.round(rect.right) };
      });
      expect(view.left).toBe(Math.round(box.x));
      expect(view.right).toBe(Math.round(box.x + box.width));
      expect((await slideBox(page, 'bled', 'Alpha')).left).toBe(Math.round(box.x) + 16);
    });

    test('overlay indicators sit on the slides', async ({ page }) => {
      const slides = await section(page, 'overlay').getByText('Alpha', { exact: true }).boundingBox();
      const count = await section(page, 'overlay').getByText('1 / 4', { exact: true }).boundingBox();
      expect(count!.y + count!.height).toBeLessThanOrEqual(slides!.y + slides!.height);
      expect(count!.y).toBeGreaterThan(slides!.y);
      const dotsBox = await dot(page, 'overlay-dots', 1).boundingBox();
      const dotsSlide = await section(page, 'overlay-dots').getByText('Alpha', { exact: true }).boundingBox();
      expect(dotsBox!.y + dotsBox!.height).toBeLessThanOrEqual(dotsSlide!.y + dotsSlide!.height);
    });

    if (web) {
      test('slides out of view are inert, so Tab does not jump back to them', async ({ page }) => {
        const form = section(page, 'form');
        const input = form.getByRole('textbox', { name: 'Name' });
        expect(await input.evaluate(el => !!el.closest('[inert]'))).toBe(false);
        await dot(page, 'form', 2).click();
        await expect.poll(() => input.evaluate(el => !!el.closest('[inert]'))).toBe(true);
      });

      test('a header button that reaches an end hands focus to the other one', async ({ page }) => {
        const header = section(page, 'titled').locator('.kjun-carousel-header');
        const next = header.getByRole('button', { name: '다음 슬라이드' });
        await next.focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        await expect(next).toBeDisabled();
        await expect(header.getByRole('button', { name: '이전 슬라이드' })).toBeFocused();
      });

      test('a cancelled drag returns to where it started', async ({ page }) => {
        const viewport = section(page, 'banner').locator('.kjun-carousel-viewport');
        const box = (await viewport.boundingBox())!;
        await viewport.evaluate((el, { x, y }) => {
          const fire = (type: string, clientX: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'mouse', button: 0, clientX, clientY: y }));
          fire('pointerdown', x);
          fire('pointermove', x - 60);
          fire('pointermove', x - 200);
          fire('pointercancel', 0);
        }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
        await expect.poll(async () => (await scroller(page, 'banner')).left).toBe(0);
        await expect(page.getByTestId('changes')).toHaveText('[]');
      });

      test('slides are named groups inside a carousel region', async ({ page }) => {
        const region = page.getByRole('region', { name: 'Banner' });
        await expect(region).toHaveAttribute('aria-roledescription', '캐러셀');
        await expect(region.getByRole('group', { name: '4개 중 2번째' })).toHaveAttribute('aria-roledescription', '슬라이드');
        await expect(region.getByRole('group', { name: '슬라이드 선택' }).getByRole('button')).toHaveCount(4);
      });

      test('a moved carousel announces its position politely, and not on load', async ({ page }) => {
        const status = section(page, 'banner').locator('[aria-live="polite"]');
        await expect(status).toHaveText('');
        await dot(page, 'banner', 2).click();
        await expect(status).toHaveText('4개 중 2번째');
      });

      test('titleAs sets the heading level', async ({ page }) => {
        await expect(section(page, 'titled').getByRole('heading', { level: 3, name: '추천 상품' })).toBeVisible();
      });

      test('slides keep their state when one is added before them', async ({ page }) => {
        const notes = section(page, 'notes');
        await notes.getByRole('textbox', { name: 'Note Bravo' }).fill('kept');
        await notes.getByRole('button', { name: 'Prepend' }).click();
        await expect(notes.getByRole('textbox', { name: 'Note Alpha' })).toBeVisible();
        await expect(notes.getByRole('textbox', { name: 'Note Bravo' })).toHaveValue('kept');
      });

      test('a mouse drag past a fifth of the view moves one slide, and a short one springs back', async ({ page }) => {
        const viewport = section(page, 'banner').locator('.kjun-carousel-viewport');
        const box = (await viewport.boundingBox())!;
        const drag = async (distance: number) => {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + distance / 2, box.y + box.height / 2, { steps: 4 });
          await page.mouse.move(box.x + box.width / 2 + distance, box.y + box.height / 2, { steps: 4 });
          await page.mouse.up();
        };
        await drag(-40);
        await expect.poll(async () => (await scroller(page, 'banner')).left).toBe(0);
        await expect(page.getByTestId('changes')).toHaveText('[]');
        await drag(-box.width / 4);
        await expect(page.getByTestId('changes')).toHaveText('[1]');
        await expect.poll(async () => (await scroller(page, 'banner')).left).toBe(box.width + 12);
      });

      test('side buttons float only toward a slide that exists and keep focus at the end', async ({ page }) => {
        const region = page.getByRole('region', { name: 'Banner' });
        const previous = region.getByRole('button', { name: '이전 슬라이드' }), next = region.getByRole('button', { name: '다음 슬라이드' });
        await expect(previous).toHaveCount(0);
        await expect(next).toHaveCSS('opacity', '0');
        await region.locator('.kjun-carousel-frame').hover();
        await expect(next).toHaveCSS('opacity', '1');
        expect(await next.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
        await next.click();
        await expect(page.getByTestId('changes')).toHaveText('[1]');
        await expect(previous).toBeVisible();
        await next.click();
        await next.click();
        await expect(page.getByTestId('changes')).toHaveText('[1,2,3]');
        await expect(next).toHaveCount(0);
        await expect(region.locator('.kjun-carousel-viewport')).toBeFocused();
      });

      test('a title names the region and holds the buttons, which stay and turn off at the ends', async ({ page }) => {
        const region = page.getByRole('region', { name: '추천 상품' });
        await expect(region.getByRole('heading', { name: '추천 상품' })).toBeVisible();
        const header = region.locator('.kjun-carousel-header');
        await expect(header.getByRole('button', { name: '이전 슬라이드' })).toBeDisabled();
        await expect(header.getByRole('button', { name: '다음 슬라이드' })).toHaveCSS('opacity', '1');
        await expect(region.locator('.kjun-carousel-frame > .kjun-carousel-control')).toHaveCount(0);
        await header.getByRole('button', { name: '다음 슬라이드' }).click();
        await expect(header.getByRole('button', { name: '이전 슬라이드' })).toBeEnabled();
      });

      test('dots are 20px wide targets and the focus ring follows the card radius', async ({ page }) => {
        const box = await dot(page, 'banner', 2).boundingBox();
        expect([box?.width, box?.height]).toEqual([20, 24]);
        await section(page, 'banner').locator('.kjun-carousel-viewport').focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        const frame = section(page, 'banner').locator('.kjun-carousel-frame');
        await expect(frame).toHaveCSS('outline-style', 'solid');
        await expect(frame).toHaveCSS('border-radius', '12px');
      });

      test('arrow keys, End and Home move the focused carousel', async ({ page }) => {
        const viewport = section(page, 'banner').locator('.kjun-carousel-viewport');
        await viewport.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('End');
        await page.keyboard.press('Home');
        await expect(page.getByTestId('changes')).toHaveText('[1,3,0]');
        await expect(dot(page, 'banner', 1)).toHaveAttribute('aria-current', 'true');
      });

      test('arrow keys inside a slide control stay with the control', async ({ page }) => {
        const input = section(page, 'form').getByRole('textbox', { name: 'Name' });
        await input.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Home');
        await expect(dot(page, 'form', 1)).toHaveAttribute('aria-current', 'true');
        expect((await scroller(page, 'form')).left).toBe(0);
      });
    }
  });
}
