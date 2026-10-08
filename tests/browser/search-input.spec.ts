import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// SearchInput drafts, remote requests, clearing, selection and parent layers.
const requests = (page: Page) => page.evaluate(() => (window as any).searchRequests());
const resolve = (page: Page, index = 0) => page.evaluate(i => (window as any).resolveSearch(i), index);
const resolveSearch = resolve;
const configureSearch = (page: Page, next: object) => page.evaluate(value => (window as any).configureSearch(value), next);
const compositionFixture = (page: Page, platform: string, query = '') => openFixture(page, platform, query, 'review-composition');
async function search(page: Page, platform: string, plain = false) {
  const input = page.locator('input').first();
  await input.click();
  return platform === 'native' && !plain ? page.getByRole('dialog').getByRole('textbox') : input;
}
const configureInput = (page: Page, next: object) => page.evaluate(next => (window as any).configureInput(next), next);
const inputFixture = (page: Page, platform: string, query = "") => openFixture(page, platform, query, "review-input");
const configureState = (page: Page, next: object) => page.evaluate(next => (window as any).configureState(next), next);
const stateFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "state-contracts");

const events = (page: Page) => page.getByTestId('events');

for (const platform of ['react', 'native']) {
  for (const next of [{ value: 'External' }, { disabled: true }, { debounce: 500 }, { async: true }, { show: false }]) {
    test(`${platform} SearchInput cancels pending draft on ${JSON.stringify(next)}`, async ({ page }) => {
      await openFixture(page, platform, '?plain&debounce=1000', 'review-composition');
      await page.clock.install(); await page.getByRole('textbox').fill('Pending');
      await configureSearch(page, next); await page.clock.runFor(1100);
      await expect(events(page)).toHaveText('[]');
      if ('value' in next) await expect(page.getByRole('textbox')).toHaveValue('External');
    });
  }
  for (const next of [{ value: 'Beta' }, { disabled: true }, { minChars: 20 }, { async: false }, { show: false }]) {
    test(`${platform} SearchInput aborts active requests on ${JSON.stringify(next)} and ignores late results`, async ({ page }) => {
      await openFixture(page, platform, '', 'review-composition');
      await page.locator('input').first().click(); await expect.poll(() => requests(page)).toHaveLength(1);
      await configureSearch(page, next);
      await expect.poll(async () => (await requests(page))[0].aborted).toBe(true);
      await resolve(page, 0); await expect(page.getByTestId('Missing')).toHaveCount(0);
      await expect(events(page)).toHaveText('[]');
      if ('value' in next) {
        await expect.poll(() => requests(page)).toHaveLength(2); await resolve(page, 1);
        await expect(page.getByTestId('Missing')).toBeVisible();
      }
    });
  }
  test(`${platform} SearchInput replaces requests and resets loading below minimum length`, async ({ page }) => {
    await openFixture(page, platform, '', 'review-composition');
    await page.locator('input').first().click(); await expect.poll(() => requests(page)).toHaveLength(1);
    const input = platform === 'native' ? page.getByRole('dialog').getByRole('textbox') : page.locator('input').first();
    await expect(page.getByText('검색 중...', { exact: true })).toBeVisible();
    await input.fill('Beta'); await expect.poll(() => requests(page)).toHaveLength(2);
    expect((await requests(page))[0].aborted).toBe(true);
    await resolve(page, 0); await expect(page.getByTestId('Missing')).toHaveCount(0);
    await resolve(page, 1); await expect(page.getByTestId('Missing')).toBeVisible();
    await expect(page.getByText('검색 중...', { exact: true })).toHaveCount(0);
    await configureSearch(page, { minChars: 10 }); await expect(page.getByTestId('Missing')).toHaveCount(0);
    await configureSearch(page, { minChars: 0 }); await expect.poll(() => requests(page)).toHaveLength(3);
    await resolve(page, 2); await expect(page.getByTestId('Missing')).toBeVisible();
  });
  test(`${platform} SearchInput reports current request errors and ignores canceled errors`, async ({ page }) => {
    await openFixture(page, platform, '', 'review-composition');
    await page.locator('input').first().click(); await expect.poll(() => requests(page)).toHaveLength(1);
    await configureSearch(page, { value: 'Beta' }); await expect.poll(() => requests(page)).toHaveLength(2);
    await page.evaluate(() => (window as any).rejectSearch(0));
    await expect(events(page)).toHaveText('[]');
    await page.evaluate(() => (window as any).rejectSearch(1));
    await expect(events(page)).toHaveText('[["error","Error: request failed"]]');
    await expect(page.getByText('검색 중...', { exact: true })).toHaveCount(0);
  });

}

