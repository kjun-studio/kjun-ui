import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { UsageBuilder, expr } from '../../../shared/usage-examples/builder';
import type { PlatformName } from '../../../shared/demo-config';
import { applySetupAdditions } from '../../fixtures/usage-setup';
// @ts-ignore Node verification uses installed packed packages.
import { usageTools } from '../../../scripts/usage-tools.mjs';
// @ts-ignore Node-only compilation helper.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';

async function copy(page: Page, label: string) {
  await page.evaluate(() => {
    (window as any).__setupCopy = null;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (value: string) => { (window as any).__setupCopy = value; },
    } });
  });
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__setupCopy)).not.toBeNull();
  return page.evaluate(() => (window as any).__setupCopy as string);
}

function setupExample(platform: PlatformName, feedback: boolean, domainColors: boolean) {
  const builder = new UsageBuilder({ name: 'DsButton', platform, settings: {}, values: {} });
  builder.feedback = feedback;
  builder.domainColors = domainColors;
  const children = [builder.button('실행 확인', builder.handler('run', '', builder.result('"실행됨"')))];
  if (feedback) children.push(builder.button('설정 알림', builder.handler('notify', '',
    `${builder.vue ? 'this.kjunFeedback' : 'feedback'}.toast.info("피드백 설정됨", { duration: 0 });`)));
  if (domainColors) children.push(builder.node('DsIconToggle', {
    active: builder.state('favorite', false), activeIcon: 'star', ariaLabel: '설정 항목 즐겨찾기',
    ...(builder.vue ? { activeColorClass: 'text-favorite' } : { activeColor: builder.native
      ? (builder.declare('appDomainColors', 'import { appDomainColors } from \"./kjun\";'), expr('appDomainColors.favorite'))
      : 'var(--kjun-favorite)' }),
    onToggle: builder.handler('toggle', '', builder.set('favorite', '!' + builder.read('favorite'))),
  }));
  return builder.finish(builder.group(children)).code;
}

