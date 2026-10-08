import { goToGuide } from './guide-navigation';
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { designCases, designScenarios } from "../../../shared/visual-guides/design-cases";
import { usageGuideHref } from "../../../shared/document-navigation";
import { checkAdditionalCase } from "./design-case-actions";
// @ts-ignore Node-only packed consumer verifier.
import { prepareExample, compileEntries } from "../../../scripts/example-consumers.mjs";
import { exportsRoute } from './export-checks';

// Keep pointer targets stationary while scrolling between embedded examples.
// Scroll and anchor behavior is covered separately in document-navigation.spec.ts.
test.use({ reducedMotion: "reduce", actionTimeout: 30000 });

async function openCase(page: Page, id: string, width = 375) {
  const section = page.locator(`[data-design-case="${id}"]`);
  await section.scrollIntoViewIfNeeded();
  // Figures appear after the shared platform provider's client effect. Unlike
  // playgrounds, they are present on every design guide, including feedback.
  // Routed export tests disable browser caching; allow the dev client to load.
  await expect(section.locator('.design-graphic img').first()).toBeVisible({ timeout: 30000 });
  await section.getByRole("tab", { name: width === 375 ? "좁은 화면 · 375px" : "넓은 화면 · 640px" }).click();
  const trigger = section.locator(".design-execution").getByRole("button", { name: /^실행 예제 (보기|접기)$/ });
  if (await trigger.getAttribute("aria-expanded") !== "true") await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const after = section.locator(`.guide-example[data-guide-case="${id}-after-${width}"]`);
  await after.scrollIntoViewIfNeeded();
  const layerTrigger = after.getByRole("button", { name: "실행 비교 열기", exact: true });
  if (id === "delete-confirmation") {
    await expect(layerTrigger).toBeVisible();
    await expect(section.locator("iframe")).toHaveCount(0);
  }
  if (await layerTrigger.count()) await layerTrigger.click();
  await expect(after.locator(".guide-running")).toHaveAttribute("data-ready", "true");
  if (id === "delete-confirmation") {
    await expect(after.frameLocator("iframe").getByRole("dialog", { name: "‘프로젝트 계획’을 삭제할까요?", exact: true })).toBeVisible();
  }
  await after.locator("iframe").scrollIntoViewIfNeeded();
  await after.frameLocator("iframe").locator("body").evaluate(() => document.fonts.ready);
  await expect(after.locator("iframe")).toHaveCSS("width", width + "px");
  expect(await after.frameLocator("iframe").locator("body").evaluate(() => innerWidth)).toBe(width);
  return { section, after, frame: after.frameLocator("iframe") };
}
for (const platform of ["vue2", "react", "native"] as const) {
  // Figures, disclosure and widths belong to the docs page; the packed-consumer test below keeps all
  // three platforms because each runs a different package.
  if (platform === "react") test(`${platform} design figures, disclosure, actual widths and independent actions`, async ({ page }) => {
    test.setTimeout(240000);
    for (const item of designCases) {
      await goToGuide(page, item.section, platform);
      await expect(page.locator(".design-case iframe")).toHaveCount(0);
      const section = page.locator(`[data-design-case="${item.id}"]`);
      await section.scrollIntoViewIfNeeded();
      // Tabs keep inactive width panes mounted; only the active tabpanel is exposed.
      const figures = section.getByRole("tabpanel").locator(".design-graphic img");
      await expect(figures).toHaveCount(2);
      await expect(figures.first()).toHaveAttribute("src", new RegExp(`${platform}-${item.id}-before-375`));
      for (const width of [375, 640]) {
        const { frame, after } = await openCase(page, item.id, width);
        expect(await frame.locator("body").evaluate(body => body.scrollWidth <= innerWidth + 1)).toBe(true);
        if (item.id === "action-placement") {
          const actions = frame.getByTestId("design-actions");
          await expect(actions.getByRole("button")).toHaveText(["취소", "변경 사항 저장"]);
          await frame.getByRole("textbox").fill("바뀐 프로젝트");
          await actions.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
          await expect(frame.getByText("변경 사항을 저장했습니다.", { exact: true })).toBeVisible();
          await actions.getByRole("button", { name: "취소", exact: true }).click();
          await expect(frame.getByRole("textbox")).toHaveValue("함께 만드는 프로젝트");
          await expect(frame.getByText("편집을 취소했습니다.", { exact: true })).toBeVisible();
        } else if (item.id === "long-fields") {
          await frame.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
          await expect(frame.getByText("팀원이 알아볼 수 있는 프로젝트 이름을 입력해 주세요.", { exact: true })).toBeVisible();
          const fields = frame.getByRole("textbox");
          const one = await fields.nth(0).boundingBox(), two = await fields.nth(1).boundingBox();
          expect(Math.abs(one!.x - two!.x)).toBeLessThan(1);
          expect(two!.y).toBeGreaterThan(one!.y + one!.height);
          await fields.first().fill("함께 만드는 문서");
          await frame.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
          await expect(frame.getByText("변경 사항을 저장했습니다.", { exact: true })).toBeVisible();
        } else if (item.id === "long-button") {
          await expect(frame.getByText("모든 팀원에게 적용됩니다. 저장 후 설정 화면으로 돌아갑니다.", { exact: true })).toBeVisible();
          expect(await frame.getByTestId("design-button-action").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        } else if (item.id === "row-actions") {
          const share = frame.getByRole("button", { name: "프로젝트 계획 공유", exact: true });
          await share.focus(); await share.press("Enter");
          await expect(frame.getByText("프로젝트 계획 공유 안내", { exact: true })).toBeVisible();
          expect(await share.evaluate(el => !!el.parentElement?.closest('button, a, [role="button"]'))).toBe(false);
          await frame.getByRole("button", { name: /프로젝트 계획.*이번 주/ }).click();
          await expect(frame.getByText("프로젝트 계획 상세 열기", { exact: true })).toBeVisible();
        } else await checkAdditionalCase(frame, item.id, true);
        if (item.viewportHeight) {
          await expect(after.locator("iframe")).toHaveCSS("height", item.viewportHeight + "px");
          expect(await frame.locator("body").evaluate(() => innerHeight)).toBe(item.viewportHeight);
        }
        await after.getByRole("button", { name: "초기화", exact: true }).click();
        if (item.id === "empty-vs-error") {
          await frame.getByRole("button", { name: "조회 재시도", exact: true }).click();
          await expect(frame.getByText("회의 기록", { exact: true })).toBeVisible();
          await expect(frame.getByText("완료된 문서가 없습니다", { exact: true })).toBeVisible();
        }
      }
      await section.getByRole("button", { name: "실행 예제 접기", exact: true }).click();
    }
  });
  test(`${platform} all design exports render and recommended initial implementations run in a packed consumer`, async ({ page, context }) => {
    test.setTimeout(300000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await exportsRoute(page);
    for (const { name, scenario } of designScenarios) {
      await page.setViewportSize({ width: scenario.viewportWidth!, height: scenario.viewportHeight || 1100 });
      await page.goto(`/previews/export-checks/${platform}/${name}-usage-${scenario.id}.html`);
      await expect(page.locator('[data-testid^="design-"]').first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.body.scrollWidth <= innerWidth + 1)).toBe(true);
      const item = designCases.find(item => item.name === name)!;
      await checkAdditionalCase(page, item.id, scenario.settings?.arrangement === "after");
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const id of ["field-errors", "delete-confirmation", "refresh-context", "keyboard-layout"]) {
      const item = designCases.find(item => item.id === id)!;
      await goToGuide(page, item.section, platform);
      await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as any).__designCopy = text; } } }));
      const { after, frame } = await openCase(page, id);
      if (["long-fields", "field-errors", "keyboard-layout"].includes(id)) {
        if (id === "keyboard-layout") await frame.getByRole("button", { name: "키보드 모의 영역 끄기", exact: true }).click();
        await frame.getByRole("textbox").first().fill(id === "field-errors" ? "copy@example.com" : "복사 후에도 유지할 프로젝트 이름");
      } else if (id === "delete-confirmation") {
        await frame.getByRole("button", { name: "취소", exact: true }).click();
      } else {
        await frame.getByText("선택", { exact: true }).click();
        await frame.getByRole("button", { name: "갱신 실패", exact: true }).click();
      }
      await page.evaluate(() => { (window as any).__designCopy = ""; });
      await page.locator(`[data-design-case="${id}"] .implementation-usage`).getByRole("button", { name: "구현 코드 복사", exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__designCopy)).toBeTruthy();
      const code = await page.evaluate(() => (window as any).__designCopy);
      expect(code).not.toContain("instrumentRenderer");
      const entry = await prepareExample(platform, item.name, "design-copy", { arrangement: "after" }, {}, "default", code, "usage");
      await compileEntries(platform, { [item.name + "-design-copy"]: entry });
      const replay = await context.newPage(); await exportsRoute(replay);
      await replay.setViewportSize({ width: 375, height: item.viewportHeight || 1100 });
      await replay.goto(`/previews/export-checks/${platform}/${item.name}-design-copy.html`);
      if (id === "delete-confirmation") {
        await expect(replay.getByRole("dialog", { name: "‘프로젝트 계획’을 삭제할까요?", exact: true })).toBeVisible();
      } else if (id === "refresh-context") {
        await expect(replay.getByRole("checkbox", { name: /선택/ })).toBeChecked();
      } else {
        await expect(replay.getByRole("textbox").first()).toHaveValue(id === "field-errors" ? "team@" : "함께 만드는 프로젝트");
        if (id === "keyboard-layout") await expect(replay.getByText('키보드 예시 영역 · 220px', { exact: true })).toBeVisible();
      }
      await replay.close();
    }
    expect(errors).toEqual([]);
  });
}