test('Vue SearchInput consumes one Escape before its parent Modal', async ({ page }) => {
  await compositionFixture(page, 'vue2', '?modal');
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  const dialog = page.getByRole('dialog'), input = page.getByRole('combobox', { name: 'Search' });
  await input.click(); await expect.poll(() => requests(page)).toHaveLength(1);
  await resolve(page); await expect(page.getByRole('option')).toHaveCount(3);
  await input.press('Escape'); await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(dialog).toBeVisible(); await expect(input).toHaveValue('Alpha'); await expect(input).toBeFocused();
  await expect(page.getByTestId('events')).toHaveText('[]');
  await input.press('Escape'); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeFocused();
});

for (const platform of ['react', 'native', 'vue2']) {
  for (const mode of ['async', 'plain', 'debounced', 'rejected']) test(`${platform} SearchInput clear emits one immediate value then clear (${mode})`, async ({ page }) => {
    const plain = mode === 'plain' || mode === 'debounced';
    await compositionFixture(page, platform, plain ? `?plain&debounce=${mode === 'debounced' ? 1000 : 0}` : mode === 'rejected' ? '?reject' : '');
    const input = await search(page, platform, plain);
    if (plain) await input.fill('Beta');
    else await expect.poll(() => requests(page)).toHaveLength(1);
    await page.evaluate(() => (window as any).resetEvents());
    const scope = platform === 'native' && !plain ? page.getByRole('dialog') : page;
    await scope.getByRole('button', { name: /입력 지우기|검색어 지우기/ }).click();
    await expect(page.getByTestId('events')).toHaveText('[["value",""],["clear"]]');
    await expect(page.locator('input').first()).toHaveValue('');
    if (!plain) {
      await expect(page.getByRole(platform === 'native' ? 'dialog' : 'listbox')).toHaveCount(0);
      await expect.poll(() => requests(page)).toEqual([{ query: 'Alpha', aborted: true }]);
      await resolve(page);
    }
    // Beyond both debounce windows, no stale draft, duplicate event or reopened request.
    await page.waitForTimeout(mode === 'debounced' ? 1100 : 400);
    await expect(page.getByTestId('events')).toHaveText('[["value",""],["clear"]]');
    if (!plain) {
      expect(await requests(page)).toHaveLength(1);
      await expect(page.getByRole(platform === 'native' ? 'dialog' : 'listbox')).toHaveCount(0);
    }
  });
  test(`${platform} SearchInput selection emits a value before select without clearing or submitting`, async ({ page }) => {
    await compositionFixture(page, platform); const input = await search(page, platform);
    await expect.poll(() => requests(page)).toHaveLength(1); await resolve(page);
    if (platform === 'react') {
      await expect(page.getByRole('option')).toHaveCount(3);
      await input.press('ArrowDown'); await input.press('Enter');
    } else await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: 'Missing', exact: true }).click();
    await expect(page.getByTestId('events')).toHaveText('[["value","Missing"],["select"]]');
    await expect(page.locator('input').first()).toHaveValue('Missing');
    await expect(page.getByRole(platform === 'native' ? 'dialog' : 'listbox')).toHaveCount(0);
    if (platform === 'react') {
      await input.press('Enter');
      await expect(page.getByTestId('events')).toHaveText('[["value","Missing"],["select"],["enter"]]');
    }
  });
  test(`${platform} SearchInput itemKey controls result identity, including numeric and string zero`, async ({ page }) => {
    await compositionFixture(page, platform); await search(page, platform);
    await expect.poll(() => requests(page)).toHaveLength(1); await resolve(page);
    const identities = async () => Promise.all(['Missing', 'Number zero', 'String zero'].map(name => page.getByTestId(name).getAttribute('data-instance')));
    await expect(page.getByTestId('String zero')).toBeVisible();
    const first = await identities();
    await page.evaluate(() => (window as any).configureSearch('alternate'));
    await expect.poll(identities).not.toEqual(first);
    const second = await identities();
    expect(second[0]).toBe(first[0]);
    expect(second[1]).toBe(first[2]); expect(second[2]).toBe(first[1]);
    await page.evaluate(() => (window as any).configureSearch('missing'));
    await expect.poll(identities).not.toEqual(second);
    const third = await identities();
    expect(third[0]).toBe(first[0]);
    expect(third[1]).not.toBe(second[1]); expect(third[2]).not.toBe(second[2]);
  });
}

