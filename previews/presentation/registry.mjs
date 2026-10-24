// Capture profiles change image magnification, never package geometry.
export const captureProfiles = {
  small: { width: 320, height: 200, deviceScaleFactor: 4, padding: 24 },
  control: { width: 512, height: 320, deviceScaleFactor: 2.5, padding: 24 },
  large: { width: 640, height: 400, deviceScaleFactor: 2, padding: 32 },
  desktop: { width: 800, height: 500, deviceScaleFactor: 1.6, padding: 32 },
};
export const capture = captureProfiles.large; // Overview scenes retain their original capture.
export const captureFor = scene => captureProfiles[scene.captureType];
// Explicit public-component coverage. Widths belong to the consuming canvas.
const groups = [
  ['control', 456, ['KjunTabPane']],
  ['control', 464, ['KjunTopNavigation', 'KjunBottomNavigation', 'KjunPagination', 'KjunTabs']],
  ['desktop', 736, ['KjunKpiRow', 'KjunMarketTable', 'KjunMarketTableSkeleton']],
  ['small', null, ['KjunButton', 'KjunIcon', 'KjunButtonGroup', 'KjunFilterGroup', 'KjunIconToggle', 'KjunFab', 'KjunCopyButton', 'KjunRefreshButton', 'KjunExternalLink', 'KjunBadge', 'KjunChip', 'KjunBreadcrumb', 'KjunAvatar', 'KjunAnimatedNumber', 'KjunPriceCell', 'KjunSignedValue', 'KjunDeviation', 'KjunCollectionMark', 'KjunExecutionStatusBadge', 'KjunSpinner', 'KjunTooltip', 'KjunText', 'KjunStack', 'KjunInline']],
  ['control', 360, ['KjunRadio', 'KjunInput', 'KjunFormGroup', 'KjunFormActions', 'KjunTextarea', 'KjunCheckbox', 'KjunSwitch', 'KjunRadioGroup', 'KjunSelect', 'KjunCombobox', 'KjunSearchInput', 'KjunDatePicker', 'KjunTimePicker', 'KjunQuantityStepper', 'KjunSlider', 'KjunRangeSlider', 'KjunScrollFade', 'KjunImage', 'KjunProgressCell', 'KjunSparkline', 'KjunSkeleton', 'KjunFormSkeleton', 'KjunProgress', 'KjunFreshness']],
  ['large', 480, ['KjunCard', 'KjunAccordion', 'KjunAccordionItem', 'KjunListRow', 'KjunListSection', 'KjunListItem', 'KjunBottomActionBar', 'KjunHeatmapCell', 'KjunListSkeleton', 'KjunChartSkeleton', 'KjunAlert', 'KjunEmpty', 'KjunDataState', 'KjunErrorBoundary']],
  ['large', 576, ['KjunTable', 'KjunMarketSimpleList', 'KjunMarketCards', 'KjunMarketListPanel', 'KjunKpiHero', 'KjunModal', 'KjunDrawer']],
  ['control', 240, ['KjunDropdown', 'KjunDropdownItem', 'KjunDropdownDivider', 'KjunMenuButton', 'KjunPopover']],
];
export const presentations = groups.flatMap(([captureType, width, names]) => names.map(name => ({ name, width, captureType,
  prepare: ['KjunDropdown', 'KjunDropdownItem', 'KjunDropdownDivider', 'KjunMenuButton'].includes(name) ? 'menu' : name === 'KjunTooltip' ? 'tooltip' : null,
  layer: ['KjunModal', 'KjunDrawer'].includes(name),
  highlight: name === 'KjunDropdownDivider' ? '[role="separator"]' : name === 'KjunTabPane' ? '[role="tabpanel"]' : null,
})));
export const overviewScenes = [
  { id: 'lists', name: 'OverviewLists', title: '목록', description: '사람과 활동, 알림 설정을 한 목록에 연결합니다.', destination: '/usage-guide/data#generic-lists', alt: '아바타, 활동 목록, 상태 배지와 알림 스위치를 조합한 화면', width: 480 },
  { id: 'form', name: 'OverviewForm', title: '폼', description: '라벨부터 입력과 선택, 저장 행동까지 구성합니다.', destination: '/usage-guide/forms#form', alt: '목록 이름 입력과 공개 범위 선택, 저장 버튼을 조합한 설정 폼', width: 400 },
  { id: 'data', name: 'OverviewData', title: '데이터', description: '자산 이름과 가격, 등락률의 위계를 정리합니다.', destination: '/usage-guide/data#assets', alt: '세 자산의 이름과 현재가, 등락률을 정렬한 데이터 표', width: 576 },
].map(scene => ({ ...scene, captureType: 'large' }));