test("design details retain links to their full usage guides", async ({ page }) => {
  test.setTimeout(180000);
  const catalog = JSON.parse(await readFile("shared/component-catalog.json", "utf8"));
  for (const item of designCases) for (const component of item.components) {
    const { docs: path } = catalog.find((entry: any) => entry.name === component), id = item.id;
    await page.goto(`${path}?platform=react#design-${id}`);
    const [guide, anchor] = usageGuideHref(item.section).split('#');
    await expect(page.locator(`#design-${id}`).getByRole('link')).toHaveAttribute('href', `${guide}?platform=react#${anchor}`);
    await expect(page.locator('.design-figure')).toHaveCount(0);
  }
});

test("mobile design figures and execution disclosures remain usable inline", async ({ page, context }) => {
  test.setTimeout(300000);
  for (const width of [320, 390]) {
    for (const item of designCases) {
      // Each comparison is independent. Dispose its live iframe tree before the next case.
      await page.close();
      page = await context.newPage();
      await page.setViewportSize({ width, height: 844 });
      await goToGuide(page, item.section, "react");
      const { section, after, frame } = await openCase(page, item.id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(after.locator("iframe")).toHaveAttribute("tabindex", "0");
      await after.locator("iframe").focus(); await expect(after.locator("iframe")).toBeFocused();
      if (item.id === "delete-confirmation") await frame.getByRole("button", { name: "취소", exact: true }).click();
      const figure = section.getByRole("tabpanel").locator('.design-graphic img').last();
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toBeVisible();
      await expect(section.getByRole("button", { name: "도해 크게 보기", exact: true })).toHaveCount(0);
      await section.getByRole("button", { name: "실행 예제 접기", exact: true }).click();
    }
  }
});

test("inline design figure image failures can retry and open execution examples", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/design-figures/*.png*", route => route.abort());
  await goToGuide(page, "action-placement", "react");
  // A hash-only navigation retains loaded images; reload to exercise a failed request.
  await page.reload();
  const section = page.locator('[data-design-case="action-placement"]');
  await section.locator(".design-figure").first().scrollIntoViewIfNeeded();
  await expect(section.getByText(/비교 이미지를 불러오지 못했습니다/).first()).toBeVisible();
  await expect(section.getByText("강조는 주요 행동에", { exact: true }).first()).toBeVisible();
  await page.unroute("**/design-figures/*.png*");
  await section.getByRole("button", { name: "이미지 다시 불러오기", exact: true }).first().click();
  await expect(section.locator(".design-graphic img").first()).toBeVisible();
  await expect(section.getByRole("button", { name: "도해 크게 보기", exact: true })).toHaveCount(0);
  await section.locator(".design-execution").getByRole("button", { name: "실행 예제 보기", exact: true }).first().click();
  await expect(section.getByRole("button", { name: "실행 예제 접기", exact: true })).toBeFocused();
});
