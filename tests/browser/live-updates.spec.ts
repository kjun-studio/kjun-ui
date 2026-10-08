import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// Live prop updates: debounced drafts, compound Tabs, Native popups and page size.
const configureFollowup = (page: Page, next: object) => page.evaluate(next => (window as any).configureFollowup(next), next);
const followupFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, `?scenario=${scenario}`, "review-followup");
async function uniqueIds(page: Page) {
  expect(await page.locator("[id]").evaluateAll(nodes => {
    const ids = nodes.map(node => node.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  })).toEqual([]);
}

for (const platform of ["react", "native", "vue2"]) test(`${platform} debounced drafts yield to external values, disabled state and unmount`, async ({ page }) => {
  await page.clock.install();
  await followupFixture(page, platform, "search");
  const input = page.getByRole("textbox", { name: "검색", exact: true });
  await input.fill("old draft");
  await configureFollowup(page, { value: "reset" });
  await expect(input).toHaveValue("reset");
  await page.clock.runFor(1100);
  await expect(page.getByTestId("events")).toHaveText("[]");
  await expect(page.getByTestId("model")).toHaveText("reset");
  await input.fill("blocked draft");
  await configureFollowup(page, { disabled: true });
  await expect(input).not.toBeEditable();
  await page.clock.runFor(1100);
  await expect(page.getByTestId("events")).toHaveText("[]");
  await configureFollowup(page, { disabled: false });
  await input.fill("latest draft");
  await configureFollowup(page, { handler: "latest" });
  await expect(input).toHaveValue("latest draft");
  await page.clock.runFor(1100);
  await expect(page.getByTestId("events")).toHaveText('["latest:latest draft"]');
  await input.fill("unmounted draft");
  await configureFollowup(page, { mounted: false });
  await expect(input).toHaveCount(0);
  await page.clock.runFor(1100);
  await expect(page.getByTestId("events")).toHaveText('["latest:latest draft"]');
});

test("Vue compound tabs track live props and unregister by stable identity", async ({ page }) => {
  await followupFixture(page, "vue2", "tabs");
  await configureFollowup(page, { disabled: true, label: "Updated", badge: 2 });
  const updated = page.getByRole("tab", { name: "Updated 2" });
  await expect(updated).toBeDisabled();
  await page.getByRole("tab", { name: "First" }).press("ArrowRight");
  await expect(page.getByTestId("model")).toHaveText("a");
  await configureFollowup(page, { disabled: false, name: "renamed" });
  await updated.click();
  await expect(page.getByTestId("model")).toHaveText("renamed");
  const panel = page.getByRole("tabpanel", { name: "Updated 2" });
  await expect(panel).toHaveText("second panel");
  await expect(updated).toHaveAttribute("aria-controls", await panel.getAttribute("id") as string);
  await configureFollowup(page, { mounted: false });
  await expect(updated).toHaveCount(0);
  await configureFollowup(page, { mounted: true, value: "a" });
  await expect(page.getByRole("tab")).toHaveCount(2);
});

test("Native Select isolates popup search and DatePicker consumes live field feedback", async ({ page }) => {
  await followupFixture(page, "native", "fields");
  const date = page.getByRole("button", { name: "출발 날짜", exact: true });
  await expect(date).toHaveAttribute("id", "followup-date");
  await expect(date).toHaveAttribute("aria-describedby", "followup-date-hint");
  await expect(date).toHaveAttribute("aria-required", "true");
  await configureFollowup(page, { error: "값을 확인하세요" });
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(date).toHaveAttribute("aria-describedby", "followup-date-error");
  const select = page.getByRole("button", { name: "담당자", exact: true });
  await expect(select).toHaveAttribute("aria-describedby", "followup-select-error");
  await select.click();
  const search = page.getByRole("textbox", { name: "선택 항목 검색", exact: true });
  await expect(search).toBeVisible();
  await expect(search).not.toHaveAttribute("aria-labelledby");
  await expect(search).not.toHaveAttribute("aria-describedby");
  await uniqueIds(page);
  await search.fill("Al");
  await page.getByRole("radio", { name: "Alpha", exact: true }).click();
  await expect(select).toContainText("Alpha");
  await configureFollowup(page, { error: "" });
  await expect(date).not.toHaveAttribute("aria-invalid");
  await date.click();
  await page.getByRole("button", { name: "2026-09-15", exact: true }).click();
  await expect(page.getByTestId("date")).toHaveText("2026-09-15");
  await uniqueIds(page);
});

for (const platform of ["react", "vue2", "native"]) test(`${platform} page size stays reversible with one or zero pages`, async ({ page }) => {
  await followupFixture(page, platform, "pagination");
  // The equally named popup can remain mounted briefly while closing.
  const size = page.getByRole(platform === "vue2" ? "combobox" : "button", { name: "페이지당 항목 수", exact: true });
  const choose = async (value: string) => {
    await size.click();
    await page.getByRole(platform === "native" ? "radio" : "option", { name: value + "개씩", exact: true }).click();
  };
  await choose("50");
  await expect(page.getByTestId("model")).toHaveText("50:1");
  await expect(size).toBeVisible();
  await expect(page.getByRole("button", { name: "다음 페이지", exact: true })).toHaveCount(0);
  await expect(page.getByText("1 - 30 / 30개", { exact: true })).toBeVisible();
  await choose("10");
  await expect(page.getByTestId("model")).toHaveText("10:1");
  await expect(page.getByRole("button", { name: "다음 페이지", exact: true }).filter({ visible: true })).toBeEnabled();
  await configureFollowup(page, { total: 0 });
  await expect(size).toBeVisible();
  await choose("20");
  await expect(page.getByTestId("model")).toHaveText("20:1");
  await configureFollowup(page, { showSizeSelector: false, showInfo: false });
  await expect(size).toHaveCount(0);
});
