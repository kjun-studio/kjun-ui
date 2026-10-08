import type { GuideCase } from './visual-guides/types';
export const accessibilityExampleNames = ['GuideAccessibleForm'];
// Used by the document, source generator and packed compilation checks.
export const accessibilityScenarios: { name: string; destination: string; scenario: GuideCase }[] = [
  { name: 'DsTabs', destination: '/components/tabs#accessibility', scenario: {
    id: 'accessibility-tabs', label: 'Tabs · 키보드로 선택',
    description: 'Tab으로 들어온 뒤 좌우 방향키·Home·End를 누르세요. 비활성 탭을 건너뛰며, 다음 Tab은 선택한 패널로 이동합니다.',
    values: { tab: 'one' },
  } },
  { name: 'DsModal', destination: '/components/modal#accessibility', scenario: {
    id: 'accessibility-modal', label: 'Modal · 포커스 이동과 복귀',
    description: '모달 열기를 키보드로 실행하세요. Tab·Shift+Tab으로 내부를 순환하고 Escape로 닫으면 트리거로 돌아옵니다. 오버레이는 이 미리보기 영역 안에서 열립니다.',
    values: { open: false }, viewportHeight: 440,
  } },
  { name: 'GuideAccessibleForm', destination: '/components/form-group#accessibility', scenario: {
    id: 'accessibility-form', label: '입력 · 이름과 오류 연결',
    description: '두 입력의 라벨·도움말을 확인하고 오류 표시를 전환하세요. 검색 아이콘의 이름은 목록 검색입니다. 오류 전환은 설명용 상태이며 실제 제출 검증이 아닙니다.',
    values: { listName: '', owner: '', invalid: false, result: '아직 검색하지 않았습니다.' },
  } },
];
