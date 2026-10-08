import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync("shared/component-catalog.json", "utf8")
) as { name: string; kind: string }[];
const names = Object.keys(JSON.parse(readFileSync("artifacts/examples/manifest.json", "utf8")));
for (const platform of ["vue2", "react", "native"]) {
  test(`${platform} packed catalog renders every public component`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/previews/catalog-${platform}.html?component=all`);
    await expect(page.locator("[data-component]")).toHaveCount(names.length);
    const rendered = await page.locator('[data-component]').evaluateAll(nodes =>
      Object.fromEntries(nodes.map(node => [node.getAttribute('data-component'),
        node.querySelector('.catalog-render')?.childNodes.length || 0])));
    for (const name of names) expect(rendered[name], name).toBeGreaterThan(0);
    await expect(
      page.locator('[data-component="DsMarketSimpleList"]')
    ).toContainText("긴 한국어 자산 이름");
    await expect(
      page.locator('[data-component="DsMarketCards"]')
    ).toContainText("긴 한국어 자산 이름");
    expect(errors).toEqual([]);
  });
  test(`${platform} packed table sorts, selects, expands and switches to mobile cards`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto(`/previews/catalog-${platform}.html?component=DsTable`);
    const root = page.locator('[data-component="DsTable"]');
    await expect(root).toContainText("긴 한국어 자산 이름");
    await root
      .getByRole(platform === "vue2" ? "columnheader" : "button", {
        name: "가격",
        exact: true,
      })
      .click();
    const selected = root.getByRole("checkbox").nth(1);
    await selected.click();
    await expect(root).toContainText("1개 선택");
    const expand = root
      .getByRole("button", { name: /행 확장|상세 보기/ })
      .first();
    await expand.click();
    await expect(root).toContainText("상세:");
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(root.getByRole("table")).not.toBeVisible();
    await expect(root).toContainText("긴 한국어 자산 이름");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  });
  test(`${platform} packed data state distinguishes changed queries and refresh failures`, async ({
    page,
  }) => {
    await page.goto(`/previews/catalog-${platform}.html?component=DsDataState`);
    await expect(page.getByText("조회 결과", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "동일 조건 갱신" }).click();
    await expect(page.getByText("조회 결과", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "조회 실패" }).click();
    await expect(page.getByText("조회 결과", { exact: true })).toBeVisible();
    await expect(
      page.getByText("조회에 실패했습니다", { exact: false }).first()
    ).toBeVisible();
    await page.getByRole("button", { name: "조건 변경" }).click();
    await expect(
      page.getByText("조회 결과", { exact: true })
    ).not.toBeVisible();
    await page.getByRole("button", { name: "조회 완료" }).click();
    await expect(page.getByText("조회 결과", { exact: true })).toBeVisible();
  });
}

for (const platform of ["vue2", "react", "native"]) {
  test(`${platform} open modal and feedback update together when project colors change`, async ({
    page,
  }) => {
    await page.goto(`/previews/catalog-${platform}.html?component=DsModal`);
    await page.getByRole("button", { name: "모달 열기", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "작업 확인", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "알림 표시" }).click();
    const toast = page.getByText("열린 레이어의 영역 알림", { exact: true });
    await expect(toast).toBeVisible();
    if (platform === "native")
      expect(
        await toast.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return !!document
            .elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
            ?.closest('[role="alert"]');
        })
      ).toBe(true);
    await page.evaluate(() =>
      window.postMessage(
        { type: "kjun:catalog-configure", config: { palette: "dark" } },
        location.origin
      )
    );
    await expect(
      platform === "react" ? page.locator(".kjun-modal") : dialog
    ).toHaveCSS("background-color", "rgb(24, 24, 24)");
    await expect(toast).toHaveCSS("color", "rgb(212, 212, 212)");
    await page.getByRole("button", { name: "알림 닫기" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
}