for (const platform of ['vue2', 'react', 'native'] as const) {
  test(`${platform}: copied guide setup runs all four additions combinations`, async ({ page, context }) => {
    test.setTimeout(180000);
    await page.goto('/getting-started?platform=' + platform);
    const app = platform === 'vue2' ? 'App.vue' : 'App.jsx';
    const colors = platform === 'native' ? 'kjun.js' : 'kjun.css';
    const files = [
      { name: app, code: await copy(page, `${app} 공통 설정 복사`) },
      { name: colors, code: await copy(page, `${colors} 공통 설정 복사`) },
    ];
    const additions = {
      feedback: {
        imports: await copy(page, '피드백 import 복사'),
        registration: platform === 'vue2' ? await copy(page, '피드백 등록 코드 복사') : '',
        content: await copy(page, '피드백 Provider 코드 복사'),
      },
      domainColors: {
        file: { name: colors, code: await copy(page, '추가 색상 코드 복사') },
        imports: platform === 'native' ? await copy(page, '추가 색상 import 복사') : '',
        prop: platform === 'native' ? await copy(page, '추가 색상 속성 복사') : '',
      },
    };
    expect(additions).toEqual(usageTools.usageSetupAdditions(platform, 'default'));
    const other = await context.newPage();
    const errors: string[] = [];
    other.on('pageerror', error => errors.push(error.message));
    await other.route('**/previews/export-checks/**', async route => {
      const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
      await route.fulfill({ body: await readFile('artifacts/export-checks/' + path),
        contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
    });
    for (const feedback of [false, true]) for (const domainColors of [false, true]) {
      const setup = applySetupAdditions(platform, files, additions, { feedback, domainColors });
      expect(setup).toEqual(usageTools.usageSetup(platform, 'default', { feedback, domainColors }));
      const id = `guide-setup-${feedback}-${domainColors}`;
      const entry = await prepareExample(platform, 'DsButton', id, {}, {}, 'default', setupExample(platform, feedback, domainColors), 'usage', setup);
      await compileEntries(platform, { [id]: entry });
      await other.goto(`/previews/export-checks/${platform}/${id}.html`);
      await other.getByRole('button', { name: '실행 확인', exact: true }).click();
      await expect(other.getByText('실행됨', { exact: true })).toBeVisible();
      if (feedback) {
        await other.getByRole('button', { name: '설정 알림', exact: true }).click();
        await expect(other.getByText('피드백 설정됨', { exact: true })).toBeVisible();
      }
      if (domainColors) {
        const favorite = other.getByRole('button', { name: /설정 항목.*즐겨찾기/ });
        await favorite.click();
        await expect(favorite).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(() => favorite.evaluate(element => [element, ...element.querySelectorAll('*')]
          .some(node => getComputedStyle(node).color === 'rgb(255, 189, 36)' || getComputedStyle(node).fill === 'rgb(255, 189, 36)'))).toBe(true);
      }
      expect(errors).toEqual([]);
    }
    await other.close();
  });

  test(`${platform}: setup links are conditional and preserve platform, anchors and history`, async ({ page }) => {
    test.setTimeout(180000);
    const cases = [
      { path: '/components/button', feedback: false, domain: false, width: 1440 },
      { path: '/components/modal', feedback: true, domain: false, width: 390 },
      { path: '/components/collection-mark', feedback: false, domain: true, width: 390 },
      { path: '/feedback', feedback: true, domain: false, width: 1440 },
    ];
    for (const item of cases) {
      await page.setViewportSize({ width: item.width, height: 1000 });
      await page.goto(`${item.path}?platform=${platform}`);
      await expect(page.getByRole('button', { name: '기본 코드 복사', exact: true })).toBeEnabled();
      const links = page.locator('.usage-setup-links');
      await expect(links.getByRole('link', { name: '공통 설정: 시작하기', exact: true })).toHaveAttribute('href', `/getting-started?platform=${platform}#connect`);
      await expect(page.getByRole('button', { name: '앱 초기 설정', exact: true })).toHaveCount(0);
      await expect(links.getByRole('link', { name: '피드백 Provider 설정', exact: true })).toHaveCount(Number(item.feedback));
      await expect(links.getByRole('link', { name: '금융·즐겨찾기 색상 설정', exact: true })).toHaveCount(Number(item.domain));
      await expect(links.getByText('이 예제에 필요한 설정', { exact: true })).toHaveCount(Number(item.feedback || item.domain));
      await links.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (item.domain) await page.screenshot({ path: `artifacts/setup-links-${platform}-390.png` });
      const target = item.feedback ? 'feedback-setup' : item.domain ? 'domain-colors' : 'connect';
      const link = links.locator(`a[href$="#${target}"]`);
      await link.focus(); await page.keyboard.press('Enter');
      await expect(page).toHaveURL(`/getting-started?platform=${platform}#${target}`);
      await expect(page.locator(`#${target} :is(h2, h3)`).first()).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (item.domain) await page.screenshot({ path: `artifacts/setup-guide-${platform}-390.png` });
      await page.goBack();
      await expect(page).toHaveURL(`${item.path}?platform=${platform}`);
      await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toContainText(platform === 'vue2' ? 'Vue 2' : platform === 'native' ? 'React Native' : 'React');
    }
    await page.goto('/getting-started?platform=' + platform + '#connect');
    for (const id of ['connect', 'feedback-setup', 'domain-colors']) {
      await page.goto(`/getting-started?platform=${platform}#${id}`);
      await expect(page.locator(`#${id} :is(h2, h3)`).first()).toBeInViewport();
    }
    await page.screenshot({ path: `artifacts/setup-guide-${platform}-1440.png` });
  });
}

test('setup guide remains searchable by old and new setup terms', async ({ page }) => {
  await page.goto('/components/button?platform=react');
  for (const query of ['앱 초기 설정', '피드백 Provider 설정', '금융 즐겨찾기 색상 설정']) {
    await page.getByRole('button', { name: '문서 검색', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '문서 검색' });
    await dialog.getByRole('combobox').fill(query);
    await expect(dialog.getByRole('option').filter({ hasText: '시작하기' })).toBeVisible();
    await dialog.getByRole('option').filter({ hasText: '시작하기' }).click();
    await expect(page).toHaveURL(/\/getting-started\?platform=react(?:#.*)?$/);
  }
});
