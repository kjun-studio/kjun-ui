import { openExampleSettings } from './example-settings';
import { test, expect, type Page } from "@playwright/test";
import { tokens } from "../../../packages/tokens/dist/index.js";
const platforms = ["Vue 2", "React", "React Native"];
async function choose(page: Page, label: string, value: string) {
  if (label !== '문서 플랫폼') await openExampleSettings(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}
test("all documentation routes and mobile navigation", async ({ page }) => {
  const errors = errorsOn(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of [
    "/",
    "/principles",
    "/getting-started",
    "/tokens",
    "/styling",
    "/components/button",
    "/components/input",
    "/components/modal",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toBeEnabled();
    await expect(page.locator("h1")).toBeVisible();
    if (await page.locator(".playground iframe").count())
      await expect(
        page.frameLocator(".playground iframe").locator("button,input").first()
      ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy();
  }
  await page.goto("/");
  await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "/private/tmp/kjun-ui-overview-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  // Wait for the responsive sidebar to switch from desktop to the closed drawer.
  await expect(page.getByRole("button", { name: "탐색 메뉴", exact: true })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "탐색 메뉴", exact: true }).click();
  await page.getByRole("button", { name: "Inputs 분류", exact: true }).click();
  await page
    .getByRole("navigation", { name: "문서 탐색" })
    .getByRole("link", { name: "Input", exact: true })
    .click();
  await expect(page).toHaveURL(/components\/input/);
  await expect(
    page.frameLocator(".playground iframe").getByRole("textbox", { name: "목록 이름", exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBeTruthy();
  await expect(page.locator(".playground")).toHaveAttribute("data-ready", "true");
  await page.screenshot({
    path: "/private/tmp/kjun-ui-input-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
for (const platform of platforms) {
  test(
    platform +
      " button: project colors, sizes, action, disabled, loading, icon",
    async ({ page }) => {
      const errors = errorsOn(page);
      await page.goto("/components/button");
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      await choose(page, "문서 플랫폼", platform);
      await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toContainText(platform);
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      const demo = page.frameLocator(".playground iframe");
      const button = demo.getByRole("button", {
        name: "계속하기",
        exact: true,
      });
      await expect(button).toBeVisible();
      expect(
        await button.evaluate((el) => el.getBoundingClientRect().height)
      ).toBe(40);
      await button.click();
      await expect(
        demo.getByText("1번 실행했습니다", { exact: true })
      ).toBeVisible();
      for (const [label, color] of [
        ["보라색 예제", "rgb(109, 40, 217)"],
        ["어두운 배경 예제", "rgb(167, 139, 250)"],
        ["문서 기본", "rgb(0, 0, 0)"],
      ]) {
        await choose(page, "색상 예제", label);
        await page.mouse.move(0, 0);
        await expect(button).toHaveCSS("background-color", color);
        expect(
          await button.evaluate((el) => el.getBoundingClientRect().height)
        ).toBe(40);
      }
      await choose(page, "크기", "lg");
      await expect(button).toHaveCSS("height", "48px");
      await expect(button).toHaveCSS("border-radius", tokens.button.radii.lg + "px");
      await page.getByRole("switch", { name: "비활성", exact: true }).locator('xpath=ancestor::label').click();
      await expect(button).toBeDisabled();
      await page.getByRole("switch", { name: "비활성", exact: true }).locator('xpath=ancestor::label').click();
      await page.getByRole("switch", { name: "로딩", exact: true }).locator('xpath=ancestor::label').click();
      await expect(button).toBeDisabled();
      await page.getByRole("switch", { name: "로딩", exact: true }).locator('xpath=ancestor::label').click();
      await expect(button).toBeEnabled();
      await page
        .getByRole("switch", { name: "아이콘 전용", exact: true }).locator('xpath=ancestor::label').click();
      await expect(
        demo.getByRole("button", { name: "항목 추가", exact: true })
      ).toBeVisible();
      expect(errors).toEqual([]);
    }
  );
  test(
    platform + " input: controlled value, clear, error and read-only",
    async ({ page }) => {
      const errors = errorsOn(page);
      await page.goto("/components/input");
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      await choose(page, "문서 플랫폼", platform);
      await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toContainText(platform);
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      const demo = page.frameLocator(".playground iframe");
      const input = demo.getByRole("textbox", { name: "목록 이름", exact: true });
      await expect(input).toBeVisible();
      expect(
        await input.evaluate((el) => el.getBoundingClientRect().height)
      ).toBe(tokens.input.md.height);
      await input.fill("공유 컴포넌트");
      await expect(input).toHaveValue("공유 컴포넌트");
      await choose(page, "크기", "lg");
      await expect(input).toHaveValue("공유 컴포넌트");
      expect(await input.evaluate(el => el.getBoundingClientRect().height)).toBe(tokens.input.lg.height);
      await demo
        .getByRole("button", { name: "입력 지우기", exact: true })
        .click();
      await expect(input).toHaveValue("");
      await page.getByRole("switch", { name: "오류", exact: true }).locator('xpath=ancestor::label').click();
      await input.focus();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(demo.getByRole("alert")).toContainText(
        "목록 이름을 입력해 주세요."
      );
      await page
        .getByRole("switch", { name: "읽기 전용", exact: true }).locator('xpath=ancestor::label').click();
      await expect(input).not.toBeEditable();
      await page
        .getByRole("switch", { name: "읽기 전용", exact: true }).locator('xpath=ancestor::label').click();
      await page.getByRole("switch", { name: "비활성", exact: true }).locator('xpath=ancestor::label').click();
      await expect(input).not.toBeEditable();
      expect(errors).toEqual([]);
    }
  );
  test(
    platform + " modal: confirm, cancel, Escape, focus and project colors",
    async ({ page }) => {
      const errors = errorsOn(page);
      // Keep iframe pointer targets stationary; document-navigation covers scrolling.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/components/modal");
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      await choose(page, "문서 플랫폼", platform);
      await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toContainText(platform);
      await expect(page.locator(".playground")).toHaveAttribute(
        "data-ready",
        "true"
      );
      await choose(page, "색상 예제", "보라색 예제");
      const demo = page.frameLocator(".playground iframe");
      const trigger = demo.getByRole("button", {
        name: "모달 열기",
        exact: true,
      });
      await trigger.click();
      const dialog = demo.getByRole("dialog", {
        name: "변경 사항 저장",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "취소", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole("button", { name: "저장", exact: true }).click();
      await expect(
        demo.getByText("저장했습니다", { exact: true })
      ).toBeVisible();
      await expect(dialog).not.toBeVisible();
      if (platform !== "React Native")
        expect(
          await trigger.evaluate(() => document.body.style.overflow)
        ).not.toBe("hidden");
      expect(errors).toEqual([]);
    }
  );
}
test("mobile platforms, reduced motion and enlarged text", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/button");
  for (const platform of platforms) {
    await expect(page.locator(".playground")).toHaveAttribute(
      "data-ready",
      "true"
    );
    await choose(page, "문서 플랫폼", platform);
    await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toContainText(platform);
    await expect(page.locator(".playground")).toHaveAttribute(
      "data-ready",
      "true"
    );
    const button = page
      .frameLocator(".playground iframe")
      .getByRole("button", { name: "계속하기", exact: true });
    await expect(button).toBeVisible();
    await button.click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy();
  }
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBeTruthy();
  await page.screenshot({
    path: "/private/tmp/kjun-ui-enlarged-mobile.png",
    fullPage: true,
  });
});
test("WebMCP uses live state and rejects invalid input", async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__kjunTools = {};
    Object.defineProperty(document, "modelContext", {
      value: {
        registerTool(tool: any, options: any) {
          (window as any).__kjunTools[tool.name] = tool;
          options?.signal?.addEventListener(
            "abort",
            () => delete (window as any).__kjunTools[tool.name]
          );
        },
      },
    });
  });
  await page.goto("/components/button");
  await page.waitForFunction(
    () => !!(window as any).__kjunTools.configure_component_preview
  );
  const result = await page.evaluate(() => {
    const config = {
      component: "button",
      palette: "violet",
      size: "lg",
      variant: "primary",
      loading: false,
      disabled: false,
      error: false,
      readOnly: false,
      iconOnly: false,
      block: false,
    };
    return (window as any).__kjunTools.configure_component_preview.execute({
      platform: "react",
      config,
    });
  });
  expect(result.config.palette).toBe("violet");
  await expect(page.getByRole("button", { name: "문서 플랫폼", exact: true })).toContainText("React");
  await expect(page).toHaveURL(url => url.searchParams.get('platform') === 'react');
  await expect(page.locator('#api .api-platform')).toContainText('@kjun/react');
  const button = page
    .frameLocator(".playground iframe")
    .getByRole("button", { name: "계속하기", exact: true });
  await expect(button).toHaveCSS("height", "48px");
  await expect(button).toHaveCSS("background-color", "rgb(109, 40, 217)");
  const rejected = await page.evaluate(() => {
    try {
      (window as any).__kjunTools.configure_component_preview.execute({
        platform: "wrong",
        config: {},
      });
      return false;
    } catch {
      return true;
    }
  });
  expect(rejected).toBeTruthy();
});

test("catalog documentation routes expose API and packed examples", async ({ page, context }) => {
  test.setTimeout(300000);
  const { readFileSync } = await import("node:fs");
  const catalog = JSON.parse(readFileSync("shared/component-catalog.json", "utf8"));
  const entries = catalog.filter((item: { kind: string }) => item.kind !== "internal");
  const extraPages = await Promise.all(Array.from({ length: 3 }, () => context.newPage()));
  const pages = [page, ...extraPages];
  const errors = pages.map(errorsOn);
  try {
    await Promise.all(pages.map(async (tab, worker) => {
      for (let index = worker; index < entries.length; index += pages.length) {
        const response = await tab.goto(entries[index].docs);
        expect(response?.status()).toBe(200);
        await expect(tab.locator("h1")).toBeVisible();
        await expect(tab.locator("#api")).toBeVisible();
        await expect(tab.locator(".playground")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
      }
    }));
    await page.goto("/catalog");
    await expect(page.locator("#coverage tbody tr")).toHaveCount(entries.length);
    await expect(page.locator("#coverage tbody .coverage-component-link")).toHaveCount(entries.length);
    await page.goto("/getting-started");
    // Platform package, shared tokens and icon data.
    await expect(page.locator('.download-row a')).toHaveCount(3);
    const hrefs = await page.locator(".download-row a").evaluateAll(links => links.map(link => link.getAttribute("href")!));
    await Promise.all(hrefs.map(async href => {
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      expect((await response.body()).length).toBeGreaterThan(1000);
    }));
    expect(errors.flat()).toEqual([]);
  } finally {
    await Promise.all(extraPages.map(tab => tab.close()));
  }
});
