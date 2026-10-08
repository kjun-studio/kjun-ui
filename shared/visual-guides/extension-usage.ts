export const extensionLayouts = [
  { id: "generic-lists", name: "GuideGenericLists", title: "설정·활동·선택 목록", description: "ListSection과 ListRow로 범용 목록을 만듭니다. 행 이동과 공유 버튼을 분리하고 Switch·Checkbox의 선택은 소비자가 관리합니다." },
  { id: "app-screen", name: "GuideAppScreen", title: "모바일 화면 구성", description: "본문만 스크롤하고 상하단 영역이 실제 공간을 차지합니다. 앱이 안전 영역·키보드 상태를 전달하며 가장 아래에 표시되는 영역에만 하단 여백을 적용합니다. Native 기기의 키보드와 창 크기 보정은 앱에서 연결하세요." },
  { id: "input-settings", name: "GuideInputSettings", title: "시간·수량·범위와 삭제 분류", description: "시·분·초, 소수 수량, 범위 값을 소비자 상태에 연결합니다. Chip의 삭제 요청에 따라 앱이 항목을 제거합니다. 수량은 확정된 값과 편집 중인 문자열을 구분합니다." },
  { id: "bottom-sheet", name: "GuideBottomSheet", title: "하단 Drawer · BottomSheet 레시피", description: "Drawer position=bottom으로 하단 패널을 엽니다. 스냅·드래그·끌어 닫기는 제공하지 않습니다. 내부 입력과 키보드의 가림 방지는 소비 화면의 별도 검증이 필요합니다." },
  { id: "thumbnail", name: "GuideThumbnail", title: "Thumbnail · 목록 이미지 레시피", description: "Image에 비율과 소비자 바깥 너비를 지정해 썸네일을 구성합니다. 정보를 전달하는 이미지는 대체 텍스트를 제공하고 실패해도 주변 설명을 유지합니다." },
  { id: "segmented-selection", name: "GuideSegmentedSelection", title: "SegmentedControl · 분할 선택 레시피", description: "ButtonGroup은 하나의 기준값을 선택합니다. FilterGroup의 필터 선택, Tabs의 패널 전환과 구분하고 역할이 같은 공개 API를 재사용합니다." },
];
