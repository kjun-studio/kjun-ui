import { expect, type FrameLocator, type Page } from "@playwright/test";

type Surface = FrameLocator | Page;
export async function scrollToEnd(surface: Surface) {
  await surface.getByTestId("design-scroll").evaluate(el => { el.scrollTop = el.scrollHeight; });
}
export async function checkAdditionalCase(surface: Surface, id: string, after: boolean) {
  if (id === "field-errors") {
    const input = surface.getByRole("textbox", { name: "알림 이메일", exact: true });
    await expect(input).toHaveValue("team@");
    const error = surface.getByText(after ? "@ 뒤에 도메인을 입력해 주세요. 예: team@example.com" : "입력 오류", { exact: true });
    await expect(error).toBeVisible();
    if (after) {
      const box = await input.boundingBox(), message = await error.boundingBox();
      expect(message!.y).toBeGreaterThanOrEqual(box!.y + box!.height);
    }
    await surface.getByRole("button", { name: "이메일 저장", exact: true }).click();
    await expect(input).toHaveValue("team@");
    await input.fill("team@example.com");
    await surface.getByRole("button", { name: "이메일 저장", exact: true }).click();
    await expect(error).toHaveCount(0);
    await expect(input).toHaveValue("team@example.com");
    await expect(surface.getByText("알림 이메일을 저장했습니다.", { exact: true })).toBeVisible();
  } else if (id === "delete-confirmation") {
    const dialog = surface.getByRole("dialog", { name: after ? "‘프로젝트 계획’을 삭제할까요?" : "작업 확인", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(after ? "‘프로젝트 계획’을 삭제할까요?" : "작업 확인");
    await dialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(surface.getByText("프로젝트 계획", { exact: true })).toBeVisible();
    await surface.getByRole("button", { name: "삭제 확인 열기", exact: true }).click();
    await dialog.getByRole("button", { name: after ? "문서 삭제" : "확인", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(surface.getByText("프로젝트 계획", { exact: true })).toHaveCount(0);
    await expect(surface.getByText("문서를 삭제했습니다", { exact: true })).toBeVisible();
    await surface.getByRole("button", { name: "문서 복원 후 삭제 확인", exact: true }).click();
    await expect(dialog).toBeVisible();
  } else if (id === "refresh-context") {
    const selection = surface.getByRole("checkbox", { name: /선택/ });
    const title = surface.getByText("프로젝트 계획", { exact: true });
    await expect(surface.getByText("문서 갱신 중", { exact: true })).toBeVisible();
    if (after) { await expect(title).toBeVisible(); await expect(selection).toBeChecked(); }
    else await expect(title).toHaveCount(0);
    await surface.getByRole("button", { name: "갱신 완료", exact: true }).click();
    await expect(title).toBeVisible();
    await surface.getByText("선택", { exact: true }).click(); await expect(selection).not.toBeChecked();
    await surface.getByRole("button", { name: "문서 목록 새로고침", exact: true }).click();
    if (after) { await expect(title).toBeVisible(); await expect(selection).not.toBeChecked(); }
    else await expect(title).toHaveCount(0);
    await surface.getByRole("button", { name: "갱신 실패", exact: true }).click();
    if (after) { await expect(title).toBeVisible(); await expect(selection).not.toBeChecked(); await expect(surface.getByText(/이전 조회 결과를 표시하고 있습니다/)).toBeVisible(); }
    else await expect(title).toHaveCount(0);
    await surface.getByRole("button", { name: "갱신 재시도", exact: true }).click();
    await surface.getByRole("button", { name: "갱신 완료", exact: true }).click();
    await expect(selection).not.toBeChecked();
  } else if (id === "empty-vs-error") {
    if (!after) { await expect(surface.getByText("데이터 없음", { exact: true })).toHaveCount(2); return; }
    const empty = surface.getByTestId("design-empty-result"), failed = surface.getByTestId("design-failed-result");
    await empty.getByRole("button", { name: "필터 초기화", exact: true }).click();
    await expect(empty.getByText("프로젝트 계획", { exact: true })).toBeVisible();
    await expect(failed.getByText("문서를 불러오지 못했습니다", { exact: true })).toBeVisible();
    await failed.getByRole("button", { name: "조회 재시도", exact: true }).click();
    await expect(failed.getByText("회의 기록", { exact: true })).toBeVisible();
    await expect(empty.getByText("프로젝트 계획", { exact: true })).toBeVisible();
  } else if (id === "bottom-cta-layout") {
    const scroll = surface.getByTestId("design-scroll");
    await scroll.evaluate(el => { el.scrollTop = 0; });
    await expect(surface.getByText("검토 항목 1", { exact: true })).toBeInViewport();
    await scrollToEnd(surface);
    const last = await surface.getByTestId("design-last-content").boundingBox(), footer = await surface.getByTestId("design-footer").boundingBox();
    if (after) expect(last!.y + last!.height).toBeLessThanOrEqual(footer!.y + 1);
    else expect(last!.y + last!.height).toBeGreaterThan(footer!.y + 20);
    await surface.getByRole("button", { name: "검토 내용 저장", exact: true }).click();
    await expect(surface.getByText("검토 내용을 저장했습니다.", { exact: true })).toBeVisible();
  } else if (id === "keyboard-layout") {
    const keyboard = surface.getByTestId("design-keyboard"), input = surface.getByRole("textbox", { name: "프로젝트 이름", exact: true });
    await expect(keyboard).toHaveCSS("height", "220px");
    await scrollToEnd(surface);
    const overlap = () => surface.getByTestId("design-footer").evaluate(el =>
      el.getBoundingClientRect().bottom - el.ownerDocument.querySelector('[data-testid="design-keyboard"]')!.getBoundingClientRect().top);
    if (after) await expect.poll(overlap).toBeLessThanOrEqual(1);
    else await expect.poll(overlap).toBeGreaterThan(1);
    await surface.getByRole("button", { name: "키보드 모의 영역 끄기", exact: true }).click();
    await expect(keyboard).toHaveCount(0);
    await input.fill("모의 키보드에서도 유지할 이름");
    await surface.getByRole("button", { name: "키보드 모의 영역 켜기", exact: true }).click();
    // Vue may still be applying the toggle while the unchanged input value is
    // already readable. Measure/scroll only after the viewport has shrunk.
    await expect(keyboard).toHaveCSS("height", "220px");
    await expect(input).toHaveValue("모의 키보드에서도 유지할 이름");
    if (after) {
      await expect.poll(async () => {
        await scrollToEnd(surface);
        const field = await input.boundingBox(), actions = await surface.getByTestId("design-footer").boundingBox();
        return field!.y + field!.height - actions!.y;
      }).toBeLessThanOrEqual(1);
      await surface.getByRole("button", { name: "변경 사항 저장", exact: true }).click();
      await expect(surface.getByText("변경 사항을 저장했습니다.", { exact: true })).toBeVisible();
    }
  }
}
