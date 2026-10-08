import type { GuideCase } from './visual-guides/types';
export const interactionExampleNames = ['GuideInteractionTabs', 'GuideInteractionInput', 'GuideInteractionLoading'];
// The page, copied source and packed compilation use these same definitions.
export const interactionScenarios: { name: string; destination: string; scenario: GuideCase }[] = [
  { name: 'DsButton', destination: '/components/button#states', scenario: {
    id: 'interaction-button', label: 'Button · 조작과 실행',
    description: '마우스를 올리고 누른 채 유지한 뒤 놓아 보세요. 버튼 밖에서 놓으면 실행하지 않습니다. Tab으로 들어와 Enter·Space로도 실행 횟수를 확인하세요.',
    values: { count: 0 },
  } },
  { name: 'GuideInteractionTabs', destination: '/components/tabs#states', scenario: {
    id: 'interaction-tabs', label: 'Tabs · 선택과 사용 가능 여부',
    description: '방향키로 선택하고 Tab으로 패널에 들어가세요. 첫 탭을 선택한 뒤 외부 버튼으로 비활성화하면 선택값은 유지되고 포커스도 버튼에 남습니다.',
    values: { tab: 'one', firstDisabled: false },
  } },
  { name: 'GuideInteractionInput', destination: '/components/input#states', scenario: {
    id: 'interaction-input', label: 'Input · 편집 가능·읽기 전용·비활성',
    description: '같은 값으로 시작하는 세 입력을 비교하세요. 일반 입력만 편집·지우기가 가능합니다. 프로젝트의 값 갱신은 세 입력에 모두 반영됩니다.',
    values: { normal: '장기 보유 자산', readonly: '장기 보유 자산', blocked: '장기 보유 자산', updated: false },
  } },
  { name: 'GuideInteractionLoading', destination: '/components/button#api', scenario: {
    id: 'interaction-loading', label: 'Button · 작업 진행과 비활성',
    description: '저장 후 Tab으로 ‘완료로 처리’·‘실패로 처리’에 접근해 모의 작업을 끝내세요. 웹에서는 직접 실행한 결과 안내에 포커스가 놓입니다. 저장 비활성은 독립적인 조건이며, 빠르게 완료해도 최소 로딩 표시가 끝난 뒤 다시 실행할 수 있습니다.',
    values: { phase: 'idle', count: 0, blocked: false },
  } },
];
