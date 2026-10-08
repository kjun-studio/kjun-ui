import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// Select, Combobox, Input and TimePicker values, drafts, IME and identifiers.
const configureInput = (page: Page, next: object) => page.evaluate(next => (window as any).configureInput(next), next);
const inputFixture = (page: Page, platform: string, query = "") => openFixture(page, platform, query, "review-input");
async function comboInput(page: Page, platform: string) {
  // Native keeps its popup mounted until the closing animation has finished.
  if (platform === "native") await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  const input = platform === "native"
    ? page.locator('#root').getByRole('textbox', { name: 'Choice' })
    : page.getByRole('combobox', { name: 'Choice' });
  await input.click();
  return platform === "native" ? page.getByRole("dialog").getByRole("textbox") : input;
}
const configureScenario = (page: Page, next: object) => page.evaluate(next => (window as any).configureReview(next), next);
const scenarioFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "review");
async function uniqueIds(page: Page) {
  expect(await page.locator("[id]").evaluateAll(nodes => {
    const ids = nodes.map(node => node.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  })).toEqual([]);
}
const configureState = (page: Page, next: object) => page.evaluate(next => (window as any).configureState(next), next);
const stateFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "state-contracts");
const resolveSearch = (page: Page, index: number) => page.evaluate(index => (window as any).resolveSearch(index), index);

for (const platform of ["react", "native", "vue2"]) {
  for (const control of ["select", "combo"]) for (const multiple of control === "select" ? [false, true] : [false]) test(`${platform} ${control} displays and clears primitive zero (multiple=${multiple})`, async ({ page }) => {
    await inputFixture(page, platform, `?control=${control}&zero`);
    if (multiple) await configureInput(page, { multiple: true, value: [0] });
    const field = control === "select" ? page.getByRole(platform === "vue2" ? "combobox" : "button", { name: "Choice" }) : page.locator("input");
    if (control === "select") await expect(field).toContainText("0");
    else await expect(field).toHaveValue("0");
    await expect(page.getByTestId("model")).toHaveText(multiple ? "[0]" : "0");
    await page.getByRole("button", { name: /입력 지우기|선택 지우기/ }).click();
    await expect(page.getByTestId("model")).toHaveText(multiple ? "[]" : "null");
    if (control === "select") await expect(field).toContainText("선택");
    else await expect(page.locator("input").first()).toHaveValue("");
  });
  test(`${platform} combobox cancels drafts without changing selection and keeps accepted selections`, async ({ page }) => {
    await inputFixture(page, platform);
    for (const close of platform === "native" ? ["Escape"] : ["Escape", "Tab", "outside"]) {
      const input = await comboInput(page, platform);
      await input.fill("Beta");
      if (close === "outside") await page.getByRole("button", { name: "Outside" }).click();
      else await input.press(close);
      if (close === "Tab" && platform === "react") {
        await expect(page.getByRole("button", { name: "입력 지우기" })).toBeFocused();
        await page.keyboard.press("Tab");
      }
      await expect(page.locator("input").first()).toHaveValue("Alpha");
      await expect(page.getByTestId("model")).toHaveText('"a"');
      await expect(page.getByTestId("events")).toHaveText("[]");
    }
    const input = await comboInput(page, platform);
    await expect(input).toHaveValue("Alpha"); await input.fill("Beta");
    await page.getByRole(platform === "native" ? "radio" : "option", { name: "Beta" }).click();
    await expect(page.locator("input").first()).toHaveValue("Beta");
    await expect(page.getByTestId("model")).toHaveText('"b"');
    await configureInput(page, { accept: false });
    const next = await comboInput(page, platform); await next.fill("Alpha");
    await page.getByRole(platform === "native" ? "radio" : "option", { name: "Alpha" }).click();
    await expect(page.locator("input").first()).toHaveValue("Beta");
    await expect(page.getByTestId("model")).toHaveText('"b"');
  });
}

for (const platform of ["react", "vue2"]) test(`${platform} combobox leaves composition keys to the IME`, async ({ page }) => {
  await inputFixture(page, platform); const input = await comboInput(page, platform);
  await input.fill(""); await input.press("ArrowDown");
  const active = await input.getAttribute("aria-activedescendant");
  const dispatch = async (key: string, keyCode: number, isComposing = false) => input.evaluate((el, data) => {
    const event = new KeyboardEvent("keydown", { ...data, bubbles: true, cancelable: true });
    el.dispatchEvent(event); return event.defaultPrevented;
  }, { key, keyCode, isComposing });
  expect(await dispatch("Enter", 13, true)).toBe(false);
  await input.dispatchEvent("compositionstart");
  for (const [key, code] of [["ArrowDown", 40], ["ArrowUp", 38], ["Home", 36], ["End", 35], ["Enter", 13], ["Escape", 27]] as const)
    expect(await dispatch(key, code)).toBe(false);
  await expect(input).toHaveAttribute("aria-activedescendant", active!);
  await expect(page.getByTestId("events")).toHaveText("[]");
  await input.dispatchEvent("compositionend"); expect(await dispatch("Enter", 229)).toBe(false);
  await input.press("Enter"); await expect(page.getByTestId("events")).toHaveText('["a"]');
});

