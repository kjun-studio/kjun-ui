import { test, expect, type Page } from '@playwright/test';
import { implementationNames } from '../../../shared/implementation-examples';
import { guideTopics } from '../../../shared/document-navigation';
import { exportsRoute } from './export-checks';

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: implementation code belongs only to the 15 explicit guide cases`, async ({ page }) => {
    test.setTimeout(120000);
    const found: string[] = [];
    for (const topic of guideTopics) {
      await page.goto(topic.path + '?platform=' + platform);
      const implementations = page.locator('[data-implementation]');
      for (const section of await implementations.all()) {
        found.push((await section.getAttribute('data-implementation'))!);
        await expect(section.locator('pre')).toContainText('@kjun-ui/' + platform);
        await expect(section.getByRole('button', { name: '구현 코드 복사', exact: true })).toBeEnabled();
        await expect(section.getByRole('link', { name: '공통 설정: 시작하기' })).toHaveAttribute('href', `/getting-started?platform=${platform}#connect`);
      }
      await expect(page.locator('.playground .code-block, .guide-example .code-block')).toHaveCount(0);
    }
    expect(found.sort()).toEqual([...implementationNames].sort());
  });
  for (const name of implementationNames) test(`${platform} ${name}: standalone implementation actions`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await exportsRoute(page);
      await page.goto(`/previews/export-checks/${platform}/usage-${name}-implementation.html`);
      if (name === 'GuideSettingsForm') {
        await page.getByRole('button', { name: '변경 사항 저장', exact: true }).click();
        await expect(page.getByText('목록 이름을 입력해 주세요.', { exact: true })).toBeVisible();
        await page.getByRole('textbox', { name: /^목록 이름/ }).fill('테스트 목록');
        await page.getByRole('button', { name: '변경 사항 저장', exact: true }).click();
        await expect(page.getByText('변경 사항을 저장했습니다.', { exact: true })).toBeVisible();
      } else if (name === 'GuideSearchToolbar') {
        await page.getByRole('button', { name: '상승 자산', exact: true }).click();
        await expect(page.getByText('1개 결과', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: '필터 초기화' }).click();
        await expect(page.getByText('3개 결과', { exact: true })).toBeVisible();
        await page.getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: '자산 검색', exact: true }).fill('AAA');
        await page.getByRole(platform === 'native' ? 'radio' : 'option').first().click();
        await expect(page.getByText('선택한 자산: 긴 한국어 자산 이름', { exact: true })).toBeVisible();
      } else if (name === 'GuideAssetList') {
        const trigger = page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '목록 상태', exact: true });
        await trigger.click();
        await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '빈 결과', exact: true }).click();
        await expect(page.getByText('조건에 맞는 자산이 없습니다', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: '필터 초기화' }).click();
        await expect(page.getByText('긴 한국어 자산 이름', { exact: true })).toBeVisible();
      } else if (name === 'GuideGenericLists') {
        await page.getByRole('button', { name: '공유', exact: true }).click();
        await expect(page.getByText('활동 공유', { exact: true })).toBeVisible();
        await page.getByRole('checkbox', { name: '검토할 항목 선택' }).press('Space');
        await expect(page.getByRole('checkbox', { name: '검토할 항목 선택' })).toBeChecked();
      } else if (name === 'GuideAppScreen') {
        await page.getByRole('button', { name: '키보드 상태 전환' }).click();
        await expect(page.getByRole('link', { name: '홈', exact: true })).toBeHidden();
        await page.getByRole('button', { name: '키보드 상태 전환' }).click();
        await expect(page.getByRole('link', { name: '홈', exact: true })).toBeVisible();
      } else if (name === 'GuideInputSettings') {
        await page.getByRole('button', { name: /개인.*제거|개인.*삭제/ }).click();
        await expect(page.getByText('개인', { exact: true })).toHaveCount(0);
        await page.getByRole('button', { name: '분류 초기화' }).click();
        await expect(page.getByText('개인', { exact: true })).toBeVisible();
      } else if (name === 'GuideBottomSheet') {
        await page.getByRole('button', { name: '하단 패널 열기' }).click();
        await expect(page.getByRole('dialog', { name: '알림 설정', exact: true })).toBeVisible();
        await page.getByRole('switch').press('Space');
        await page.getByRole('button', { name: '설정 완료' }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await page.getByRole('button', { name: '하단 패널 열기' }).click();
        await expect(page.getByRole('switch')).not.toBeChecked();
      } else if (name === 'GuideThumbnail') {
        await expect(page.getByRole('img', { name: '산과 하늘 표지' })).toBeVisible();
      } else if (name === 'GuideSegmentedSelection') {
        await page.getByRole('button', { name: '월', exact: true }).click();
        await expect(page.getByText('선택한 조회 단위: month', { exact: true })).toBeVisible();
      } else if (name === 'GuideFieldErrors') {
        await page.getByRole('textbox').fill('team@example.com');
        await page.getByRole('button', { name: '이메일 저장' }).click();
        await expect(page.getByText('알림 이메일을 저장했습니다.', { exact: true })).toBeVisible();
        await expect(page.getByRole('textbox')).not.toHaveAttribute('aria-invalid', 'true');
      } else if (name === 'GuideDeleteConfirmation') {
        await page.getByRole('button', { name: '취소', exact: true }).click();
        await expect(page.getByText('프로젝트 계획', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: '문서 복원 후 삭제 확인' }).click();
        await page.getByRole('button', { name: '문서 삭제', exact: true }).click();
        await expect(page.getByText('문서를 삭제했습니다', { exact: true })).toBeVisible();
      } else if (name === 'GuideRefreshContext') {
        await page.getByRole('button', { name: '갱신 실패' }).click();
        await expect(page.getByRole('checkbox')).toBeChecked();
        await page.getByRole('button', { name: '갱신 완료' }).click();
        await expect(page.getByRole('checkbox')).toBeChecked();
      } else if (name === 'GuideEmptyVsError') {
        await expect(page.getByText('연결 상태를 확인한 뒤 다시 시도해 주세요.', { exact: true })).toHaveCSS('font-size', '14px');
        await page.getByRole('button', { name: '필터 초기화' }).click();
        await page.getByRole('button', { name: '조회 재시도', exact: true }).click();
        await expect(page.getByText('프로젝트 계획', { exact: true })).toHaveCount(2);
      } else if (name === 'GuideBottomCtaLayout') {
        await page.getByRole('button', { name: '변경 사항 저장' }).click();
        await expect(page.getByText('변경 사항 저장', { exact: true }).last()).toBeVisible();
      } else if (name === 'GuideKeyboardLayout') {
        await expect(page.getByText('키보드 예시 영역 · 220px', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: '키보드 상태 전환' }).click();
        await expect(page.getByText('키보드 예시 영역 · 220px', { exact: true })).toHaveCount(0);
      }
      expect(errors, name).toEqual([]);
  });
}
