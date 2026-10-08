import { presetConfig, type Values } from './example-registry';

// Explicit owners for implementation guidance; comparisons do not opt in by name or route.
export const implementationExamples: Record<string, { description: string; values?: Values }> = {
  GuideSettingsForm: { description: '입력값을 유지하면서 저장 시 검증하고, 오류를 해당 필드에 연결합니다. 저장 성공 안내는 피드백 Provider가 담당합니다.' },
  GuideSearchToolbar: { description: '검색어·선택한 후보·목록 필터를 구분합니다. 예제는 로컬 목록을 검색하며 loadOptions의 취소 신호를 확인합니다.' },
  GuideAssetList: { description: '조회 상태와 표시할 행을 분리합니다. 아래 코드는 기본 조회 결과와 로딩·빈 결과·실패를 재현하는 로컬 예제입니다.' },
  GuideGenericLists: { description: '행 이동과 공유 버튼은 독립된 행동으로 연결하고, 알림·선택 값은 소비자 상태에서 관리합니다.' },
  GuideAppScreen: { description: '상단·본문·하단을 형제로 배치하고 본문만 스크롤합니다. 키보드와 안전 영역은 모의 값이며 실제 앱에서는 기기 정보를 연결합니다.' },
  GuideInputSettings: { description: '시각·수량·범위를 각각 상태에 연결하고 Chip의 삭제 요청으로 목록을 갱신합니다. 수량은 확정된 숫자 값을 사용합니다.' },
  GuideBottomSheet: { description: 'Drawer의 하단 배치와 열림 상태를 연결합니다. 내부 선택값은 패널을 닫아도 유지하며 스냅·드래그 동작을 추가하지 않습니다.' },
  GuideThumbnail: { description: '목록의 leading 영역에서 이미지 바깥 폭과 비율을 정합니다. 의미를 전달하는 이미지에는 대체 텍스트를 제공합니다.' },
  GuideSegmentedSelection: { description: 'ButtonGroup의 선택 요청을 하나의 기간 값에 연결합니다. 콘텐츠 패널 전환이나 복수 선택과 구분합니다.' },
  GuideFieldErrors: { description: '권장 사례의 초기 오류 상태입니다. 재검증해도 입력값을 유지하고 FormGroup의 설명과 Input의 오류 표시를 함께 갱신합니다.', values: { email: 'team@', invalid: true } },
  GuideDeleteConfirmation: { description: '권장 사례처럼 삭제 대상과 결과를 명시하고 취소와 삭제를 분리합니다. 이 코드는 로컬 항목만 제거하며 실제 삭제 요청을 수행하지 않습니다.', values: { open: true, deleted: false } },
  GuideRefreshContext: { description: 'queryKey와 resultKey가 같은 갱신에서는 이전 결과와 선택을 유지합니다. 완료·실패 버튼은 서버 응답을 모의 적용합니다.', values: { phase: 'refreshing', selected: true } },
  GuideEmptyVsError: { description: '조회 성공 후 빈 결과에는 필터 초기화, 조회 실패에는 재시도를 연결합니다. 두 동작은 서로 독립된 로컬 시뮬레이션입니다.', values: { filterReset: false, retried: false } },
  GuideBottomCtaLayout: { description: '권장 배치의 본문은 남은 높이를 사용하고 하단 행동은 실제 공간을 차지합니다. 안전 여백은 가장 아래의 내비게이션에 한 번 적용합니다.' },
  GuideKeyboardLayout: { description: '220px 모의 키보드가 차지한 높이를 한 번 제외합니다. 실제 앱에서는 키보드 회피와 창 크기 변화를 연결하며 이 예제 자체는 OS 키보드를 감지하지 않습니다.', values: { keyboard: true } },
};
export const implementationNames = Object.keys(implementationExamples);
export function implementationConfig(name: string) {
  const example = implementationExamples[name];
  if (!example) throw Error('구현 예제가 없는 문서입니다: ' + name);
  const config = presetConfig(name);
  return { settings: { ...config.settings, arrangement: 'after' }, values: { ...config.values, ...example.values } };
}
