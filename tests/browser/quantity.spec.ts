import { test, expect, type Page, type Locator } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// QuantityStepper editing, IME, field identity and controlled changes.
const configure = (page: Page, next: object) => page.evaluate(value => (window as any).configureReview(value), next);
const events = (page: Page) => page.getByTestId("events");
const reset = (page: Page) => page.evaluate(() => (window as any).resetReviewEvents());

async function quantity(page: Page, platform: string) {
  await openFixture(page, platform, "", "review-contract");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  const input = page.getByRole("spinbutton");
  await expect(input).toBeVisible();
  return input;
}
async function described(page: Page, input: Locator) {
  const id = await input.getAttribute("aria-describedby");
  expect(id).toBeTruthy();
  return (await page.locator(`[id="${id}"]`).textContent())?.trim();
}

for (const platform of ["react", "native", "vue2"]) {
  test(`${platform} quantity cancels its edit before dismissing the parent Modal`, async ({ page }) => {
    const input = await quantity(page, platform);
    await input.fill("9"); await input.press("Escape");
    await expect(input).toHaveValue("2"); await expect(input).toBeFocused();
    await expect(events(page)).toHaveText("[]");
    await expect(page.getByRole("dialog", { name: "Editor", exact: true })).toBeVisible();
    await input.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open", exact: true })).toBeFocused();
  });
  test(`${platform} quantity leaves IME keys alone and commits once on ordinary Enter`, async ({ page }) => {
    const input = await quantity(page, platform);
    await input.fill("9"); await input.dispatchEvent("compositionstart");
    for (const key of ["Enter", "ArrowUp", "ArrowDown"])
      await input.dispatchEvent("keydown", { key, isComposing: true });
    await expect(events(page)).toHaveText("[]");
    await input.dispatchEvent("compositionend", { data: "9" });
    for (const key of ["Enter", "ArrowUp", "ArrowDown"])
      await input.dispatchEvent("keydown", { key, keyCode: 229, isComposing: false });
    await expect(events(page)).toHaveText("[]"); await expect(input).toHaveValue("9");
    await input.press("Enter"); await input.press("Tab");
    await expect(events(page)).toHaveText('[["value",9],["commit",9]]');
  });
  test(`${platform} quantity inherits field identity and updates error, hint and explicit overrides`, async ({ page }) => {
    const input = await quantity(page, platform);
    await expect(input).toHaveAccessibleName(/Order quantity/);
    await expect(input).toHaveAttribute("id", "quantity-field");
    await expect(input).toHaveAttribute("aria-required", "true");
    expect(await described(page, input)).toBe("Quantity hint");
    await configure(page, { error: "Quantity error" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await described(page, input)).toContain("Quantity error");
    await configure(page, { ariaLabel: "Override quantity", inputId: "override-id" });
    await expect(input).toHaveAccessibleName("Override quantity");
    await expect(input).toHaveAttribute("id", "override-id");
    expect(await described(page, input)).toContain("Quantity error");
    await configure(page, { error: "", required: false });
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(input).not.toHaveAttribute("aria-required", "true");
    expect(await described(page, input)).toBe("Quantity hint");
  });
  test(`${platform} quantity honors rejected changes, external resets and disabling`, async ({ page }) => {
    const input = await quantity(page, platform);
    await configure(page, { accept: false });
    await input.fill("9"); await input.press("Enter");
    await expect(input).toHaveValue("2");
    await expect(events(page)).toHaveText('[["value",9],["commit",9]]');
    await input.fill("invalid"); await input.press("Tab");
    await expect(input).toHaveValue("2");
    await expect(events(page)).toContainText('["invalid","invalid"]');
    await input.fill("8"); await configure(page, { value: 4 });
    await expect(input).toHaveValue("4");
    await reset(page); await configure(page, { disabled: true });
    await expect(input).not.toBeEditable();
    await input.dispatchEvent("keydown", { key: "ArrowUp" });
    await expect(events(page)).toHaveText("[]");
  });
}
