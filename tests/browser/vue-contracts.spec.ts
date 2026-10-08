import { icons } from '@kjun/icons/defaults';
import { exampleNames } from "../../shared/example-registry";
import { test, expect } from "@playwright/test";
import { openFixture } from "./packed-fixture";

test("Vue 2 packed CSS supplies geometry, transforms and visible keyboard focus without an app reset", async ({ page }) => {
  await openFixture(page, "vue2", "", "vue-contracts", "development");
  const primary = page.getByTestId("primary"), secondary = page.getByTestId("secondary");
  await expect(primary).toHaveCSS("height", "40px");
  await expect(primary).toHaveCSS("border-top-width", "0px");
  await expect(secondary).toHaveCSS("border-top-width", "0px");
  await expect(page.getByTestId("outside")).toHaveCSS("border-top-style", "outset");
  const card = page.getByTestId("card").locator(":scope > div");
  await expect(card).toHaveCSS("border-top-width", "0px");
  await expect.poll(() => card.evaluate(node => getComputedStyle(node, "::after").boxShadow)).toContain("0.5px");
  await expect(card.locator(":scope > .kjun-card-header")).toHaveCSS("padding", "16px");
  await expect(card.locator(":scope > .kjun-card-body")).toHaveCSS("padding", "0px 16px 16px");
  await expect(card.locator("h3")).toHaveCSS("margin", "0px");
  await expect(card.locator("p")).toHaveCSS("margin-top", "4px");
  await expect(card).not.toHaveCSS("box-shadow", "none");
  await card.hover();
  await expect(card).toHaveCSS("transform", "none");
  await page.getByTestId("outside").focus();
  await page.keyboard.press("Tab");
  await expect(primary).toBeFocused();
  await expect(primary).toHaveCSS("outline-style", "solid");
  await expect(primary).toHaveCSS("outline-width", "2px");
  const trigger = page.getByRole("combobox", { name: "목록 선택" });
  await trigger.click();
  await expect(trigger.locator("svg")).toHaveCSS("transform", "matrix(-1, 0, 0, -1, 0, 0)");
});

test("Vue 2 percent units, pill geometry and project formatter overrides survive packing", async ({ page }) => {
  await openFixture(page, "vue2", "", "vue-contracts");
  await expect(page.getByTestId("ratio")).toHaveText("+2.35%");
  await expect(page.getByTestId("raw")).toHaveText("+2.35%");
  await expect(page.getByTestId("raw").locator("span").first()).toHaveCSS("padding-left", "8px");
  await expect(page.getByTestId("deviation")).toHaveText("-1.25%");
  await expect(page.getByTestId("injected")).toHaveText("프로젝트 2.35");
  await expect(page.getByTestId("override")).toHaveText("셀 포맷");
  await page.getByRole("button", { name: "포맷 변경" }).click();
  await expect(page.getByTestId("injected")).toHaveText("변경 2.35");
});

test("Vue 2 icon preserves SVG direction, accessibility and component listeners", async ({ page }) => {
  await openFixture(page, "vue2", "", "vue-contracts");
  const icon = page.getByRole("img", { name: "새로고침 아이콘" });
  await expect(icon).toHaveCSS("width", "28px");
  // Direction belongs to the shared icon paths, without a second Vue mirror.
  await expect(icon.locator("g")).toHaveCount(0);
  await expect(icon.locator("path").first()).toHaveAttribute("d", icons.refresh[0][1].d);
  await icon.click();
  await expect(page.getByTestId("icon-clicks")).toHaveText("1");
  await expect(page.getByTestId("filled").locator("svg")).toHaveAttribute("fill", "currentColor");
  await page.getByRole("button", { name: "알림 닫기" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Vue 2 combobox rejects disabled options and selection supports boundary keys", async ({ page }) => {
  await openFixture(page, "vue2", "", "vue-contracts", "development");
  const combo = page.getByRole("combobox", { name: "목록 검색" });
  await combo.click();
  const blocked = page.getByRole("option", { name: "배", exact: true });
  await expect(blocked).toHaveAttribute("aria-disabled", "true");
  await blocked.dispatchEvent("mousedown");
  await expect(page.getByTestId("combo-value")).toHaveText("null");
  await combo.press("ArrowDown");
  await combo.press("ArrowDown");
  const lastId = await page.getByRole("option", { name: "체리" }).getAttribute("id");
  await expect(combo).toHaveAttribute("aria-activedescendant", lastId!);
  await combo.press("Home");
  await combo.press("End");
  await combo.press("Enter");
  await expect(combo).toHaveValue("체리");
  // The closing popup remains mounted during its exit motion.
  await expect(page.locator('[role="listbox"]')).toHaveCount(0);
  await page.getByRole("combobox", { name: "목록 선택" }).press("ArrowDown");
  await expect(page.getByRole("listbox").getByRole("option", { name: "사과" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox").getByRole("option", { name: "체리" })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("listbox").getByRole("option", { name: "체리" })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("listbox").getByRole("option", { name: "사과" })).toBeFocused();
  await page.keyboard.press("Space");
  await expect(page.getByRole("combobox", { name: "목록 선택" })).toHaveText("사과");
  await page.getByRole("button", { name: "비활성 전환" }).click();
  await expect(combo).toBeDisabled();
  for (const label of ["사과", "배", "체리"]) await expect(page.getByRole("radio", { name: "라디오 " + label })).toBeDisabled();
});

test("Vue 2 Escape closes the active selection popup before its containing modal", async ({ page }) => {
  await openFixture(page, "vue2", "", "vue-contracts");
  for (const name of ["모달 선택", "모달 검색"]) {
    const opener = page.getByRole("button", { name: "중첩 선택 열기" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "선택 대화상자" });
    const field = dialog.getByRole("combobox", { name });
    await field.click();
    await expect(field).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await expect(dialog).toBeVisible();
    await expect(field).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});

test("all Vue 2 catalog examples validate props in development across documented states", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (["warning", "error"].includes(message.type())) errors.push(message.text()); });
  await openFixture(page, "vue2", "?component=all", "catalog", "development");
  await expect(page.locator("[data-component]")).toHaveCount(exampleNames.length);
  await expect(page.locator('[data-component="DsExecutionStatusBadge"]')).toContainText("완료");
  await expect(page.locator('[data-component="DsSignedValue"]')).toContainText("+2.35%");
  for (const state of ["loading", "error", "disabled"]) {
    await page.evaluate(state => window.postMessage({ type: "kjun:catalog-configure", config: { loading: false, error: false, disabled: false, [state]: true } }, location.origin), state);
    if (state === "loading") await expect(page.locator('[data-component="DsButton"] button')).toHaveAttribute("aria-busy", "true");
    if (state === "error") await expect(page.locator('[data-component="DsInput"] input')).toHaveAttribute("aria-invalid", "true");
    if (state === "disabled") await expect(page.locator('[data-component="DsRadioGroup"] input').first()).toBeDisabled();
  }
  expect(errors).toEqual([]);
});
