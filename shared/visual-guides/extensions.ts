import { part as p, textPart as t, type GuideAuthor } from "./types.ts";
export const extensions: Record<string, GuideAuthor> = {
  KjunListRow: {
    parts: [t("주 행동 영역", "제목과 설명을 누르면 프로필 설정을 엽니다.", "프로필 설정"), t("설명", "주 행동의 목적을 보충합니다.", "이름과 사진을 변경합니다.", true), t("보조 행동", "주 행동과 분리된 공유 버튼입니다. 함께 실행되지 않습니다.", "공유", true)],
    related: "generic-lists", states: [
      { id: "xs", label: "xs 원형 배경", description: "지름 24px 배경과 16px 아이콘입니다. 색상은 적용 프로젝트가 지정합니다.", settings: { leadingSize: "xs", iconBackground: true } },
      { id: "lg", label: "lg 원형 배경", description: "지름 56px 배경과 28px 아이콘입니다. 앞 영역 크기에 맞춰 구분선과 본문 시작선을 옮깁니다.", settings: { leadingSize: "lg", iconBackground: true } },
      { id: "long", label: "긴 라벨", description: "행 높이를 늘려 제목과 설명을 모두 표시합니다. 큰 앞 영역도 잘리지 않습니다.", settings: { long: true, leadingSize: "lg" } },
    ],
  },
  KjunListSection: {
    parts: [t("섹션 제목", "목록 묶음의 목적입니다.", "설정", true), t("섹션 설명", "목록에 포함된 작업을 설명합니다.", "계정과 알림을 관리합니다.", true), p("행 목록", "소비자가 ListRow와 자식 컨트롤을 배치합니다.", 'ul.kjun-list, [role="list"]')], related: "generic-lists",
  },
  KjunListGroup: {
    parts: [t("섹션 라벨", "둥근 묶음에서는 카드 밖 위에 놓는 작은 라벨입니다.", "계정", true), t("안내문", "카드 밖 아래 12px 3차색 footer입니다.", "푸시 알림은 이 기기에서만 적용됩니다.", true)], related: "generic-lists",
  },
  KjunListItem: {
    parts: [t("목록 칸", "행이 아닌 내용을 행과 같은 시작 여백으로 담습니다.", "화면 테마는 기기 설정을 따릅니다.")], related: "generic-lists",
  },
  KjunTopNavigation: {
    parts: [p("앞쪽 탐색", "24px 아이콘과 최소 44px 영역을 사용하며 앱이 뒤로 가기 행동을 연결합니다.", '[aria-label="뒤로 가기"]', true), t("화면 제목", "20px·600 굵기의 제목입니다. 양쪽 행동과 같은 줄에 두며 긴 제목은 한 줄 말줄임합니다.", "프로젝트 설정"), t("행동 영역", "제목 줄에 정렬한 ghost 저장 버튼 예시입니다. 소비자가 행동과 variant를 선택합니다.", "저장", true)], related: "app-screen",
    states: [
      { id: "safe-area", label: "안전 영역", description: "앱이 상단 안전 영역 24px을 전달합니다.", settings: { safeAreaTop: 24 } },
      { id: "long-action", label: "긴 행동", description: "긴 행동 문구는 제목 기준 폭을 남기고 한 줄 말줄임합니다.", settings: { actions: "긴 문구", exampleWidth: "320" } },
      { id: "long-leading", label: "긴 앞쪽 문구", description: "한 줄 말줄임으로 제목 공간을 확보하며 접근성 이름은 유지합니다.", settings: { leading: "긴 문구", exampleWidth: "320" } },
      { id: "mixed", label: "아이콘 조합", description: "RefreshButton·MenuButton·IconToggle이 44px 영역과 24px 아이콘을 사용합니다.", settings: { actions: "아이콘 조합" } },
    ],
  },
  KjunBottomNavigation: {
    parts: [t("현재 목적지", "앱의 value가 현재 목적지를 결정합니다. 강조색과 라벨 굵기로 구분하고, iconStyle이 auto면 채운 아이콘으로도 구분합니다.", "홈"), t("다른 목적지", "웹에서는 링크, Native에서는 앱 이동 요청입니다.", "활동"), t("보조 수치", "위험 색으로 아이콘 오른쪽 위에 표시하며 아이콘·라벨의 정렬에 영향을 주지 않습니다. 99보다 크면 99+로 줄입니다.", "3", true)], related: "app-screen",
    states: [{ id: "current", label: "목적지 변경", description: "소비자가 활동을 현재 위치로 제공합니다.", values: { destination: "activity" } }, { id: "keyboard", label: "키보드 표시", description: "기본 hideOnKeyboard=true로 탐색 영역을 숨깁니다.", settings: { keyboardVisible: true } }],
  },
  KjunFloatingNavigation: {
    parts: [p("현재 목적지", "앱의 value가 현재 목적지를 결정합니다. 글자색 면에 채운 아이콘으로 반전합니다.", '[aria-current="page"]'), p("다른 목적지", "아이콘만 보이며 label을 접근성 이름으로 읽습니다.", '[aria-label="내 정보"]'), t("보조 수치", "위험 색 배지입니다. true는 점으로 표시합니다.", "3", true)], related: "app-screen",
    states: [{ id: "current", label: "목적지 변경", description: "소비자가 알림을 현재 위치로 제공합니다.", values: { destination: "activity" } }, { id: "keyboard", label: "키보드 표시", description: "기본 hideOnKeyboard=true로 탐색 영역을 숨깁니다.", settings: { keyboardVisible: true } }],
  },
  KjunSideNavigation: {
    parts: [p("현재 목적지", "앱의 value가 현재 목적지를 결정합니다. 선택 배경색 면과 중간 굵기 글자, 본문 글자색 아이콘으로 표시합니다.", '[aria-current="page"]'), t("다른 목적지", "웹에서는 링크, Native에서는 앱 이동 요청입니다. 이름은 본문 글자색, 아이콘은 2차 글자색이며 배지는 항목 끝에 놓입니다.", "활동"), t("묶음 제목", "12px 3차 글자색으로 구역을 나눕니다.", "문서"), t("부모 항목", "여닫는 버튼이며 스스로 이동하지 않습니다. 하위 항목은 부모 글자가 시작하는 선에 놓입니다.", "프로젝트")], related: "app-screen",
    states: [{ id: "current", label: "목적지 변경", description: "소비자가 활동을 현재 위치로 제공합니다.", values: { destination: "activity" } }, { id: "child", label: "하위 목적지", description: "현재 목적지의 부모는 열린 채로 시작합니다.", values: { destination: "checkout" } }, { id: "long", label: "긴 이름", description: "한 줄에서 말줄임하고 배지는 끝에 남습니다.", settings: { long: true } }, { id: "collapsed", label: "아이콘만 표시", description: "앱이 폭을 줄이고 collapsed를 줍니다. 이름은 툴팁으로, 배지는 아이콘 모서리의 점으로 표시합니다.", settings: { collapsed: true } }, { id: "groups", label: "묶음 접기", description: "묶음 제목을 눌러 여닫습니다. 현재 페이지가 있는 묶음은 열린 채로 시작합니다.", settings: { collapsibleGroups: true } }, { id: "rail-groups", label: "묶음 레일", description: "아이콘만 표시할 때 묶음마다 아이콘 하나를 세웁니다.", settings: { collapsed: true, rail: "groups" } }, { id: "rail-labels", label: "레일 이름", description: "접힌 열에서 아이콘 아래에 이름을 보여 줍니다. 현재 목적지는 아이콘을 감싸는 면으로 표시합니다.", settings: { collapsed: true, railLabels: true } }, { id: "compact", label: "촘촘한 목록", description: "마우스 포인터에서 항목을 32px로 줄이고 숫자 배지를 옅은 숫자로 바꿉니다.", settings: { density: "compact", collapsibleGroups: true } }, { id: "flyout", label: "옆 패널", description: "접힌 상태에서 부모를 누르면 열을 넓히지 않고 아이콘 옆 패널에 하위 항목을 띄웁니다.", settings: { collapsed: true, collapsedParent: "flyout" } }, { id: "chrome", label: "머리글과 바닥글", description: "목록 위에 워크스페이스, 아래에 계정과 접기 버튼을 둡니다. 목록만 스크롤됩니다.", settings: { chrome: true } }, { id: "actions", label: "행 동작", description: "행에 마우스를 올리면 끝에 동작 버튼이 나타납니다. 닫힌 묶음은 행 수를 표시합니다.", settings: { actions: true, collapsibleGroups: true, groupCounts: true } }, { id: "spaces", label: "공간 레일과 메뉴 패널", description: "이름 있는 레일로 공간을 고르고, 옆의 촘촘한 목록이 그 공간의 페이지를 보여 줍니다.", settings: { spaces: true } }, { id: "neutral", label: "회색 개수 배지", description: "단순한 개수는 badgeTone=\"neutral\"로 회색 배지를 씁니다. 빨간 배지는 확인이 필요한 것에만 남깁니다.", settings: { neutralBadges: true } }, { id: "nested", label: "2단계 하위 항목", description: "부모 안의 부모는 하위 항목 높이에 꺾쇠를 달고, 그 아래 목적지는 16px 더 들여 32px로 놓습니다.", settings: { nested: true }, values: { destination: "tokens" } }, { id: "limit", label: "묶음 행 제한", description: "limit을 넘는 행은 \"N개 더 보기\" 행 뒤에 접혀 있습니다. 현재 페이지 행은 늘 보입니다.", settings: { limit: true } }],
  },
  KjunSideNavigationLayout: {
    parts: [p("메뉴 열", "폭 토큰(224·256·288px)으로 열리고 접히면 아이콘 열로 줄어듭니다. 웹에서는 화면 높이로 고정됩니다.", ".kjun-side-navigation-layout-nav, [data-kjun-side-navigation-layout-part=\"nav\"]"), p("페이지", "메뉴 옆의 앱 내용입니다. 배경과 구분선은 앱이 정합니다.", ".kjun-side-navigation-layout-main, [data-kjun-side-navigation-layout-part=\"main\"]")], related: "app-screen",
    states: [{ id: "collapsed", label: "접힌 열", description: "열이 68px 아이콘 열로 줄어듭니다. 메뉴에도 같은 collapsed를 넘깁니다.", settings: { collapsed: true } }, { id: "wide", label: "넓은 열", description: "width=\"lg\"는 288px 열입니다.", settings: { width: "lg" } }, { id: "drawer", label: "좁은 화면", description: "breakpoint보다 좁으면 열 대신 서랍에서 메뉴를 엽니다.", settings: { drawer: true } }],
  },
  KjunSteps: {
    parts: [t("완료한 단계", "체크가 있는 마커와 보조색 라벨입니다. 앱이 onStepSelect를 주면 버튼이 됩니다.", "약관 동의"), p("현재 단계", "번호와 6px 후광, 굵은 라벨로 표시하고 aria-current를 답니다.", '[aria-current="step"]'), t("예정 단계", "보조색 마커와 옅은 라벨입니다.", "완료", true)],
    related: "app-screen",
    states: [{ id: "error", label: "오류", description: "결제 실패처럼 막힌 현재 단계를 danger 색과 느낌표로 표시합니다.", settings: { currentStatus: "error" } }, { id: "compact", label: "축약형", description: "현재 라벨과 n / N, 마커 줄, 다음 단계 이름만 보입니다. 단계를 선택할 수 없습니다.", settings: { layout: "compact" } }, { id: "tracking", label: "배송 추적", description: "세로 배치는 12px 점과 시각·설명을 씁니다.", settings: { orientation: "vertical", current: 3 } }, { id: "complete", label: "모두 완료", description: "모든 마커가 완료이고 현재 단계 표시가 없습니다.", settings: { current: 5 } }],
  },
  KjunPressable: {
    parts: [p("누름 영역", "앱이 준 모양 그대로 통째로 누릅니다. 눌림 표시는 내용 위에 덮는 글자색 막입니다.", '[role="button"]'), t("내용", "앱이 넣은 표시용 콘텐츠입니다. 버튼이나 링크는 넣지 않습니다.", "교토 3박 4일")], related: "app-screen",
    states: [{ id: "disabled", label: "비활성", description: "누름을 막고 내용을 흐리게 표시합니다.", settings: { disabled: true } }, { id: "plain", label: "눌림 표시 없음", description: "내용이 스스로 눌림을 그릴 때 막을 끕니다.", settings: { pressEffect: "none" } }],
  },
  KjunBottomActionBar: {
    parts: [t("보조 설명", "14px·줄 높이 20px의 보조 설명입니다. 긴 설명은 줄바꿈합니다.", "저장하면 모든 기기에 적용됩니다.", true), t("주요 행동", "좁은 영역에서 확인 버튼이 남는 폭을 채웁니다. 저장 요청은 앱이 처리합니다.", "변경 사항 저장")], related: "app-screen",
    states: [{ id: "keyboard", label: "키보드 표시", description: "기본 hideOnKeyboard=false로 CTA를 유지합니다.", settings: { keyboardVisible: true } }],
  },
  KjunImage: {
    parts: [p("이미지 영역", "비율을 유지하는 컨테이너 안에서 원본을 표시합니다. 대체 텍스트는 이미지와 같은 내용을 설명합니다.", 'img, [role="img"]')], related: "thumbnail",
    figures: [{ id: "failure", label: "이미지 실패", description: "이미지 영역을 유지하고 소비자의 대체 콘텐츠를 표시합니다.", settings: { imageState: "실패" }, parts: [t("실패 대체 표현", "패키지 컨테이너 안의 소비자 콘텐츠입니다.", "이미지를 불러올 수 없습니다")] }],
    states: [{ id: "failure", label: "로드 실패", description: "잘못된 이미지 데이터를 실제로 로드하여 실패를 재현합니다.", settings: { imageState: "실패" } }, { id: "contain", label: "원본 비율 유지", description: "전체 이미지를 보여주고 남는 영역을 유지합니다.", settings: { fit: "contain", aspectRatio: 1 } }],
  },
  KjunCarousel: {
    parts: [p("슬라이드 영역", "가로로 스크롤하며 각 슬라이드의 시작 가장자리에 맞춰 멈춥니다. 슬라이드마다 몇 번째인지 읽습니다.", ".kjun-carousel-viewport, img"), p("표시 점", "현재 슬라이드를 넓은 점으로 표시하고, 누르면 그 슬라이드로 이동합니다.", '[aria-label="1번 슬라이드"]')],
    related: "app-screen",
    states: [{ id: "peek", label: "다음 카드 보이기", description: "다음 슬라이드를 24px 보여 넘길 수 있음을 알립니다.", settings: { slideSize: "peek", gap: "sm" } }, { id: "cards", label: "카드 줄", description: "섹션 제목 오른쪽에 이전·다음 버튼을 둡니다.", settings: { slideSize: "auto", indicators: "none", title: true } }, { id: "second", label: "두 번째 슬라이드", description: "앱이 index로 두 번째 슬라이드를 엽니다.", values: { slide: 1 } }],
  },
  KjunEventCalendar: {
    parts: [p("날짜 칸", "누르면 그 날을 고르는 버튼입니다. 오늘은 알약, 고른 날은 둥근 사각형이며 테두리는 없습니다.", '.kjun-event-calendar-grid button, [aria-label$="요일"]'), p("일정 표시", "날짜 아래의 점·아이콘·막대입니다. 색은 앱이 넘기고 막대는 칸을 가로질러 이어집니다.", ".kjun-event-calendar-marks, .kjun-event-calendar-span")],
    related: "app-screen",
    states: [{ id: "week", label: "한 주 보기", description: "카드 안에 한 주만 그립니다. 아무 날도 고르지 않은 채 시작하고 스와이프는 끕니다.", settings: { view: "week", swipeable: false } }, { id: "long-press", label: "길게 눌러 추가", description: "날짜를 길게 누르면(웹은 오른쪽 클릭·Shift+Enter) 앱이 약속을 추가하고 점을 표시합니다.", settings: { longPress: true } }],
  },
  KjunAvatar: {
    parts: [p("프로필 영역", "이미지가 없으면 이름의 첫 글자를 표시하며 접근성 이름은 전체 이름을 유지합니다.", '[aria-label="김하늘"]')], related: "generic-lists",
    states: [{ id: "photo", label: "사진", description: "실제 이미지 주소를 제공합니다.", settings: { imageState: "사진" } }, { id: "failure", label: "실패 대체", description: "사진 실패 시 이름의 첫 글자로 돌아갑니다.", settings: { imageState: "실패" } }],
  },
  KjunAvatarGroup: {
    parts: [p("그룹 이름", "그룹 전체를 이름 하나로 읽고 안의 아바타는 하나하나 읽지 않습니다.", '[aria-label="참여자 5명"]'), t("나머지 인원", "max를 넘는 사람 수입니다. 앞 아바타에 가리지 않는 부분 가운데에 숫자를 둡니다.", "+2")], related: "generic-lists",
    states: [{ id: "many", label: "전체 128명", description: "total로 받은 전체 인원을 \"+99\"까지 표시합니다.", settings: { people: "128명" } }, { id: "pressable", label: "목록 열기", description: "그룹 전체가 버튼 하나가 됩니다.", settings: { people: "5명", pressable: true } }],
  },
  KjunChip: {
    parts: [t("라벨", "표시하거나 삭제할 항목의 이름입니다.", "프로젝트"), p("삭제 요청", "누르면 소비자에게 삭제를 요청합니다. 패키지가 항목을 지우지는 않습니다.", '[aria-label="프로젝트 삭제"]', true)], related: "input-settings",
    states: [{ id: "without-remove", label: "삭제 없음", description: "removable=false로 삭제 버튼을 생략합니다.", settings: { removable: false } }],
  },
  KjunSlider: {
    parts: [t("라벨", "조절하는 값의 의미입니다.", "알림 음량", true), p("손잡이", "포인터·키보드·접근성 증감 행동으로 값을 바꿉니다.", 'thumb=input[type="range"], [role="slider"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 step", description: "0~1 범위를 0.1 단위로 조절합니다.", settings: { decimal: true }, values: { slider: .5 } }],
  },
  KjunRangeSlider: {
    parts: [p("시작 손잡이", "끝 값을 넘어가지 않는 구간 시작값입니다.", 'thumb=[aria-label^="시작 값"]'), p("끝 손잡이", "시작 값 아래로 내려가지 않는 구간 끝값입니다.", 'thumb=[aria-label^="끝 값"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 구간", description: "손잡이 순서를 유지하며 소수 단위로 조절합니다.", settings: { decimal: true }, values: { range: [.2, .8] } }],
  },
  KjunTimePicker: {
    values: { time: "09:30" },
    parts: [p("시 칸", "숫자를 입력하거나 ↑↓로 시를 바꾸고, 누르면 시 열에 초점을 둔 휠이 열립니다.", '[aria-label="알림 시각 시"], [aria-labelledby$="-segment-0"]'), p("분 칸", "분 간격에 맞는 분을 입력하거나, 누르면 분 열에 초점을 둔 휠이 열립니다.", '[aria-label="알림 시각 분"], [aria-labelledby$="-segment-1"]'), p("지우기", "값이 있을 때 시계 아이콘 자리에 나타나며, 값을 null로 바꾸고 첫 구간으로 초점을 옮깁니다.", '[aria-label="알림 시각 지우기"]', true)], related: "input-settings",
    states: [{ id: "seconds", label: "초 선택", description: "precision=second로 초 선택 영역을 추가합니다.", settings: { precision: "second" }, values: { time: "09:30:15" } }, { id: "bounded", label: "시각 범위", description: "09:30:15~18:30:45 사이의 시각만 선택합니다.", settings: { precision: "second", bounded: true } }, { id: "inline", label: "인라인 휠", description: "layout=inline은 필드 없이 휠을 펼쳐 두고 열이 멈출 때마다 값을 바꿉니다.", settings: { layout: "inline", minuteStep: 5 }, values: { time: "09:30" } }],
  },
  KjunZoneGauge: {
    parts: [t("이름", "무엇의 위치인지 알립니다.", "PER 백분위", true), t("값과 구간", "현재 값과 그 값이 속한 구간 이름입니다.", "72 · 고평가", true), t("구간 이름", "축 아래에서 각 구간을 이름으로 구분합니다.", "저평가", true), p("축과 표식", "구간으로 나눈 축 위에 현재 값을 표식으로 놓습니다. 하나의 이미지로 읽습니다.", '[role="img"]')],
    related: "assets",
    states: [{ id: "low", label: "저평가 구간", description: "값 18은 첫 구간에 놓입니다.", settings: { value: 18 } }, { id: "missing", label: "데이터 없음", description: "축과 구간 이름은 남고, 구간 색과 표식 없이 값 자리에 —가 보입니다.", settings: { missing: true } }],
  },
  KjunStackedBar: {
    parts: [t("이름", "무엇의 구성인지 알립니다.", "애널리스트 의견", true), t("범례", "항목마다 색 칸·이름·수치·비율을 보입니다.", "강세 12 · 60%", true), p("막대", "항목마다 비율만큼의 길이로 그립니다. 하나의 이미지로 읽습니다.", '[role="img"]')],
    related: "assets",
    states: [{ id: "empty", label: "모두 0", description: "빈 트랙과 범례를 그립니다.", settings: { data: "모두 0" } }, { id: "missing", label: "데이터 없음", description: "빈 트랙만 남고 범례는 그리지 않습니다.", settings: { data: "없음" } }],
  },
  KjunSplitPane: {
    parts: [p("경계 손잡이", "끌거나 포커스를 두고 화살표·Home·End·Enter로 첫 패널의 크기를 바꿉니다. 현재 크기를 백분율로 알립니다.", '[role="separator"], [role="slider"]'), t("첫 패널", "크기를 정하는 기준 패널입니다.", "메시지 목록", true), t("둘째 패널", "나머지 공간을 채웁니다.", "상세 내용", true)],
    related: "generic-lists",
    states: [{ id: "vertical", label: "상하 분할", description: "패널을 위아래로 두고 위아래 화살표로 조절합니다.", settings: { direction: "vertical" } }, { id: "narrow", label: "첫 패널 30%", description: "앱이 size로 첫 패널을 30%로 둡니다.", values: { split: 0.3 } }],
  },
  KjunColorPicker: {
    values: { color: "#3B82F6" },
    parts: [p("색 버튼", "현재 색 칸과 HEX 값을 보여 주고 누르면 패널을 엽니다.", '[aria-haspopup="dialog"]'), t("값", "현재 색의 HEX 값입니다. 이름 있는 견본이면 이름을 먼저 보이고, 투명도가 100% 미만이면 %를 붙이며, 색이 없으면 ‘색 선택’을 보입니다.", "#3B82F6", true)], related: "input-settings",
    states: [{ id: "all", label: "전체 옵션", description: "채도·명도 영역, 색상·투명도 슬라이더, HEX와 % 입력을 함께 엽니다.", settings: { custom: true, alpha: true, input: true }, values: { color: "#3B82F6CC" } }],
  },
  KjunFileUpload: {
    parts: [p("선택 영역", "비어 있을 때의 넓은 버튼입니다. 누르거나 파일을 끌어다 놓아 고릅니다.", ".kjun-file-upload-zone, [role=\"button\"]"), t("안내 문구", "허용 형식·파일당 크기·최대 개수입니다.", "PDF, XLSX, 이미지 · 파일당 20MB · 5개까지", true)],
    related: "input-settings",
    states: [{ id: "states", label: "여러 상태", description: "업로드 중·완료·실패·대기 행과 머리의 실패 수, 추가 행을 함께 보입니다. 실패 문구는 두 줄까지 보입니다.", settings: { sample: "여러 상태" } },
      { id: "compact", label: "한 줄 빈 필드", description: "size=\"compact\"는 빈 필드를 추가 행과 같은 56px 한 줄로 그립니다.", settings: { size: "compact" } },
      { id: "button", label: "버튼으로 고르기", description: "trigger=\"button\"은 안내 줄 끝의 보조 버튼으로만 고릅니다. 끌어다 놓기는 카드 어디서나 받습니다.", settings: { trigger: "button" } },
      { id: "grid", label: "사진 타일", description: "layout=\"grid\"는 최소 72px 정사각형 타일과 추가 타일로 사진을 보입니다.", settings: { layout: "grid", sample: "사진" } }],
  },
  KjunQuantityStepper: {
    parts: [p("감소 버튼", "확정값에서 step을 뺍니다.", '[aria-label="수량 줄이기"]'), p("숫자 입력", "입력 문자열은 Enter·blur에서 숫자로 확정합니다.", '[role="spinbutton"]'), p("증가 버튼", "확정값에 step을 더합니다.", '[aria-label="수량 늘리기"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 수량", description: "직접 입력은 소수 두 자리로 반올림하고 버튼은 0.1씩 증감합니다.", settings: { decimal: true }, values: { quantity: 1.25 } }],
  },
  KjunNumberInput: {
    settings: { format: "amount", readingAid: true }, values: { amount: "1250000" },
    parts: [p("숫자 입력", "쉼표·소수 자릿수·부호를 지키며 편집합니다. 값은 그룹 구분 문자가 없는 문자열입니다.", "input"), t("단위 suffix", "서식이 붙이는 글자입니다. amount는 앱이 \"원\"을 지정하고 percent는 \"%\"가 기본입니다.", "원"), t("읽기 문구", "readingAid를 켜면 1만 이상일 때 입력 아래에 \"1억 2,003만 5,000 원\"처럼 읽어 줍니다.", "125만 원", true)], related: "transfer-form",
    states: [{ id: "amount", label: "금액·읽기 보조", description: "쉼표와 단위, 입력 아래 읽기 문구를 함께 보입니다.", settings: { format: "amount", readingAid: true }, values: { amount: "1250000" } }, { id: "percent", label: "퍼센트", description: "보이는 그대로의 값이며 소수 한 자리를 채웁니다.", settings: { format: "percent" }, values: { amount: "12.5" } }, { id: "unit", label: "단위 suffix", description: "format은 number로 두고 suffix와 decimals만 지정합니다.", settings: { unit: true, decimals: 1 }, values: { amount: "62.5" } }, { id: "prefix", label: "$ prefix", description: "prefix로 통화 기호를 앞에 두고 decimals 2로 소수 두 자리를 씁니다.", settings: { prefix: true }, values: { amount: "1234.50" } }],
    errorMessage: "100,000명 이하로 입력해 주세요",
  },
};
