import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// Table sorting, expansion, responsive cards, search timing and row actions.
const configure = (page: Page, next: object) => page.evaluate(value => (window as any).configureReview(value), next);
const events = (page: Page) => page.getByTestId("events");
const reset = (page: Page) => page.evaluate(() => (window as any).resetReviewEvents());
const order = (page: Page) => page.locator('[data-testid^="row-"]').allTextContents();
const configureState = (page: Page, next: object) => page.evaluate(next => (window as any).configureState(next), next);
const stateFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "state-contracts");

for (const platform of ["react", "native", "vue2"]) {
  const header = (page: Page) => platform === "vue2" ? page.getByRole("columnheader", { name: "Amount" }) : page.getByRole("button", { name: "Amount", exact: true });
  test(`${platform} table preserves the client sort cycle without controlled props`, async ({ page }) => {
    await openFixture(page, platform, "?table", "review-contract");
    await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    await header(page).click(); await expect.poll(() => order(page)).toEqual(["One", "Two", "Three"]);
    await header(page).click(); await expect.poll(() => order(page)).toEqual(["Three", "Two", "One"]);
    await header(page).click(); await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    await expect(events(page)).toHaveText('[["sort",{"key":"amount","order":"asc"}],["sort",{"key":"amount","order":"desc"}],["sort",{"key":"","order":"asc"}]]');
  });
  test(`${platform} table follows controlled sort, rejected changes and external clearing`, async ({ page }) => {
    await openFixture(page, platform, "?table", "review-contract");
    await configure(page, { controlled: true, sort: { key: "amount", order: "desc" }, accept: false });
    await expect.poll(() => order(page)).toEqual(["Three", "Two", "One"]);
    await header(page).click();
    await expect(events(page)).toHaveText('[["sort",{"key":"","order":"asc"}]]');
    await expect.poll(() => order(page)).toEqual(["Three", "Two", "One"]);
    await reset(page); await configure(page, { sort: null });
    await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    await expect(events(page)).toHaveText("[]");
    await configure(page, { accept: true }); await header(page).click();
    await expect.poll(() => order(page)).toEqual(["One", "Two", "Three"]);
  });
  test(`${platform} server sort keeps response order across state and page replacements`, async ({ page }) => {
    await openFixture(page, platform, "?table", "review-contract");
    await configure(page, { controlled: true, sortMode: "server", sort: { key: "amount", order: "asc" } });
    await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    if (platform !== "native") await expect(page.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "ascending");
    await header(page).click();
    await expect(events(page)).toHaveText('[["sort",{"key":"amount","order":"desc"}]]');
    if (platform !== "native") await expect(page.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "descending");
    await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    await configure(page, { data: [{ id: 2, name: "Two", amount: 20 }, { id: 3, name: "Three", amount: 30 }] });
    await expect.poll(() => order(page)).toEqual(["Two", "Three"]);
    await reset(page); await configure(page, { sort: null });
    await expect.poll(() => order(page)).toEqual(["Two", "Three"]); await expect(events(page)).toHaveText("[]");
    if (platform !== "native") await expect(page.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "none");
    await configure(page, { sort: { key: "amount", order: "desc" }, sortMode: "client" });
    await expect.poll(() => order(page)).toEqual(["Three", "Two"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await expect.poll(() => order(page)).toEqual(["Three", "Two"]);
    await configure(page, { sortMode: "server" });
    await expect.poll(() => order(page)).toEqual(["Two", "Three"]);
  });
  test(`${platform} disabled sorting preserves supplied data and emits no sort request`, async ({ page }) => {
    await openFixture(page, platform, "?table", "review-contract");
    await configure(page, { controlled: true, sortable: false, sort: { key: "amount", order: "asc" } });
    await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
    if (platform === "native") await expect(header(page)).toBeDisabled();
    // Disabled Native headers still receive the pointer attempt; skip Playwright's enabled wait.
    await page.getByText("Amount", { exact: true }).click({ force: platform === "native" });
    await expect(events(page)).toHaveText("[]");
    await configure(page, { sortable: true });
    await expect.poll(() => order(page)).toEqual(["One", "Two", "Three"]);
  });
}

test("Vue controlled server sorting supports update:sort before sort-change without duplicate requests", async ({ page }) => {
  await openFixture(page, "vue2", "?table", "review-contract");
  await configure(page, { controlled: true, sortMode: "server", sync: true });
  await page.getByRole("columnheader", { name: "Amount" }).click();
  await expect(events(page)).toHaveText('[["update:sort",{"key":"amount","order":"asc"}],["sort",{"key":"amount","order":"asc"}]]');
  await expect(page.getByRole("columnheader", { name: "Amount" })).toHaveAttribute("aria-sort", "ascending");
  await expect.poll(() => order(page)).toEqual(["Three", "One", "Two"]);
  await reset(page); await configure(page, { sort: null });
  await expect(events(page)).toHaveText("[]");
});
for (const platform of ["react", "vue2"]) for (const width of [1280, 390]) {
  test(`${platform} table rows retain keyboard actions and inner controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openFixture(page, platform, "?table", "review-contract");
    const row = page.locator(width < 768 ? ".kjun-table-card, .ds-table-card" : "tbody tr").first();
    await expect(row).toHaveAttribute("tabindex", "0");
    await row.focus(); await row.press("Enter"); await row.press("Space");
    await expect(events(page)).toHaveText('[["row",[3,0]],["row",[3,0]]]');
    await expect(row).toBeFocused();
    expect(await row.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
    await reset(page);
    const action = row.getByRole("button", { name: "Action", exact: true });
    await action.click(); await action.press("Enter"); await action.press("Space");
    await expect(events(page)).toHaveText('[["action",null],["action",null],["action",null]]');
    await reset(page); await row.getByRole("checkbox").press("Space");
    await expect(events(page)).toHaveText("[]");
    await configure(page, { rowAction: false });
    await expect(row).not.toHaveAttribute("tabindex", "0");
  });
}

const open = (page: Page, platform: string) => openFixture(page, platform, '?table', 'review-contract');

for (const platform of ['vue2', 'react', 'native']) {
  const card = (page: Page) => platform === 'native' ? page.getByText('상세 보기', { exact: true }).first() : page.locator('.ds-table-card, .kjun-table-card').first();
  const expand = (page: Page) => page.getByRole('button', { name: /행 확장|상세 보기|접기/ }).first();
  test(`${platform} Table switches strictly below 768px and retains selection, expansion and cell slots`, async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 }); await open(page, platform);
    await configure(page, { data: [{ id: 0, name: 'Zero', amount: 0 }, { id: 1, name: 'One', amount: 10 }] });
    const checkbox = page.getByRole('checkbox', { name: /행 선택/ }).first();
    await checkbox.click(); await expand(page).click();
    await expect(events(page)).toHaveText('[["expanded",[0]]]');
    await expect(page.getByText('Detail 0', { exact: true })).toBeVisible();
    for (const width of [640, 641, 767, 768]) {
      await page.setViewportSize({ width, height: 900 });
      if (width < 768) {
        if (platform === 'native') await expect(page.getByText('접기', { exact: true })).toBeVisible();
        else await expect(card(page)).toBeVisible();
      } else if (platform === 'native') await expect(page.getByText('접기', { exact: true })).toHaveCount(0);
      else await expect(card(page)).toHaveCount(0);
      await expect(page.getByRole('checkbox', { name: /행 선택/ }).first()).toBeChecked();
      await expect(page.getByText('Detail 0', { exact: true })).toBeVisible();
      await expect(page.getByTestId('row-0')).toHaveText('Zero');
      await expect(page.getByTestId('selected')).toHaveText('[{"id":0,"name":"Zero","amount":0}]');
    }
    await expect(events(page)).toHaveText('[["expanded",[0]]]');
  });
  test(`${platform} Table controlled expansion can reject updates and expandSingle keeps one key`, async ({ page }) => {
    await open(page, platform);
    await configure(page, { controlledExpansion: true, expanded: [], accept: false });
    await expand(page).click(); await expect(events(page)).toHaveText('[["expanded",[3]]]');
    await expect(page.getByText('Detail 3', { exact: true })).toHaveCount(0);
    await configure(page, { accept: true, expandSingle: true }); await expand(page).click();
    await page.getByRole('button', { name: /행 확장|상세 보기|접기/ }).nth(1).click();
    await expect(page.getByText('Detail 3', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Detail 1', { exact: true })).toBeVisible();
    await configure(page, { expanded: [] }); await expect(page.getByText('Detail 1', { exact: true })).toHaveCount(0);
  });
  test(`${platform} Table cancels search on unmount and preserves its clear notification timing`, async ({ page }) => {
    await page.clock.install();
    await page.clock.pauseAt(new Date());
    await open(page, platform); await configure(page, { searchable: true });
    const input = page.getByRole('textbox');
    await input.fill('old'); await page.clock.runFor(100);
    await page.getByRole('button', { name: /검색 지우기|입력 지우기/ }).click();
    if (platform === 'vue2') await expect(events(page)).toHaveText('[["search",""]]');
    else await expect(events(page)).toHaveText('[]');
    await page.clock.runFor(301); await expect(events(page)).toHaveText('[["search",""]]');
    await input.fill('pending'); await configure(page, { show: false });
    await page.clock.runFor(301); await expect(events(page)).toHaveText('[["search",""]]');
  });
}
test('Vue Table clear and retype drops the old timer; scroll hints update in table mode', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await open(page, 'vue2'); await configure(page, { searchable: true, responsive: 'none' });
  const input = page.getByRole('textbox');
  await input.fill('old'); await page.clock.runFor(100);
  await page.getByRole('button', { name: '입력 지우기' }).click();
  await input.fill('new'); await page.clock.runFor(210);
  await expect(events(page)).toHaveText('[["search",""]]');
  await page.clock.runFor(100); await expect(events(page)).toHaveText('[["search",""],["search","new"]]');
  await page.setViewportSize({ width: 641, height: 900 });
  await page.locator('table').evaluate(el => { el.style.minWidth = '1400px'; });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect(page.locator('.ds-table-scroll-fade')).toBeVisible();
  await page.locator('.ds-table-scroll-wrapper').evaluate(el => { el.scrollLeft = el.scrollWidth; el.dispatchEvent(new Event('scroll')); });
  await expect(page.locator('.ds-table-scroll-fade')).toHaveCount(0);
});

for (const platform of ["vue2", "react", "native"]) for (const width of [1280, 375]) {
  test(`${platform} Table owns empty, supplied and uncontrolled expansion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await stateFixture(page, platform, "table");
    const toggles = page.getByRole("button", { name: /행 확장|상세 보기|접기/ });
    await toggles.nth(1).click();
    await expect(page.getByText("Detail 0", { exact: true })).toBeVisible();
    await expect(page.getByTestId("expanded")).toHaveText("[0]");
    await configureState(page, { expanded: [] }); await expect(page.getByText("Detail 0", { exact: true })).toHaveCount(0);
    await configureState(page, { expanded: [2] }); await toggles.nth(1).click();
    await expect(page.getByTestId("expanded")).toHaveText("[2,0]");
    await expect(page.getByText("Detail 2", { exact: true })).toBeVisible();
    await configureState(page, { expanded: [], accept: false }); await toggles.first().click();
    await expect(page.getByText("Detail 2", { exact: true })).toHaveCount(0);
    await configureState(page, { accept: true, expanded: [2, 0], single: true }); await toggles.last().click();
    await expect(page.getByTestId("expanded")).toHaveText("[1]");
    await expect(page.getByText("Detail 0", { exact: true })).toHaveCount(0);
    await configureState(page, { controlled: false }); await toggles.first().click();
    await expect(page.getByText("Detail 2", { exact: true })).toBeVisible();
    await toggles.first().click(); await expect(page.getByText("Detail 2", { exact: true })).toHaveCount(0);
  });
}

for (const width of [1280, 375]) {
  test(`Vue table actions never submit their containing form at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openFixture(page, "vue2", "?scenario=table", "integration-contracts");
    const expand = page.getByRole("button", { name: /행 확장|상세 보기|접기/ }).first();
    await expand.click();
    await expect(page.getByText("Detail", { exact: true })).toBeVisible();
    await expand.click();
    await expect(page.getByText("Detail", { exact: true })).toHaveCount(0);
    await page.getByRole("checkbox", { name: "행 선택" }).first().check();
    await expect(page.getByTestId("selected")).toHaveText("1");
    await page.getByRole("button", { name: "전체 선택", exact: true }).click();
    await expect(page.getByTestId("selected")).toHaveText("2");
    await page.getByRole("button", { name: "선택 해제" }).click();
    await expect(page.getByTestId("selected")).toHaveText("0");
    await expect(page.getByTestId("submits")).toHaveText("0");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("submits")).toHaveText("1");
  });
}
