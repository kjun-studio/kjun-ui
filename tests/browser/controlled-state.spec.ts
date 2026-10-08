import { test, expect, type Page } from "@playwright/test";
import { openFixture } from "./packed-fixture";
const configure = (page: Page, next: object) => page.evaluate(n => (window as any).configureState(n), next);
const reset = (page: Page) => page.evaluate(() => (window as any).resetStateEvents());
const events = (page: Page) => page.getByTestId("events");
const input = (page: Page) => page.getByRole("textbox", { name: "선택 항목 검색" });
const fixture = (page: Page, platform: string, kind = "select") => openFixture(page, platform, "?case=" + kind, "review-state", "development");
const trigger = (page: Page, platform: string) => page.getByRole(platform === "vue2" ? "combobox" : "button", { name: "Choose", exact: true });
const rows = (page: Page, platform: string) => page.getByRole(platform === "native" ? "radio" : "option");
const tabs = [{ name: "first", label: "First" }, { name: "second", label: "Second" }];

for (const platform of ["react", "native", "vue2"]) {
  test(`${platform} Select controlled opening can be rejected and missing keys use original indices`, async ({ page }) => {
    await fixture(page, platform); await configure(page, { controlled: true, accept: false, pageSize: 0 });
    await trigger(page, platform).click(); await expect(events(page)).toHaveText('[["open",true]]'); await expect(input(page)).toHaveCount(0);
    await configure(page, { open: true, options: [{ label: "First missing" }, { label: "Second missing" }] });
    await expect(page.getByTestId("Second missing")).toBeVisible();
    const id = await page.getByTestId("Second missing").getAttribute("data-instance");
    await input(page).fill("Second"); await expect(rows(page, platform)).toHaveCount(1);
    expect(await page.getByTestId("Second missing").getAttribute("data-instance")).toBe(id);
    await configure(page, { options: [{ label: "First missing" }, { label: "Second missing" }] });
    expect(await page.getByTestId("Second missing").getAttribute("data-instance")).toBe(id);
  });
  test(`${platform} Select rejected close preserves query and pagination`, async ({ page }) => {
    await fixture(page, platform);
    await configure(page, { controlled: true, open: true, accept: false });
    await input(page).fill("zero");
    await reset(page);
    await rows(page, platform).first().click();
    await expect(input(page)).toHaveValue("zero");
    await expect(trigger(page, platform)).toHaveAttribute("aria-expanded", "true");
    await expect(events(page)).toHaveText('[["value",0],["change",0],["open",false]]');
    await input(page).fill(""); await page.getByRole("button", { name: "더 보기" }).click();
    await expect(rows(page, platform)).toHaveCount(4); await reset(page);
    await rows(page, platform).first().click();
    await expect(rows(page, platform)).toHaveCount(4);
    await expect(events(page)).toHaveText('[["value",0],["change",0],["open",false]]');
    await configure(page, { accept: true });
    await rows(page, platform).first().click();
    await expect(input(page)).toHaveCount(0);
    await trigger(page, platform).click();
    await expect(input(page)).toHaveValue("");
    await expect(rows(page, platform)).toHaveCount(2);
  });
  test(`${platform} Select external close and disabled transitions reset actual state without echo`, async ({ page }) => {
    await fixture(page, platform);
    await configure(page, { controlled: true, open: true });
    await expect(input(page)).toBeVisible(); await expect(events(page)).toHaveText("[]");
    await input(page).fill("zero");
    await configure(page, { open: false }); await expect(input(page)).toHaveCount(0);
    await reset(page); await configure(page, { open: true });
    await expect(input(page)).toHaveValue(""); await expect(rows(page, platform)).toHaveCount(2);
    await expect(events(page)).toHaveText("[]");
    await page.getByRole("button", { name: "더 보기" }).click(); await expect(rows(page, platform)).toHaveCount(4);
    await configure(page, { disabled: true }); await expect(input(page)).toHaveCount(0);
    await configure(page, { disabled: false }); await expect(input(page)).toHaveValue(""); await expect(rows(page, platform)).toHaveCount(2);
    await expect(events(page)).toHaveText("[]");
    await configure(page, { controlled: false }); await expect(input(page)).toHaveCount(0);
    await trigger(page, platform).click(); await input(page).fill("zero");
    await configure(page, { disabled: true }); await expect(input(page)).toHaveCount(0);
    await configure(page, { disabled: false }); await expect(input(page)).toHaveCount(0);
    await trigger(page, platform).click(); await expect(input(page)).toHaveValue("");
    await expect(rows(page, platform)).toHaveCount(2);
  });
  test(`${platform} Select preserves keyed option state through filtering, reordering and new objects`, async ({ page }) => {
    await fixture(page, platform); await configure(page, { pageSize: 0 }); await trigger(page, platform).click();
    const id = (name: string) => page.getByTestId(name).getAttribute("data-instance");
    await expect(page.getByTestId("String zero")).toBeVisible();
    const first = await id("String zero"), numeric = await id("Number zero"); expect(first).not.toBe(numeric);
    await input(page).fill("String"); await expect(rows(page, platform)).toHaveCount(1); expect(await id("String zero")).toBe(first);
    await configure(page, { options: [{ value: "alpha", label: "Alpha" }, { value: "0", label: "String zero" }, { value: 0, label: "Number zero" }] });
    expect(await id("String zero")).toBe(first);
    await input(page).fill(""); await expect(rows(page, platform)).toHaveCount(3); expect(await id("String zero")).toBe(first);
    await configure(page, { options: [{ value: "0", label: "String zero" }, { value: 0, label: "Number zero", disabled: true }, { value: "alpha", label: "Alpha" }] });
    await expect(rows(page, platform).first()).toContainText("String zero"); expect(await id("String zero")).toBe(first);
    await reset(page); await rows(page, platform).filter({ hasText: "Number zero" }).click({ force: true }); await expect(events(page)).toHaveText("[]");
    await rows(page, platform).first().click(); await expect(events(page)).toHaveText('[["value","0"],["change","0"],["open",false]]');
  });
  test(`${platform} Select multi-selection keeps numeric and string zero distinct`, async ({ page }) => {
    await fixture(page, platform); await configure(page, { multiple: true, value: [], pageSize: 0 }); await trigger(page, platform).click();
    const role = platform === "native" ? "checkbox" : "option";
    await reset(page); await page.getByRole(role).filter({ hasText: "Number zero" }).click();
    await page.getByRole(role).filter({ hasText: "String zero" }).click();
    await expect(events(page)).toHaveText('[["value",[0]],["change",[0]],["value",[0,"0"]],["change",[0,"0"]]]');
    for (const name of ["Number zero", "String zero"]) await expect(page.getByRole(role).filter({ hasText: name })).toHaveAttribute(platform === "native" ? "aria-checked" : "aria-selected", "true");
    await reset(page); await page.getByRole(role).filter({ hasText: "Number zero" }).click();
    await expect(events(page)).toHaveText('[["value",["0"]],["change",["0"]]]');
  });
  for (const method of ["Escape", "outside"]) test(`${platform} Select ${method} resets an uncontrolled search session`, async ({ page }) => {
    await fixture(page, platform); await trigger(page, platform).click();
    await page.getByRole("button", { name: "더 보기" }).click(); await expect(rows(page, platform)).toHaveCount(4);
    await input(page).fill("zero"); await reset(page);
    if (method === "Escape") await input(page).press("Escape");
    else await page.mouse.click(1100, 700);
    await expect(input(page)).toHaveCount(0);
    await expect(events(page)).toHaveText(platform === "vue2" ? '[["open",false],["search",""]]' : '[["open",false]]');
    if (method === "Escape" && platform !== "native") await expect(trigger(page, platform)).toBeFocused();
    await trigger(page, platform).click(); await expect(input(page)).toHaveValue(""); await expect(input(page)).toBeFocused();
    await expect(rows(page, platform)).toHaveCount(2);
  });
  for (const compound of [false, true]) test(`${platform} Tabs initialize arriving ${compound ? "TabPane" : "items"} once and respect rejection`, async ({ page }) => {
    await fixture(page, platform, "tabs"); await configure(page, { compound, accept: false });
    await configure(page, { tabs });
    await expect(events(page)).toHaveText('[["value","first"],["change","first"]]');
    await configure(page, { tabs: tabs.map(tab => ({ ...tab })) }); await page.waitForTimeout(150);
    await expect(events(page)).toHaveText('[["value","first"],["change","first"]]');
    await reset(page); await configure(page, { tabs: tabs.map(tab => ({ ...tab, disabled: true })) });
    await configure(page, { tabs }); await page.waitForTimeout(150); await expect(events(page)).toHaveText("[]");
    await configure(page, { tabs: tabs.slice(1) }); await expect(events(page)).toHaveText('[["value","second"],["change","second"]]');
    await reset(page); await configure(page, { tabValue: "parent", tabs }); await expect(events(page)).toHaveText("[]");
    await configure(page, { tabValue: "", accept: true }); await expect(events(page)).toHaveText('[["value","first"],["change","first"]]');
    await expect(page.getByRole("tab", { name: "First" })).toHaveAttribute("aria-selected", "true");
    await reset(page); await configure(page, { tabs: tabs.slice(1) });
    await expect(page.getByRole("tab", { name: "First" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "false");
    await expect(events(page)).toHaveText("[]");
  });
  test(`${platform} Tabs initialize when all disabled items become enabled`, async ({ page }) => {
    for (const compound of [false, true]) {
      await fixture(page, platform, "tabs"); await configure(page, { compound, tabs: tabs.map(tab => ({ ...tab, disabled: true })) });
      await expect(page.getByRole("tab")).toHaveCount(2); await expect(events(page)).toHaveText("[]");
      await configure(page, { tabs }); await expect(events(page)).toHaveText('[["value","first"],["change","first"]]');
    }
  });
  test(`${platform} Accordion keeps last opened across mode changes and removes unmounted entries`, async ({ page }) => {
    await fixture(page, platform, "accordion");
    const heading = (name: string) => page.getByRole("button", { name, exact: true });
    await heading("Three").click(); await heading("One").click(); await heading("Two").click();
    await heading("One").click(); await heading("One").click();
    await configure(page, { accordionMultiple: false });
    await expect(heading("One")).toHaveAttribute("aria-expanded", "true");
    await expect(heading("Two")).toHaveAttribute("aria-expanded", "false");
    await expect(heading("Three")).toHaveAttribute("aria-expanded", "false");
    await configure(page, { accordionMultiple: true }); await expect(heading("Two")).toHaveAttribute("aria-expanded", "false");
    await configure(page, { children: ["Two", "Three"] }); await expect(heading("One")).toHaveCount(0);
    await configure(page, { accordionMultiple: false, defaults: true, children: ["Two", "Three", "New"] });
    await expect(heading("New")).toHaveAttribute("aria-expanded", "true");
  });
  test(`${platform} Accordion single mode opens only first registered default`, async ({ page }) => {
    await fixture(page, platform, "accordion"); await configure(page, { children: [] });
    await expect(page.getByRole("button", { name: "One", exact: true })).toHaveCount(0);
    await configure(page, { accordionMultiple: false, defaults: true, children: ["One", "Two", "Three"] });
    for (const title of ["One", "Two", "Three"]) await expect(page.getByRole("button", { name: title, exact: true })).toHaveAttribute("aria-expanded", title === "One" ? "true" : "false");
  });
}
for (const platform of ["react", "vue2"]) test(`${platform} Select IME keys preserve focus, input defaults and parent layer`, async ({ page }) => {
  await fixture(page, platform, "modal"); await trigger(page, platform).click(); await input(page).fill("zero"); await reset(page);
  for (const guard of ["composition", "isComposing", "keyCode"]) {
    if (guard === "composition") await input(page).dispatchEvent("compositionstart");
    for (const key of ["ArrowDown", "ArrowUp", "Enter", "Escape"]) {
      const prevented = await input(page).evaluate((el, { key, guard }) => {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, isComposing: guard === "isComposing", keyCode: guard === "keyCode" ? 229 : 0 });
        el.dispatchEvent(event); return event.defaultPrevented;
      }, { key, guard });
      expect(prevented).toBe(false); await expect(input(page)).toBeFocused(); await expect(input(page)).toHaveValue("zero");
    }
    if (guard === "composition") await input(page).dispatchEvent("compositionend");
  }
  await expect(events(page)).toHaveText("[]");
  await input(page).press("ArrowDown"); await expect(rows(page, platform).first()).toBeFocused();
  await page.keyboard.press("Escape"); await expect(input(page)).toHaveCount(0); await expect(page.getByRole("dialog", { name: "Editor" })).toBeVisible();
  await expect(events(page)).toHaveText(platform === "vue2" ? '[["open",false],["search",""]]' : '[["open",false]]');
});
for (const method of ["click", "Enter", "Space", "Escape", "outside"]) test(`React Dropdown ${method} closes exactly once after action`, async ({ page }) => {
  await fixture(page, "react", "dropdown");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await menu.click(); await expect(page.getByRole("menuitem")).toBeVisible(); await reset(page);
  if (method === "click") await page.getByRole("menuitem").click();
  else if (method === "outside") await page.mouse.click(1100, 700);
  else await page.getByRole("menuitem").press(method);
  const expected = ["Escape", "outside"].includes(method) ? '[["close",null]]' : '[["action",null],["close",null]]';
  await expect(events(page)).toHaveText(expected);
  await menu.click(); await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.waitForTimeout(350); await expect(page.getByRole("menuitem")).toBeVisible();
  await expect(events(page)).toHaveText(expected.slice(0, -1) + ',["open",null]]');
  await page.getByRole("menuitem").press("Escape"); await page.keyboard.press("Escape");
  await expect(events(page)).toHaveText(expected.slice(0, -1) + ',["open",null],["close",null]]');
});
