import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// Popover, Modal, prompt, menu trigger and Toast ownership across layers.
const compositionFixture = (page: Page, platform: string, query = '') => openFixture(page, platform, query, 'review-composition');
const configureScenario = (page: Page, next: object) => page.evaluate(next => (window as any).configureReview(next), next);
const scenarioFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "review");
const configureState = (page: Page, next: object) => page.evaluate(next => (window as any).configureState(next), next);
const stateFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, "?scenario=" + scenario, "state-contracts");

for (const initial of [false, true]) test(`React Popover focuses on opening and preserves continuous edits (initial=${initial})`, async ({ page }) => {
  await compositionFixture(page, 'react', '?case=focus' + (initial ? '&initial' : ''));
  if (!initial) await page.getByRole('button', { name: 'Open', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Editor' }), input = page.getByRole('textbox', { name: 'Edit value' });
  await expect(editor).toBeFocused();
  await input.fill('B'); await input.pressSequentially('eta');
  await expect(input).toHaveValue('Beta'); await expect(input).toBeFocused();
  await input.press('Escape'); await expect(editor).toHaveCount(0);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  await expect(editor).toBeFocused(); await expect(input).toHaveValue('Beta');
});

test("React prompt waits for composition to finish before settling", async ({ page }) => {
  await scenarioFixture(page, "react", "prompt");
  await page.getByRole("button", { name: "입력 열기" }).click();
  const dialog = page.getByRole("dialog", { name: "이름 입력" }), input = dialog.getByRole("textbox");
  await input.fill("홍길동"); await input.dispatchEvent("compositionstart"); await input.press("Enter");
  await expect(dialog).toBeVisible(); await expect(page.getByTestId("prompt")).toHaveText("pending");
  await input.dispatchEvent("compositionend", { data: "홍길동" }); await input.press("Enter");
  await expect(dialog).not.toBeVisible(); await expect(page.getByTestId("prompt")).toHaveText("홍길동");
});

test("Vue modal owns initial mount, live Escape policy, nested focus and cleanup without build patches", async ({ page }) => {
  await scenarioFixture(page, "vue2", "modal");
  const outer = page.getByRole("dialog", { name: "바깥 모달", exact: true });
  await expect(outer).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect.poll(() => outer.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape"); await expect(outer).toBeVisible();
  await configureScenario(page, { escape: true }); await page.keyboard.press("Escape");
  await expect(outer).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  await configureScenario(page, { open: true });
  const opener = page.getByRole("button", { name: "안쪽 모달 열기" });
  await opener.click();
  const inner = page.getByRole("dialog", { name: "안쪽 모달", exact: true });
  await expect(inner).toBeVisible();
  // The covered window stays open but is hidden from assistive technology while the inner one is on top.
  const coveredOuter = page.getByRole("dialog", { name: "바깥 모달", exact: true, includeHidden: true });
  await expect.poll(() => coveredOuter.evaluate(el => !!el.closest('[aria-hidden="true"]'))).toBe(true);
  await configureScenario(page, { innerEscape: false }); await page.keyboard.press("Escape");
  await expect(inner).toBeVisible(); await expect(coveredOuter).toBeVisible();
  await configureScenario(page, { innerEscape: true }); await page.keyboard.press("Escape");
  await expect(inner).not.toBeVisible(); await expect(outer).toBeVisible(); await expect(opener).toBeFocused();
  await page.evaluate(() => (window as any).unmountReview());
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("React Modal always exposes its explicit, heading or fallback name", async ({ page }) => {
  await stateFixture(page, "react", "modal");
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Custom dialog");
  await configureState(page, { title: "Visible heading" });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Custom dialog");
  await configureState(page, { ariaLabel: "" });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Visible heading");
  await configureState(page, { customHeader: true });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Custom heading");
  await configureState(page, { showHeader: false });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("Visible heading");
  await configureState(page, { title: "", customHeader: false, showHeader: true });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("대화상자");
  await configureState(page, { showHeader: false });
  await expect(page.getByRole("dialog")).toHaveAccessibleName("대화상자");
});

for (const kind of ["native", "button", "custom", "menu-button"]) for (const tooltip of [false, true]) {
  test(`React ${kind} menu trigger retains its name, state and focus with tooltip=${tooltip}`, async ({ page }) => {
    await stateFixture(page, "react", "menu"); await configureState(page, { kind, tooltip });
    const button = page.getByRole("button", { name: "Open menu", exact: true });
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    if (kind !== "menu-button") await expect(button).toHaveAttribute("id", "existing-trigger");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(button).toHaveAttribute("aria-controls", "choices");
    await expect(page.getByRole("menu")).toHaveAccessibleName("Open menu");
    if (kind !== "menu-button") await expect(page.getByTestId("clicks")).toHaveText("1");
    await page.keyboard.press("Escape"); await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await configureState(page, { triggerId: "explicit-trigger" });
    await expect(button).toHaveAttribute("id", "explicit-trigger");
    await button.press("ArrowDown"); await page.getByRole("menuitem").click();
    await expect(page.getByTestId("chosen")).toHaveText("1"); await expect(button).toBeFocused();
    await button.press("ArrowDown"); await configureState(page, { disabled: true });
    await expect(button).toBeDisabled(); await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("menu")).toHaveCount(0);
    expect(await page.locator("#explicit-trigger").count()).toBe(1);
  });
}

for (const platform of ["react", "native", "vue2"]) {
  test(`${platform} toast waits until both pointer and keyboard leave, including child focus changes`, async ({ page }) => {
    await page.clock.install();
    await openFixture(page, platform, "?scenario=toast", "integration-contracts");
    await page.evaluate(() => (window as any).showToast());
    const action = page.getByRole("button", { name: "Action", exact: true });
    const close = page.getByRole("button", { name: "알림 닫기" });
    await action.hover();
    await action.focus();
    await page.mouse.move(20, 500);
    await page.clock.runFor(1500);
    await expect(action).toBeFocused();
    await action.hover();
    await page.getByTestId("outside").focus();
    await page.clock.runFor(1500);
    await expect(action).toBeVisible();
    await close.hover();
    await page.clock.runFor(1500);
    await expect(close).toBeVisible();
    await action.focus();
    await close.focus();
    await page.mouse.move(20, 500);
    await page.clock.runFor(1500);
    await expect(close).toBeFocused();
    await page.getByTestId("outside").focus();
    await page.clock.runFor(1100);
    await expect(action).toHaveCount(0);
  });
}

for (const platform of ["react", "native"]) {
  test(`${platform} moving a toast into a modal releases the old view's pause`, async ({ page }) => {
    await page.clock.install();
    await openFixture(page, platform, "?scenario=toast", "integration-contracts");
    await page.evaluate(() => (window as any).showToast());
    await page.getByRole("button", { name: "Action", exact: true }).focus();
    await page.evaluate(() => (window as any).openModal());
    await page.getByRole("button", { name: "Modal target", exact: true }).focus();
    await page.clock.runFor(1500);
    await expect(page.getByRole("button", { name: "Action", exact: true })).toHaveCount(0);
  });
}
