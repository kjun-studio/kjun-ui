import { test, expect } from "@playwright/test";
import { openFixture } from "./packed-fixture";
// Remote search races are covered by runtime-search/state-contracts and feedback queues by api-reference.
for (const platform of ["react", "vue2", "native"]) {
  test(`${platform} packed controls and menu support selection and disabled options`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await openFixture(page, platform, "", "expanded");
    await page.getByText("체크", { exact: true }).click();
    await expect(page.getByRole("checkbox", { name: "체크" })).toBeChecked();
    await page.getByText("스위치", { exact: true }).click();
    await expect(page.getByRole("switch", { name: "스위치" })).toBeChecked();
    if (platform === "react") {
      await page.getByRole("radio", { name: "A", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
    } else {
      await page.getByText("C", { exact: true }).click();
      await expect(page.getByRole("radio", { name: "B", exact: true })).toBeDisabled();
    }
    await expect(page.getByRole("radio", { name: "C", exact: true })).toBeChecked();
    const select = page.getByRole(platform === "vue2" ? "combobox" : "button", { name: "과일", exact: true });
    await select.click();
    await page.getByRole(platform === "native" ? "radio" : "option", { name: "체리", exact: true }).click();
    await expect(page.getByTestId("selected")).toHaveText("c");
    if (platform === "react") {
      await expect(select).toBeFocused();
      await page.getByRole("tab", { name: "첫 탭" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("tabpanel")).toHaveText("둘째 내용");
    } else {
      await page.getByRole("tab", { name: "둘째 탭" }).click();
      await expect(page.getByText("둘째 내용", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "메뉴 열기" }).click();
      await page.getByRole("menuitem", { name: "메뉴 항목" }).click();
      await expect(page.getByRole("status").filter({ hasText: "chosen" })).toBeVisible();
    }
    await page.getByRole("button", { name: "열기 하나" }).click();
    await expect(page.getByText("내용 하나", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "열기 둘" }).click();
    await expect(page.getByText("내용 하나", { exact: true })).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("React packed menus and feedback preserve scope during a mode change", async ({
  page,
}) => {
  await openFixture(page, "react", "", "expanded");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(page.getByRole("menuitem", { name: "메뉴 항목" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeFocused();
  await page.getByRole("button", { name: "알림 표시" }).click();
  const toast = page.getByRole("alert").filter({ hasText: "영역 알림" });
  await expect(toast).toHaveCSS("background-color", "rgb(227, 249, 238)");
  await page.getByRole("button", { name: "영역 색상 변경" }).click();
  await expect(toast).toHaveCSS("background-color", "rgb(249, 227, 238)");
  await expect(toast).toHaveCSS("font-family", "serif");
});

test("native tooltip preserves button events, hover and focus without opening a modal", async ({
  page,
}) => {
  await openFixture(page, "native", "", "expanded");
  const trigger = page.getByRole("button", { name: "도움", exact: true });
  await trigger.hover();
  const tooltip = page.getByRole("tooltip", { name: "도움말" });
  await expect(tooltip).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.mouse.move(1, 1);
  await expect(tooltip).not.toBeVisible();
  await trigger.focus();
  await expect(tooltip).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();
});