for (const platform of ["react", "native"]) test(`${platform} Combobox keeps drafts through consumer renders and follows explicit selection updates`, async ({ page }) => {
  await scenarioFixture(page, platform, "combobox");
  let input = page.getByRole(platform === "react" ? "combobox" : "textbox");
  if (platform === "native") { await input.click(); input = page.getByRole("dialog").getByRole("textbox"); }
  await input.fill("Beta");
  await expect(page.getByTestId("query")).toHaveText("Beta");
  await expect(input).toHaveValue("Beta");
  await configureScenario(page, { blocked: true });
  await expect(input).toHaveValue("Beta");
  await configureScenario(page, { value: "b" });
  await expect(input).toHaveValue("Beta");
  await configureScenario(page, { value: "a", label: "새 라벨", blocked: false });
  await expect(input).toHaveValue("새 라벨");
  await configureScenario(page, { label: "갱신 라벨" });
  await expect(input).toHaveValue("갱신 라벨");
  await configureScenario(page, { value: null });
  await expect(input).toHaveValue("");
});

test("React Combobox revalidates disabled and removed highlighted options", async ({ page }) => {
  await scenarioFixture(page, "react", "dynamic");
  const input = page.getByRole("combobox");
  await input.click(); await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  await configureScenario(page, { blocked: true });
  await expect(page.getByRole("option", { name: "Alpha" })).toHaveAttribute("aria-disabled", "true");
  await expect(input).not.toHaveAttribute("aria-activedescendant");
  await input.press("Enter");
  await expect(page.getByTestId("selected")).toHaveText("none");
  await input.press("ArrowDown"); await input.press("Enter");
  await expect(page.getByTestId("selected")).toHaveText("b");
  await configureScenario(page, { value: null, blocked: false });
  await input.fill(""); await input.press("ArrowDown");
  await configureScenario(page, { removed: true });
  await expect(page.getByRole("option")).toHaveCount(0);
  await input.press("Enter");
  await expect(page.getByTestId("selected")).toHaveText("none");
});

test("React Input preserves composition handlers and only commits an unconsumed Enter", async ({ page }) => {
  await scenarioFixture(page, "react", "input");
  const input = page.getByRole("textbox");
  await input.fill("한글");
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true });
  await expect(page.getByTestId("events")).toHaveText("[]");
  await input.dispatchEvent("compositionstart"); await input.press("Enter");
  await expect(page.getByTestId("events")).toHaveText('["start"]');
  await input.dispatchEvent("compositionend", { data: "한글" });
  await configureScenario(page, { prevent: true });
  await expect(input).toHaveAttribute("data-prevent-enter", "true"); await input.press("Enter");
  await expect(page.getByTestId("events")).toHaveText('["start","end"]');
  await configureScenario(page, { prevent: false });
  await expect(input).toHaveAttribute("data-prevent-enter", "false"); await input.press("Enter");
  await expect(page.getByTestId("events")).toHaveText('["start","end","enter"]');
});

