import { visibleControls, type ExampleControl, type Settings } from '../../../../shared/example-registry';
import type { PlatformName } from '../../../../shared/demo-config';

const appearance = new Set(['size', 'variant', 'tone', 'density', 'surface', 'padding', 'bodyPadding', 'radius', 'elevation', 'border', 'dividers', 'compact', 'striped', 'hoverable', 'block', 'fullWidth', 'fit', 'aspectRatio', 'shape', 'noPadding', 'responsive', 'mobileSummary']);
const state = new Set(['disabled', 'loading', 'error', 'readOnly', 'childDisabled', 'itemDisabled', 'empty', 'stale', 'queryState', 'imageState', 'response']);
const behavior = new Set(['multiple', 'searchable', 'clearable', 'sortable', 'selectable', 'expandable', 'stickyHeader', 'minChars', 'debounce', 'animated', 'spin', 'removable', 'decimal', 'negative', 'precision', 'minuteStep', 'secondStep', 'bounded', 'preserveContent', 'skeleton', 'keyboardVisible', 'hideOnKeyboard', 'safeAreaTop', 'safeAreaBottom', 'required', 'validate', 'closable', 'duration', 'confirmAction']);

export function runnerControlGroups(name: string, settings: Settings, platform: PlatformName) {
  const controls = visibleControls(name, settings, platform).filter(control => control.key !== 'comparison');
  const groups: { id: string; label: string; controls: ExampleControl[] }[] = [
    { id: 'appearance', label: '모양', controls: [] },
    { id: 'behavior', label: '동작', controls: [] },
    { id: 'state', label: '상태', controls: [] },
    { id: 'content', label: '콘텐츠', controls: [] },
  ];
  for (const control of controls) {
    const group = appearance.has(control.key) ? 0 : behavior.has(control.key) ? 1 : state.has(control.key) ? 2 : 3;
    groups[group].controls.push(control);
  }
  return groups.filter(group => group.controls.length);
}

const hints: Record<string, string> = {
  DsButton: '버튼을 눌러 실행 결과를 확인하거나, 예제를 바꿔 크기와 상태를 비교해 보세요.',
  DsInput: '직접 입력한 뒤 오류·읽기 전용 상태를 바꿔 보세요.',
  DsSelect: '공개 범위를 선택해 보세요. 복수 선택·긴 옵션도 비교할 수 있습니다.',
  DsCombobox: '자산 이름을 입력하고 검색된 후보를 선택해 보세요.',
  DsSearchInput: 'AAA를 검색해 보세요. 예제를 바꾸면 지연·빈 결과·요청 실패를 확인할 수 있습니다.',
  DsDatePicker: '날짜를 열어 2026년 9월 안에서 선택해 보세요.',
  DsTimePicker: '시각을 선택해 보세요. 설정에서 초 단위와 허용 범위를 바꿀 수 있습니다.',
  DsTable: '열 제목으로 정렬하고 행을 선택하거나 펼쳐 보세요.',
  DsModal: '모달을 열어 입력·저장·닫기를 확인하세요. 레이어는 이 미리보기 안에서 열립니다.',
  DsDrawer: '패널을 열어 입력해 보세요. 레이어는 이 미리보기 안에서 열립니다.',
  DsTooltip: '도움말 버튼에 포인터를 올리거나 키보드로 초점을 옮겨 보세요.',
  DsPopover: '추가 정보를 눌러 가까이 열리는 작업 영역을 확인하세요.',
  DsDataState: '조건 변경 → 조회 완료를 눌러 이전 결과가 바뀌는 흐름을 확인하세요.',
  DsErrorBoundary: '오류를 발생시켜 대체 화면을 확인한 뒤 예제를 복구해 보세요.',
  DsScrollFade: '가로로 스크롤해 화면 밖의 항목을 확인하세요.',
  DsCopyButton: '콜백 연결을 보여주는 모의 복사입니다. 실제 클립보드는 변경하지 않습니다.',
  DsExternalLink: '링크 열기 콜백을 확인하는 예제입니다. 외부 페이지로 이동하지 않습니다.',
  DsBottomNavigation: '목적지를 선택해 보세요. 안전 영역과 키보드는 설정으로 모의 적용합니다.',
  DsBottomActionBar: '긴 안내 문구와 안전 영역을 바꿔 하단 행동의 배치를 확인하세요.',
  DsTopNavigation: '긴 제목과 안전 영역을 바꿔 탐색·저장 버튼의 배치를 확인하세요.',
  KjunFeedbackProvider: '알림·확인·입력 요청을 실행하고 결과를 이벤트 기록에서 확인하세요.',
};

export function runnerHint(name: string) {
  return hints[name] || '미리보기를 조작하거나 예제 설정을 바꿔 표현과 동작을 확인하세요.';
}