for (const platform of ["react", "native", "vue2"]) {
  test(`${platform} SearchInput invalidates requests when minChars changes and resumes after lowering it`, async ({ page }) => {
    await page.clock.install(); await inputFixture(page, platform, "?control=search");
    let input = page.locator("input").first(); await input.click();
    if (platform === "native") input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("ab"); await page.clock.runFor(350);
    await configureInput(page, { minChars: 5 });
    await expect.poll(() => page.evaluate(() => (window as any).searchRequests())).toEqual([{ query: "ab", aborted: true }]);
    await page.evaluate(() => (window as any).resolveSearch(0));
    await expect(page.getByRole(platform === "native" ? "radio" : "option")).toHaveCount(0);
    await configureInput(page, { minChars: 2 }); await page.clock.runFor(350);
    await page.evaluate(() => (window as any).resolveSearch(1));
    await expect(page.getByRole(platform === "native" ? "radio" : "option", { name: "ab result" })).toBeVisible();
    await configureInput(page, { minChars: 5 });
    await expect(page.getByRole(platform === "native" ? "radio" : "option")).toHaveCount(0);
    // Keep the two updates inside one debounce window even on a busy runner.
    await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 1000);
    await configureInput(page, { minChars: 2 }); await configureInput(page, { minChars: 5 });
    await page.clock.runFor(350);
    expect(await page.evaluate(() => (window as any).searchRequests().length)).toBe(2);
  });
}

test("Vue SearchInput cancels pending drafts on debounce and mode changes", async ({ page }) => {
  await page.clock.install(); await stateFixture(page, "vue2", "search");
  await configureState(page, { remote: false });
  const input = page.getByRole("textbox", { name: "Search" });
  await input.fill("old interval"); await configureState(page, { debounce: 2000 });
  await page.clock.runFor(2100); await expect(page.getByTestId("events")).toHaveText("[]");
  await input.fill("old mode"); await configureState(page, { remote: true });
  await page.clock.runFor(2100); await expect(page.getByTestId("events")).toHaveText("[]");
  await configureState(page, { remote: false, value: "", debounce: 1000 });
  await input.fill("draft"); await page.getByRole("button", { name: "검색어 지우기" }).click();
  await expect(input).toHaveValue(""); await page.clock.runFor(1100);
  await expect(page.getByTestId("events")).toHaveText('[""]');
});

test("Vue SearchInput aborts remote results after external resets, disabling and mode changes", async ({ page }) => {
  await page.clock.install(); await stateFixture(page, "vue2", "search");
  const input = page.getByRole("combobox", { name: "Search" });
  await input.fill("old"); await page.clock.runFor(350);
  await configureState(page, { value: "new" }); await page.clock.runFor(350);
  expect(await requests(page)).toEqual([{ query: "old", aborted: true }, { query: "new", aborted: false }]);
  await resolveSearch(page, 0); await expect(page.getByRole("option")).toHaveCount(0);
  await resolveSearch(page, 1); await expect(page.getByRole("option", { name: "new result" })).toBeVisible();
  await input.fill("disabled"); await page.clock.runFor(350); await configureState(page, { disabled: true });
  await resolveSearch(page, 2); await expect(page.getByRole("listbox")).toHaveCount(0);
  expect((await requests(page))[2].aborted).toBe(true);
  await configureState(page, { disabled: false }); await input.fill("mode"); await page.clock.runFor(350);
  await configureState(page, { remote: false }); await resolveSearch(page, 3);
  expect((await requests(page))[3].aborted).toBe(true);
  await expect(page.getByRole("option")).toHaveCount(0);
});