for (const platform of ["react", "native", "vue2"]) test(`${platform} TimePicker scopes segment names, IDs and field feedback`, async ({ page }) => {
  await scenarioFixture(page, platform, "time");
  const role = platform === "vue2" ? "combobox" : "button";
  for (const segment of ["시", "분", "초"]) await expect(page.getByRole(role, { name: "예약 시간 " + segment, exact: true })).toBeVisible();
  await uniqueIds(page);
  if (platform !== "native") {
    await page.locator("label").filter({ hasText: "예약 시간" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    if (platform === "react") await expect.poll(() => page.getByRole("listbox").evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(page.getByRole(role, { name: "예약 시간 시", exact: true })).toBeFocused();
    await expect(page.getByTestId("time")).toHaveText("10:30:15");
  }
  const minute = page.getByRole(role, { name: "예약 시간 분", exact: true });
  await minute.click();
  await page.getByRole(platform === "native" ? "radio" : "option", { name: "31", exact: true }).click();
  await expect(page.getByTestId("time")).toHaveText("10:31:15");
  await configureScenario(page, { error: "예약 가능한 시간을 선택하세요" });
  await expect(page.getByRole("alert")).toHaveText("예약 가능한 시간을 선택하세요");
  if (platform !== "native") {
    for (const segment of ["시", "분", "초"]) {
      const control = page.getByRole(role, { name: "예약 시간 " + segment, exact: true });
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveAttribute("aria-describedby", "review-time-error");
    }
  }
  await uniqueIds(page);
});

test("React Select popup search keeps its own name and ID inside FormGroup", async ({ page }) => {
  await scenarioFixture(page, "react", "select");
  await page.getByRole("button", { name: "담당자", exact: true }).click();
  const search = page.getByRole("textbox", { name: "선택 항목 검색", exact: true });
  await expect(search).toBeFocused(); await uniqueIds(page);
  await search.fill("Al"); await page.getByRole("option", { name: "Alpha" }).click();
  await expect(page.getByRole("button", { name: "담당자", exact: true })).toHaveText("Alpha");
});

test("Vue autocomplete ignores composition keys until composition has finished", async ({ page }) => {
  await page.clock.install(); await stateFixture(page, "vue2", "search");
  const input = page.getByRole("combobox", { name: "Search" });
  await input.fill("한글"); await page.clock.runFor(350); await resolveSearch(page, 0);
  await expect(page.getByRole("option")).toBeVisible(); await input.press("ArrowDown");
  const active = await input.getAttribute("aria-activedescendant");
  await input.dispatchEvent("keydown", { key: "Enter", keyCode: 13, isComposing: true });
  await expect(page.getByTestId("selected")).toHaveText("none");
  await input.dispatchEvent("compositionstart");
  for (const [key, keyCode] of [["ArrowDown", 40], ["ArrowUp", 38], ["Home", 36], ["End", 35], ["Enter", 13], ["Escape", 27]] as const)
    await input.dispatchEvent("keydown", { key, keyCode });
  await expect(input).toHaveAttribute("aria-activedescendant", active!);
  await expect(page.getByRole("listbox")).toBeVisible(); await expect(input).toHaveValue("한글");
  await expect(page.getByTestId("selected")).toHaveText("none");
  await input.dispatchEvent("compositionend", { data: "한글" });
  await input.dispatchEvent("keydown", { key: "Enter", keyCode: 229 });
  await expect(page.getByTestId("selected")).toHaveText("none");
  await input.press("Enter"); await expect(page.getByTestId("selected")).toHaveText("한글 result");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

for (const kind of ["combo", "remote"]) {
  test(`React ${kind} ignores composition navigation and confirmation before ordinary Enter`, async ({ page }) => {
    await openFixture(page, "react", "?scenario=" + kind, "integration-contracts");
    const input = page.getByRole("combobox", { name: "Search" });
    await input.fill(kind === "remote" ? "한글" : "a");
    await expect(page.getByRole("option")).toHaveCount(2);
    await input.press("ArrowDown");
    const active = await input.getAttribute("aria-activedescendant");
    for (const [key, keyCode] of [["ArrowDown", 40], ["ArrowUp", 38], ["Home", 36], ["End", 35], ["Enter", 13], ["Escape", 27]] as const) {
      await input.dispatchEvent("keydown", { key, keyCode, isComposing: true });
    }
    await input.dispatchEvent("compositionstart");
    for (const [key, keyCode] of [["ArrowDown", 40], ["ArrowUp", 38], ["Home", 36], ["End", 35], ["Enter", 13], ["Escape", 27]] as const) {
      await input.dispatchEvent("keydown", { key, keyCode });
    }
    await expect(input).toHaveAttribute("aria-activedescendant", active!);
    await expect(page.getByRole("listbox")).toBeVisible();
    await expect(page.getByTestId("selected")).toHaveText("none");
    await input.dispatchEvent("compositionend");
    await input.dispatchEvent("keydown", { key: "Enter", keyCode: 229 });
    await expect(page.getByTestId("selected")).toHaveText("none");
    await expect(page.getByTestId("enters")).toHaveText("0");
    await input.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText("a");
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });
}

for (const kind of ["combo", "remote"]) {
  test(`Native ${kind} popup fields have independent IDs, labels and feedback`, async ({ page }) => {
    await openFixture(page, "native", "?scenario=" + kind, "integration-contracts");
    const popupIds = new Set<string>();
    for (const id of ["first", "second"]) {
      const field = page.locator("#" + id);
      await expect(field).toHaveAttribute("aria-describedby", id + "-hint");
      await field.click();
      const search = page.getByRole("dialog").getByRole("textbox", { name: "Search", exact: true });
      await expect(search).toBeFocused();
      const searchId = await search.getAttribute("id");
      expect(searchId).toBeTruthy();
      expect(searchId).not.toBe(id);
      expect(popupIds.has(searchId!)).toBe(false);
      popupIds.add(searchId!);
      await expect(page.locator("#" + id)).toHaveCount(1);
      await expect(search).not.toHaveAttribute("aria-labelledby");
      await expect(search).not.toHaveAttribute("aria-describedby");
      await page.evaluate(id => (window as any)["setError_" + id]("Field error"), id);
      await expect(field).toHaveAttribute("aria-describedby", id + "-error");
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(search).not.toHaveAttribute("aria-invalid", "true");
      await search.fill("Al");
      await page.getByRole("radio", { name: "Alpha", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(field).toHaveValue("Alpha");
    }
  });
}
