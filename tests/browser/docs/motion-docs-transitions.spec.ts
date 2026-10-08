import { test, expect } from '@playwright/test';
import { platforms, selectMotionExample, resetMotionExample, revealFrame } from './motion-docs-helpers';

for (const platform of platforms) {
  test(`${platform}: document number retargets from an intermediate frame and subscribes to reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/motion?platform=' + platform);
    const root = await selectMotionExample(page, 'number'), frame = root.frameLocator('iframe');
    const result = await frame.getByText('100', { exact: true }).evaluate(async element => {
      const read = () => Number(element.textContent!.replaceAll(',', ''));
      const click = (label: string) => [...document.querySelectorAll<HTMLElement>('button,[role="button"]')].find(node => node.textContent === label)!.click();
      const deadline = performance.now() + 2500;
      const up = [read()], down: number[] = [];
      click('1000으로 변경');
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame); up.push(read());
        if (read() > 200) break;
      }
      click('120으로 변경');
      while (performance.now() < deadline) {
        await new Promise(requestAnimationFrame); down.push(read());
        if (read() === 120) break;
      }
      return { up, down };
    });
    expect(result.up[0]).toBe(100);
    expect(result.up.at(-1)).toBeGreaterThan(200);
    expect(result.up.at(-1)).toBeLessThan(1000);
    expect(result.down.at(-1)).toBe(120);
    expect(Math.max(...result.down)).toBeLessThan(1000);
    expect(result.down.some(value => value > 120 && value < result.up.at(-1)!)).toBe(true);
    await resetMotionExample(root);
    const partial = await frame.getByText('100', { exact: true }).evaluate(async element => {
      [...document.querySelectorAll<HTMLElement>('button,[role="button"]')].find(node => node.textContent === '1000으로 변경')!.click();
      const values = [];
      for (let i = 0; i < 5; i++) { await new Promise(requestAnimationFrame); values.push(Number(element.textContent!.replaceAll(',', ''))); }
      return values;
    });
    expect(partial.some(value => value > 100 && value < 1000)).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('[data-motion-preference]')).toHaveAttribute('data-motion-preference', 'reduce');
    await expect(frame.getByText('1,000', { exact: true })).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const completed = await frame.getByText('1,000', { exact: true }).evaluate(async element => {
      const values = [];
      for (let i = 0; i < 24; i++) { await new Promise(requestAnimationFrame); values.push(element.textContent); }
      return values;
    });
    expect(new Set(completed)).toEqual(new Set(['1,000']));
    await expect(page.locator('[data-motion-preference]')).toHaveAttribute('data-motion-preference', 'no-preference');
    await frame.getByRole('button', { name: '120으로 변경' }).click();
    await resetMotionExample(root);
    const resetValues = await frame.getByText('100', { exact: true }).evaluate(async element => {
      const values = [];
      const until = performance.now() + 700;
      while (performance.now() < until) { await new Promise(requestAnimationFrame); values.push(element.textContent); }
      return values;
    });
    expect(new Set(resetValues)).toEqual(new Set(['100']));
  });

  test(`${platform}: actual document tabs, accordion, layers and toast render intermediate positions`, async ({ page }) => {
    test.setTimeout(180000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/motion?platform=' + platform);
    for (const kind of ['tabs', 'accordion', 'modal', 'drawer', 'toast']) {
      const root = await selectMotionExample(page, kind), frame = root.frameLocator('iframe');
      if (kind === 'toast') {
        await frame.getByRole('button', { name: '알림 3개 표시' }).click();
        await revealFrame(root);
        await expect(frame.getByText('알림 3', { exact: true })).toBeVisible();
      }
      const triggerLabel = { tabs: '둘째 탭', accordion: '첫 항목', modal: '모달 열기', drawer: '패널 열기', toast: '중간 알림 닫기' }[kind]!;
      const samples = await frame.getByRole(kind === 'tabs' ? 'tab' : 'button', { name: triggerLabel, exact: true }).evaluate(async (trigger, kind) => {
        const body = document.body;
        const marker = () => body.querySelector('.kjun-tab-indicator,[data-testid="kjun-tab-indicator"]');
        const text = (label: string) => [...body.querySelectorAll('*')].find(node => node.textContent === label && ![...node.children].some(child => child.textContent === label));
        const panel = () => body.querySelector(kind === 'modal' ? '.kjun-modal,.ds-modal-container' : '.kjun-drawer,.ds-drawer-panel') || body.querySelector('[aria-label="작업 확인"]');
        const read = () => {
          const node = kind === 'tabs' ? marker() : kind === 'accordion' ? body.querySelector('.catalog-render') : kind === 'toast' ? text('알림 3') : panel();
          if (!node) return null;
          const box = node.getBoundingClientRect();
          return kind === 'accordion' ? box.height : kind === 'modal' || kind === 'toast' ? box.y : box.x;
        };
        // Finish the initial Toast entrance before measuring its reflow.
        if (kind === 'toast') for (let i = 0; i < 24; i++) await new Promise(requestAnimationFrame);
        const values: number[] = [];
        const first = read(); if (first != null) values.push(first);
        (trigger as HTMLElement).click();
        for (let i = 0; i < 48; i++) { await new Promise(requestAnimationFrame); const n = read(); if (n != null) values.push(n); }
        return values;
      }, kind);
      const min = Math.min(...samples), max = Math.max(...samples);
      expect(max - min, kind).toBeGreaterThan(2);
      if (kind === 'toast') await expect(frame.getByText('알림 2', { exact: true })).toHaveCount(0);
      expect(samples.some(value => value > min + 0.5 && value < max - 0.5), kind).toBe(true);
      if (kind === 'tabs') await expect(frame.getByRole('tab', { name: '둘째 탭' })).toHaveAttribute('aria-selected', 'true');
      if (kind === 'accordion') await expect(frame.getByText('첫 내용', { exact: true })).toBeVisible();
      if (kind === 'modal' || kind === 'drawer') {
        await expect(root.locator('.motion-preview-stage')).toHaveCSS('height', '480px');
        const exiting = await frame.getByRole('button', { name: '닫기', exact: true }).evaluate(async button => {
          button.click();
          const frames = [];
          for (let i = 0; i < 36; i++) { await new Promise(requestAnimationFrame); frames.push(!!document.querySelector('[role="dialog"]')); }
          return frames;
        });
        expect(exiting).toContain(true);
        expect(exiting.at(-1)).toBe(false);
      }
    }
  });
}
