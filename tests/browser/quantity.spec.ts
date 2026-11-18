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
  // aria-describedby can list the hint and the error; read every referenced element in order.
  const ids = (await input.getAttribute("aria-describedby"))?.split(/\s+/).filter(Boolean) ?? [];
  expect(ids.length).toBeGreaterThan(0);
  const texts = [];
  for (const id of ids) texts.push((await page.locator(`[id="${id}"]`).textContent())?.trim());
  return texts.join(" ");
}

for (const platform of ["react", "native", "vue3"]) {
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
  test(`${platform} quantity outside its range stays editable, shows invalid and steps back in`, async ({ page }) => {
    const input = await quantity(page, platform);
    await configure(page, { max: 1 });
    await expect(input).toBeEditable();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    const decrease = page.getByRole("button", { name: /수량 줄이기|Decrease quantity/ }), increase = page.getByRole("button", { name: /수량 늘리기|Increase quantity/ });
    await expect(increase).toBeDisabled();
    await expect(decrease).toBeEnabled();
    await decrease.click();
    await expect(events(page)).toHaveText('[["value",1],["commit",1]]');
    await expect(input).toHaveValue("1");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
  });
  test(`${platform} quantity with a negative minimum asks for a keyboard with a minus key`, async ({ page }) => {
    const input = await quantity(page, platform);
    await expect(input).toHaveAttribute("inputmode", "numeric");
    await configure(page, { min: -5 });
    await expect(input).toHaveAttribute("inputmode", "text");
  });
  test(`${platform} quantity repeats a held step button up to max without an extra step on release`, async ({ page }) => {
    const input = await quantity(page, platform);
    await configure(page, { max: 8 });
    const increase = page.getByRole("button", { name: /수량 늘리기|Increase quantity/ });
    await increase.hover();
    await page.mouse.down();
    await expect(input).toHaveValue("8", { timeout: 3000 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    await expect(input).toHaveValue("8");
    await expect(increase).toBeDisabled();
    const values = JSON.parse(await events(page).textContent() || "[]").filter((e: unknown[]) => e[0] === "value").map((e: unknown[]) => e[1]);
    expect(values).toEqual([3, 4, 5, 6, 7, 8]);
    // A short press after the hold still steps once.
    await reset(page);
    await page.getByRole("button", { name: /수량 줄이기|Decrease quantity/ }).click();
    await expect(events(page)).toHaveText('[["value",7],["commit",7]]');
  });
  test(`${platform} quantity keeps focus in the input while a step button is pressed`, async ({ page }) => {
    const input = await quantity(page, platform);
    await input.click();
    await page.getByRole("button", { name: /수량 늘리기|Increase quantity/ }).click();
    await expect(input).toHaveValue("3");
    await expect(input).toBeFocused();
  });
  test(`${platform} quantity group: the required star is not read and labelEnd sits on the label row`, async ({ page }) => {
    const input = await quantity(page, platform);
    await expect(input).toHaveAccessibleName("Order quantity");
    await configure(page, { labelEnd: true });
    const end = page.getByTestId("label-end");
    await expect(end).toHaveText("3/30");
    // A Text node takes the caption size like a string does (Native wraps it in a caption Text it inherits from).
    await expect(end).toHaveCSS("font-size", "12px");
    const [endBox, labelBox, inputBox] = [await end.boundingBox(), await page.getByText(/^Order quantity/).first().boundingBox(), await input.boundingBox()];
    expect(Math.abs(endBox!.y + endBox!.height - (labelBox!.y + labelBox!.height))).toBeLessThan(4);
    expect(endBox!.x).toBeGreaterThan(labelBox!.x + labelBox!.width);
    expect(endBox!.y + endBox!.height).toBeLessThanOrEqual(inputBox!.y);
  });
  if (platform !== "native") test(`${platform} quantity submits its value under name and not while disabled`, async ({ page }) => {
    await quantity(page, platform);
    await configure(page, { name: "qty" });
    const hidden = page.locator('input[type="hidden"][name="qty"]');
    await expect(hidden).toHaveValue("2");
    await configure(page, { value: 5 });
    await expect(hidden).toHaveValue("5");
    await configure(page, { disabled: true });
    await expect(hidden).toBeDisabled();
  });
}
