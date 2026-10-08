import { tokens } from '@kjun-ui/tokens';

const ext = tokens.extensions;
const scale = (values: Record<string, number>) => Object.entries(values).map(([name, value]) => `${name} ${value}px`).join(' · ');
export const componentSpecGroups = ['입력·선택', '표시·로딩', '레이어·피드백', '목록·하단 행동'] as const;
interface ComponentSpec {
  name: string;
  label: string;
  path: string;
  group: typeof componentSpecGroups[number];
  summary: string;
  rows: string[][];
}

// Component documents read their own specifications from the packed tokens.
export const componentSpecs: ComponentSpec[] = [
  {
    name: 'DsButton', label: 'Button', path: '/components/button', group: '입력·선택', summary: '높이와 모서리',
    rows: [['높이', scale(tokens.button.heights)], ['모서리 반경', scale(tokens.button.radii)]],
  },
  {
    name: 'DsInput', label: 'Input', path: '/components/input', group: '입력·선택', summary: '높이와 모서리',
    rows: [['높이', scale(Object.fromEntries(Object.entries(tokens.input).map(([size, spec]) => [size, spec.height])))],
      ['모서리 반경', scale(Object.fromEntries(Object.entries(tokens.input).map(([size, spec]) => [size, spec.radius])))]],
  },
  {
    name: 'DsFormGroup', label: 'FormGroup', path: '/components/form-group', group: '입력·선택', summary: '폼 항목 사이 간격',
    rows: [['폼 항목 사이', `${ext.form.itemGap}px · flex/grid 배치에서는 부모의 gap으로 확보합니다.`]],
  },
  {
    name: 'DsCheckbox', label: 'Checkbox', path: '/components/checkbox', group: '입력·선택', summary: '선택 상자 크기',
    rows: [['선택 상자 크기', scale(ext.checkbox.sizes)]],
  },
  {
    name: 'DsSwitch', label: 'Switch', path: '/components/switch', group: '입력·선택', summary: '트랙 너비와 높이',
    rows: [['트랙 너비 × 높이', Object.entries(ext.switch.widths).map(([size, width]) => `${size} ${width} × ${ext.switch.heights[size as keyof typeof ext.switch.heights]}px`).join(' · ')]],
  },
  {
    name: 'DsSelect', label: 'Select', path: '/components/select', group: '입력·선택', summary: '입력 목록 최대 높이',
    rows: [['입력 목록 최대 높이', `${ext.menu.listMaxHeight}px · 내용이 길면 목록 안에서 스크롤합니다.`]],
  },
  {
    name: 'DsBadge', label: 'Badge', path: '/components/badge', group: '표시·로딩', summary: '모서리',
    rows: [['모서리 반경', `${ext.badge.radius}px`]],
  },
  {
    name: 'DsChip', label: 'Chip', path: '/components/chip', group: '표시·로딩', summary: '여백과 삭제 영역',
    rows: [['모서리와 내부 여백', `알약 형태 · 반경 ${ext.chip.radius}px · 상하 ${ext.chip.paddingY}px · 좌우 ${ext.chip.paddingX}px`],
      ['삭제 영역', `Web 최소 ${ext.chip.removeSize}px · Native ${ext.chip.nativeRemoveSize}px`]],
  },
  {
    name: 'DsCard', label: 'Card', path: '/components/card', group: '표시·로딩', summary: '모서리와 기본 여백',
    rows: [['모서리 반경', `${scale(tokens.card.radii)} · 기본값 md`], ['기본 내부 여백', `${tokens.card.padding.md}px`]],
  },
  {
    name: 'DsSpinner', label: 'Spinner', path: '/components/spinner', group: '표시·로딩', summary: '크기',
    rows: [['지름', scale(ext.spinner.sizes)]],
  },
  {
    name: 'DsProgress', label: 'Progress', path: '/components/progress', group: '표시·로딩', summary: '진행 막대 높이',
    rows: [['진행 막대 높이', scale(ext.progress.heights)]],
  },
  {
    name: 'DsSkeleton', label: 'Skeleton', path: '/components/skeleton', group: '표시·로딩', summary: '선·아바타·블록 크기',
    rows: [['선 높이', scale(ext.skeleton.lineHeights)], ['아바타 지름', `${ext.skeleton.avatarSize}px`], ['블록 높이', `${ext.skeleton.blockHeight}px`]],
  },
  {
    name: 'DsDropdown', label: 'Dropdown', path: '/components/dropdown', group: '레이어·피드백', summary: '메뉴 최소 너비',
    rows: [['메뉴 최소 너비', `${ext.menu.minimumWidth}px`]],
  },
  {
    name: 'DsTooltip', label: 'Tooltip', path: '/components/tooltip', group: '레이어·피드백', summary: '최대 너비',
    rows: [['최대 너비', `${ext.tooltip.maxWidth}px`]],
  },
  {
    name: 'DsDrawer', label: 'Drawer', path: '/components/drawer', group: '레이어·피드백', summary: '너비·닫기·하단 패널',
    rows: [['기본 너비', `${ext.drawer.width}px`], ['닫기 시각 영역', `${ext.drawer.closeSize}px`],
      ['하단 패널', `상단 모서리 ${ext.drawer.bottomRadius}px · 본문 여백 ${ext.drawer.bodyPadding}px`]],
  },
  {
    name: 'DsModal', label: 'Modal', path: '/components/modal', group: '레이어·피드백', summary: '모서리와 내부 여백',
    rows: [['모서리 반경', `${tokens.modal.radius}px`], ['본문 여백', `${tokens.modal.padding}px`],
      ['헤더·푸터 여백', `상하 ${tokens.modal.headerPaddingY}px · 좌우 ${tokens.modal.padding}px`]],
  },
  {
    name: 'KjunFeedbackProvider', label: 'Toast', path: '/feedback', group: '레이어·피드백', summary: '너비·진행선·닫기',
    rows: [['Web 데스크톱 너비', `최소 ${ext.toast.minWidth}px · 최대 ${ext.toast.maxWidth}px`],
      ['진행선 높이', `${ext.toast.progressHeight}px`],
      ['닫기 버튼', `시각 영역 ${ext.toast.closeSize}px · Native와 좁은 Web에서는 최소 ${tokens.native.minimumTouchTarget}px 터치 영역을 확보합니다.`]],
  },
  {
    name: 'DsListRow', label: 'ListRow', path: '/components/list-row', group: '목록·하단 행동', summary: '행 내부 여백',
    rows: [['내부 여백', `${ext.list.padding}px`]],
  },
  {
    name: 'DsBottomActionBar', label: 'BottomActionBar', path: '/components/bottom-action-bar', group: '목록·하단 행동', summary: '하단 행동 여백',
    rows: [['내부 여백', `${ext.navigation.padding}px`]],
  },
];
