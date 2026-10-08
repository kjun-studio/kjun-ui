import { goToGuide } from './guide-navigation';
import { test, expect, type Page } from "@playwright/test";
import { presetConfig } from "../../../shared/example-registry";
// @ts-ignore Node-only packed consumer verifier.
import { prepareExample, compileEntries } from "../../../scripts/example-consumers.mjs";
import { comparisons } from "../../../shared/visual-guides/usage-content";
import { exportsRoute } from './export-checks';
const platforms = ["vue2", "react", "native"] as const;
async function choose(page: Page, region: string, label: string, value: string) {
  const trigger = page.locator(region).getByRole("button", { name: label, exact: true });
  await expect(page.locator(region + " .playground")).toHaveAttribute("data-ready", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute("aria-controls", /.+/);
  const popup = await trigger.getAttribute('aria-controls');
  await page.locator(`[id="${popup}"]`).getByRole("option", { name: value, exact: true }).click();
  await expect(page.locator(region + " .playground")).toHaveAttribute("data-ready", "true");
}
for (const platform of platforms) {
  test(`${platform} four choice boards load and layer examples remain independently operable`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const comparison of comparisons) {
      await goToGuide(page, comparison.id, platform);
      for (const [name] of comparison.rows) {
        const card = page.locator("#" + comparison.id + ' [data-guide-case="choose-' + name + '"]');
        await card.scrollIntoViewIfNeeded();
        const activate = card.getByRole("button", { name: "실행 비교 열기", exact: true });
        if (await activate.count()) await activate.click();
        await expect(card.locator(".guide-running")).toHaveAttribute("data-ready", "true");
        await expect(card.locator(".guide-running")).toHaveAttribute("data-platform", platform);
        const frame = card.frameLocator("iframe");
        if (name === "DsModal") {
          await frame.getByRole("button", { name: "모달 열기", exact: true }).click();
          await expect(frame.getByRole("dialog").last()).toBeVisible();
          await expect
            .poll(() => card.locator("iframe").evaluate((el) => el.getBoundingClientRect().height))
            .toBeGreaterThanOrEqual(600);
          await card.locator("iframe").scrollIntoViewIfNeeded();
          for (const control of [frame.getByRole('textbox').first(), frame.getByRole('button', {name:'확인', exact:true})]) {
            expect(await control.evaluate(el => {
              const box = el.getBoundingClientRect();
              return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
            })).toBe(true);
          }
          await frame.getByRole("button", { name: "취소", exact: true }).click();
          await expect(frame.getByRole("dialog")).toHaveCount(0);
        }
        if (name === "DsSelect") {
          await frame
            .getByRole(platform === "vue2" ? "combobox" : "button", {
              name: platform === "native" ? "자산 선택" : "공개 범위",
              exact: true,
            })
            .click();
          await expect
            .poll(() => card.locator("iframe").evaluate((el) => el.getBoundingClientRect().height))
            .toBeGreaterThanOrEqual(400);
          await card.locator("iframe").scrollIntoViewIfNeeded();
          await frame
            .getByRole(platform === "native" ? "radio" : "option", {
              name: "두 번째 자산 · BBB",
              exact: true,
            })
            .click();
          await expect(
            frame.getByRole(platform === "vue2" ? "combobox" : "button", {
              name: platform === "native" ? "자산 선택" : "공개 범위",
              exact: true,
            }),
          ).toContainText("두 번째 자산");
        }
        if (name === "KjunFeedbackProvider") {
          await frame.getByRole("button", { name: "Toast 표시", exact: true }).click();
          await expect(frame.getByText("변경 사항을 저장했습니다.", { exact: true })).toBeVisible();
        }
        await expect(card.locator(".code-block")).toHaveCount(0);
        await expect(card.getByRole("link", { name: "상세 예제" })).toHaveAttribute("href", new RegExp("platform=" + platform + "#usage$"));
      }
    }
  });
  test(`${platform} anatomy, state metadata, and selected platform remain aligned`, async ({
    page,
  }) => {
    await page.goto("/components/select?platform=" + platform + "#anatomy");
    const anatomy = page.locator("#anatomy");
    await expect(anatomy.locator(".anatomy-graphic img")).toHaveCount(2);
    await expect(anatomy.locator(".anatomy-graphic img").first()).toHaveAttribute(
      "src",
      new RegExp(platform + "-DsSelect"),
    );
    await expect(anatomy.locator(".anatomy-graphic img").first()).toBeVisible();
    await expect(anatomy.getByRole("button", { name: "도해 크게 보기" })).toHaveCount(0);
    await expect(anatomy.locator(".guide-case-actions")).toHaveCount(0);
    await expect(anatomy.locator(".anatomy-parts").first()).toBeVisible();
    await page.goto("/components/radio-group?platform=" + platform + "#states");
    await expect(page.locator('#states [data-guide-case="disabled"]')).toHaveCount(
      platform === "vue2" ? 1 : 0,
    );
    await page.goto("/components/form-group?platform=" + platform + "#anatomy");
    await expect(page.locator("#anatomy")).toContainText("hint 대신 표시");
    await expect(page.locator("#anatomy .anatomy-graphic img").last()).toHaveAttribute(
      "src",
      new RegExp(platform + "-DsFormGroup-error"),
    );
  });
  test(`${platform} composition form validates, saves, copies initial implementation and resets`, async ({
    page,
    context,
  }) => {
    await goToGuide(page, "form", platform);
    const section = page.locator("#form"),
      frame = page.frameLocator("#form .playground iframe");
    await expect(section.locator(".playground")).toHaveAttribute("data-ready", "true");
    await frame.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
    await expect(frame.getByText("목록 이름을 입력해 주세요.", { exact: true })).toBeVisible();
    await frame.getByRole("textbox", { name: /^목록 이름/ }).fill("함께 볼 자산");
    await frame.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
    await expect(frame.getByText("변경 사항을 저장했습니다.", { exact: true })).toBeVisible();
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as any).__visualCopy = text;
          },
        },
      }),
    );
    await section
      .locator(".implementation-usage .code-block")
      .getByRole("button", { name: "구현 코드 복사", exact: true })
      .click();
    await expect.poll(() => page.evaluate(() => (window as any).__visualCopy)).toBeTruthy();
    const source = await page.evaluate(() => (window as any).__visualCopy);
    expect(source).not.toContain("함께 볼 자산");
    expect(source).not.toContain("instrumentRenderer");
    const entry = await prepareExample(
      platform,
      "GuideSettingsForm",
      "visual-copy",
      presetConfig("GuideSettingsForm").settings,
      {},
      "default",
      source,
      "usage",
    );
    await compileEntries(platform, { "GuideSettingsForm-visual-copy": entry });
    const copy = await context.newPage();
    await exportsRoute(copy);
    await copy.goto(`/previews/export-checks/${platform}/GuideSettingsForm-visual-copy.html`);
    await expect(copy.getByRole("textbox", { name: /^목록 이름/ })).toHaveValue("");
    await copy.close();
    await frame.getByRole("button", { name: "입력 초기화", exact: true }).click();
    await expect(frame.getByRole("textbox", { name: /^목록 이름/ })).toHaveValue("");
  });
  test(`${platform} toolbar filtering and empty/error list next actions work`, async ({ page }) => {
    await goToGuide(page, "toolbar", platform);
    const toolbar = page.frameLocator("#toolbar .playground iframe");
    await expect(page.locator("#toolbar .playground")).toHaveAttribute("data-ready", "true");
    await toolbar.getByRole("button", { name: "상승 자산", exact: true }).click();
    await expect(toolbar.getByText("1개 결과", { exact: true })).toBeVisible();
    await toolbar.getByRole("button", { name: "필터 초기화", exact: true }).click();
    await expect(toolbar.getByText("3개 결과", { exact: true })).toBeVisible();
    await choose(page, "#assets", "조회 상태", "빈 결과");
    const list = page.frameLocator("#assets .playground iframe");
    await expect(list.getByText("조건에 맞는 자산이 없습니다")).toBeVisible();
    await list.getByRole("button", { name: "필터 초기화", exact: true }).click();
    await expect(list.getByText("긴 한국어 자산 이름", { exact: true })).toBeVisible();
    await choose(page, "#assets", "조회 상태", "실패");
    await expect(list.getByText(/자산 목록을 불러오지 못했습니다/)).toBeVisible();
    await list.getByRole("button", { name: /다시 시도|재시도/ }).click();
    await expect(list.getByText("긴 한국어 자산 이름", { exact: true })).toBeVisible();
  });
}
// Guide overflow, narrow presets, wide view and search are covered by example-runner, examples,
// docs-layout-controls and document-navigation; this keeps only the checks unique to this file.
test("state previews load on demand in compact frames and a failed anatomy image offers a retry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/button?platform=react");
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled({ timeout: 30000 });
  expect(await page.locator("#states iframe").count()).toBeLessThan(4);
  const card = page.locator('#states [data-guide-case="button-block"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".guide-running")).toHaveAttribute("data-ready", "true");
  expect(
    await card.locator("iframe").evaluate((f) => f.getBoundingClientRect().height),
  ).toBeLessThan(250);
  await page.route("**/guide-figures/*DsButton*.png*", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled({ timeout: 30000 });
  await page.locator("#anatomy").scrollIntoViewIfNeeded();
  await expect(page.locator("#anatomy")).toContainText("구조 이미지를 불러오지 못했습니다");
  await expect(page.locator("#anatomy").getByRole("button", { name: "이미지 다시 불러오기" })).toBeEnabled();
});

test("API anchors follow delayed anatomy only until the reader scrolls", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/guide-figures/manifest.json", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/components/select?platform=react#api");
    await expect(page.locator(".playground")).toHaveAttribute("data-ready", "true", { timeout: 30000 });
    await expect(page.locator("#api")).toBeInViewport();
    await page.mouse.wheel(0, -1600);
    await expect(page.locator("#api")).not.toBeInViewport();
    release();
    await expect(page.locator("#anatomy .anatomy-graphic img")).toHaveCount(2);
    await expect(page.locator("#api")).not.toBeInViewport();
  } finally {
    release();
  }
});
