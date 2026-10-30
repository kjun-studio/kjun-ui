# 변경 내역

KJUN UI 패키지(`@kjun-ui/icons`·`tokens`·`vue3`·`react`·`native`)는 같은 버전으로 함께 배포합니다. `@kjun-ui/vue2`는 0.5.x까지 함께 배포했습니다.

## 0.17.0 — 2026-10-26

- **React 조합·접근성 개선**: Tabs의 `actions`에 Select·Dropdown을 넣을 때 탭 목록과 충돌하던 오류를 고치고, Popover의 접근성 상태를 실제 트리거 버튼에 연결했습니다. Checkbox에 `indeterminate`, Slider·RangeSlider에 화면 출력과 `aria-valuetext`를 함께 지정하는 `formatValue`를 추가했습니다. 선택값과 변경 콜백의 기존 자료형은 유지합니다.
- **수정: React Tooltip 종료 잔상**: 툴팁을 반복해서 열거나 다른 툴팁으로 전환한 뒤 로딩·비활성화·문구 제거 시 빈 말풍선이 화면 왼쪽 위에 남던 문제를 고쳤습니다. 즉시 닫힘은 패널의 종료 상태까지 정리하고, 일반 닫힘 애니메이션과 트리거 포커스는 유지합니다.
- **Vue 적용 편의 개선**: Tabs·KpiRow 배지의 `null`, DropdownItem 실제 이벤트 전달, Dropdown·MenuButton `v-model:open`, Table 행 제네릭, KpiRow의 로딩·값 없음, Progress의 `null`·`indeterminate`를 지원합니다. Fragment 컴포넌트 속성 전달, Tabs `stickyHeader`·`stickyOffset`, Slider·RangeSlider `showValue`·`formatValue`를 추가했습니다. 기존 0 기본값과 비제어 메뉴 사용법은 유지합니다. 자세한 경계와 예시는 [Vue 적용 계약](docs/vue3-adoption.md)을 참고하세요.
- **세 플랫폼 옵션 맞춤**: 한 플랫폼에만 있던 옵션을 나머지 플랫폼에도 같은 이름·동작으로 추가했습니다. Vue·Native `KjunCheckbox` `indeterminate`(빼기 표시와 mixed 상태, 누르면 전체 선택 요청), React·Native `KjunProgress` `value={null}`(데이터 없음, 0%로 바꾸지 않음)·`indeterminate`(진행률을 모르는 진행 중, 막대 이동·원 회전, 동작 줄이기에서는 멈춤), React·Native `KjunKpiRow` 항목의 값 없음(`null`·`undefined`·NaN은 `missingText`, 기본 —. 실제 0은 숫자. `badge: null`은 숨김), React `KjunTabs` `stickyHeader`·`stickyOffset`입니다. 탭 머리 고정은 웹 전용입니다. Native에는 sticky 위치 지정이 없어, 앱의 `ScrollView` `stickyHeaderIndices`로 고정하세요.
- **`KjunAlert` 외형 변경(Soft fill)**: 1px 톤 테두리를 없애고 톤 배경만 남겼습니다. 아이콘은 채운 모양(md 18·sm 16, warning 삼각형은 광학 보정)으로 바꿨고(`@kjun-ui/icons` 기본 세트에 `info-circle`·`circle-check`·`alert-triangle`·`alert-circle` 채운 모양 추가), 색은 아이콘에만 씁니다. 제목·본문은 `text` 색입니다. info는 `text`를 6% 깐 반투명 면이라 회색 바탕에서도 경계가 보입니다. 보조 액션 버튼과 닫기 버튼은 흰 면·회색 대신 같은 반투명 `text` 색으로 알림 배경에 섞입니다(새 상태 투명도 토큰 `states.opacity.tintFill`·`tintControl`·`tintHover`·`tintActive`·`muted`). 닫으면 높이를 접으며 사라진 뒤 `onClose`(Vue `close`)를 알립니다. 동작 줄이기 설정에서는 즉시 닫힙니다. Native 기기에서는 페이드 후 레이아웃 애니메이션으로 접힙니다(기기 미확인). 여백은 md 16/16·sm 12/14, 모서리는 md 16·sm 12로 넓혀 높이가 늘어납니다(md 한 줄 42→52px). 한국어는 웹·Native Web은 단어 단위, iOS는 `hangul-word`로 줄바꿈합니다. API는 그대로입니다.
- **`KjunListRow` 앞쪽 열·구분선 정리**: 앞쪽 아이콘을 위한 `icon`(아이콘 이름) prop을 추가했습니다. 20px 보조색으로 그리며, `leading`(Vue `leading` 슬롯)이 있으면 `leading`이 우선합니다. 앞쪽 요소는 최소 40px 열 가운데에 놓여 아이콘·아바타 행의 제목 시작선이 맞습니다. 구분선은 행 전체 폭 대신 텍스트 시작선부터 그립니다(앞쪽 열이 있으면 68px, 없으면 16px. `KjunListItem`도 16px). 행 제목은 600 굵기(`control`)로 바꿨습니다. `KjunListSection`은 설명 없이 제목만 있으면 제목을 12px 보조색 그룹 라벨로 표시하고 첫 행과의 간격을 줄입니다. 새 토큰 `extensions.list.leadingWidth`·`iconSize`·`bareHeadingPaddingBottom`.
- **헤더·하단 영역 바탕 끄기**: `KjunTopNavigation`·`KjunBottomNavigation`·`KjunBottomActionBar`에 `surface`(기본 true)를 추가했습니다. `false`면 표면색 바탕 없이 화면 바탕이 그대로 보여, 헤더가 별도의 띠처럼 보이지 않습니다. 0.14.0 `KjunListSection` `surface`와 같은 방식입니다. 내용이 뒤로 스크롤되는 고정 영역에는 바탕을 두세요.
- **Slider 값 표시 옵션 세 플랫폼 통일**: React·Native `KjunSlider`·`KjunRangeSlider`에 `showValue`(기본 true)를 추가하고, Native에 `formatValue`를 추가했습니다. Vue와 같이 `showValue={false}`는 화면의 숫자만 숨기고 손잡이의 접근성 값(웹 `aria-valuetext`, Native `accessibilityValue.text`)은 유지합니다. `label`도 없으면 제목 줄을 만들지 않습니다.
- **수정: Native 바텀 시트 열림 깜빡임·Android 키보드**: `KjunDrawer`가 패널 높이를 재는 동안 배경만 먼저 어두워져 빈 회색 화면이 보이던 문제를 고쳤습니다. 이제 배경과 패널이 함께 나타납니다. Android가 새 Modal 창의 루트를 처음 몇 프레임 동안 내비게이션 바만큼 짧게 잡아 아래쪽에 밝은 띠가 번쩍이던 문제도 고쳤습니다. `KjunDrawer`·`KjunModal`의 배경이 화면 높이(`Dimensions.get("screen")`)까지 덮습니다. Drawer의 키보드 회피(`avoidKeyboard`)가 Android에서도 동작합니다. 화면 끝까지 그리는(edge-to-edge) Android 창은 키보드가 떠도 줄어들지 않아 시트가 가려졌습니다. 이제 `keyboardDidShow`·`keyboardDidHide`를 듣고, 겹치는 높이를 Modal 루트 기준으로 계산합니다. 창이 실제로 줄어드는 앱에서는 두 번 올라가지 않습니다. RN Web에서 확인했고 Android 기기에서는 아직 확인하지 않았습니다.
- **수정: Native `KjunButtonGroup`·`KjunFilterGroup` 라벨 줄바꿈**: 굵기별 글꼴(Android·Expo)을 쓰면 선택하지 않은 라벨이 칸보다 넓게 그려져 두 줄로 내려가고 아랫줄이 잘리던 문제를 고쳤습니다. 칸은 선택·비선택 두 굵기 중 넓은 쪽 너비를 잡고, 보이는 라벨은 한 줄로 유지합니다. RN Web에서 확인했고 기기에서는 아직 확인하지 않았습니다.

## 0.16.0 — 2026-10-25

적용 프로젝트가 직접 만들던 부분을 KJUN에 넣은 기능 릴리스입니다. 새 옵션을 쓰지 않으면 기존 화면과 동작은 그대로입니다.

- **모서리 `xl`(24)**: 카드 모서리 단계에 `xl`을 추가했습니다(none 0·sm 8·md 12·lg 16·xl 24).
- **`KjunListSection` `radius`**: 카드와 같은 단계로 섹션을 둥글게 하고 안의 행 배경·구분선을 잘라 냅니다. 앱에서 직접 만들던 둥근 감싸개를 대신합니다. 둥글 때만 행의 초점 링을 안쪽에 그립니다.
- **필터 칩 선택 색 역할**: `filterSelectedBg`·`filterSelectedText`(선택). 지정하지 않으면 이전처럼 `text`·`inverse`입니다.
- **`KjunTooltip`** `title`(본문 위 굵은 제목), `align`(start·center), `width`(sm·md·lg 최대 폭 단계, 토큰 `tooltip.maxWidths`). 제목과 본문이 모두 없으면 `open`을 줘도 웹에서 열리지 않습니다(Native와 같음).
- **`KjunPopover` `anchorRect`**(웹): 트리거 대신 화면 좌표에 붙고, 함수로 넘기면 커서처럼 움직이는 위치를 따라갑니다. 이때 트리거는 선택입니다.

## 0.15.0 — 2026-10-25

적용 프로젝트 요청을 반영한 기능 릴리스입니다. 새 옵션을 쓰지 않으면 기존 화면과 동작은 그대로입니다.

- **`KjunDrawer`·`KjunModal` `onAfterClose`**(Vue `@after-close`): 닫힘 애니메이션이 끝나 화면에서 사라진 뒤 한 번 알립니다. 다음 시트를 타이머로 추정하지 않아도 됩니다. Native iOS는 시스템 창이 닫힐 때까지 기다립니다(기기 미확인).
- **`KjunListRow`**
  - `ariaLabel`: 누르는 행·링크 행의 이름입니다. 금액처럼 함께 읽어야 할 값을 넣습니다.
  - `children`(Vue 기본 슬롯): 제목·설명 아래 표시용 칸입니다(예산·진행 막대). 누르는 행 안에는 버튼·링크를 넣지 않습니다.
- **Native `KjunText`**: React Native Text 속성(`accessibilityLabel`, `testID`, `selectable`, `allowFontScaling`, `adjustsFontSizeToFit` 등)을 그대로 넘깁니다. `style`·`numberOfLines`는 지금처럼 별도입니다.
- **`returnFocus`**(웹): `KjunSelect`·`KjunCombobox`·`KjunDropdown`·`KjunMenuButton`이 닫힌 뒤 트리거 대신 지정한 요소로 초점을 옮깁니다(Popover와 같은 방식). Combobox는 옵션 선택·Escape일 때만 옮깁니다.
- **`KjunAccordionItem`**
  - `open`·`onOpenChange`(Vue `v-model:open`): 코드에서 열고 닫습니다. 제어 항목은 하나만 펼침 규칙에 참여하지 않습니다. 제어하지 않는 항목도 상태가 바뀌면 `onOpenChange`로 알립니다.
  - `keepMounted`: 처음 연 뒤로는 접혀도 본문을 지우지 않아 안의 입력값이 남습니다.

## 0.14.0 — 2026-10-24

적용 프로젝트가 화면을 KJUN으로 옮기며 직접 만들거나 덮어쓰던 부분을 KJUN에 넣은 기능 릴리스입니다. 새 옵션을 쓰지 않으면 기존 화면과 동작은 그대로입니다.

- **컴포넌트 밖에서 확인창·토스트**: `createKjunFeedback()`로 만든 컨트롤러를 `KjunFeedbackProvider`의 `controller`로 넘기면, API 처리·스토어 같은 일반 함수에서 `feedback.confirm()`·`feedback.toast.success()`를 부를 수 있습니다. Provider는 받은 컨트롤러를 정리하지 않고, Provider가 없는 동안 부른 요청은 다음 Provider가 보여 줍니다.
- **누르는 카드**: `KjunCard`에 `pressable`·`disabled`·`ariaLabel`(Native는 `onPress`도)을 추가했습니다. `pressable`일 때만 카드 전체가 버튼이 되고 키보드·hover·누름·포커스 링을 갖습니다. 안에 버튼·링크를 넣으면 웹 개발 모드에서 경고합니다.
- **`KjunText` tone**: `brand`·`danger`·`success`·`warning`·`inverse`(브랜드 바탕 위 글자, `onBrand` 역할)를 추가했습니다.
- **목록**
  - `KjunListRow` `destructive`(제목을 danger 색으로), `chevron`(끝에 장식 화살표).
  - `KjunListSection` `surface={false}`: 표면색 바탕 없이 그립니다.
  - 새 컴포넌트 `KjunListItem`: ListSection 안에서 행이 아닌 내용(테마 전환 버튼, 안내 문구)을 행과 같은 여백·구분선으로 담습니다.
- **`KjunAvatar` `color`·`textColor`**: 이니셜·대체 아이콘의 바탕색과 글자색을 앱 색으로 정합니다. 웹은 CSS 색 문자열, Native는 `ColorValue`입니다.
- **원형 진행률**: `KjunProgress shape="circle"`. 지름·선 굵기는 새 토큰 `progress.circle`(sm 24·md 48·lg 64)이고, `showLabel` 퍼센트는 md 이상에서 원 가운데에, `label`·`subLabel`은 원 아래에 둡니다.
- **수정**
  - Native `KjunButton`·`KjunBadge`가 `KjunStack align="center"` 안에서도 왼쪽에 붙던 문제를 고쳤습니다. Stack·Inline에 `align`을 명시했을 때만 그 정렬을 따르고, 기본값에서는 이전과 같습니다.
  - Native `KjunProgress`가 React Native Web에서 `aria-valuenow`를 내보내지 않던 문제를 고쳤습니다.

## 0.13.0 — 2026-10-24

다국어와 적용 프로젝트 의견을 반영한 기능 릴리스입니다. 기존 API와 기본 동작은 그대로입니다(`locale`을 넘기지 않으면 이전과 같은 한국어).

- **다국어**: `KjunProvider`에 `locale`·`messages`를 추가했습니다(세 플랫폼). KJUN이 그리는 문구와 화면 낭독 이름, 상대 시간·달력·날짜 값 형식이 앱 언어를 따릅니다. 한국어(기본)와 영어 문구 묶음 `kjunMessagesKo`·`kjunMessagesEn`과 타입 `KjunMessages`를 export합니다. 그 밖의 언어는 앱이 `messages`로 넘기고, 넘기지 않은 문구는 영어로 나옵니다. 자세한 내용은 문서 "색상·서체 연결 → 다국어"를 보세요.
  - 문구 props(`cancelText`, `emptyText`, `placeholder` 등)의 기본값은 이제 Provider 문구에서 옵니다. props를 넘기면 그대로 우선합니다.
- **`switchThumbOn` 색 역할**(선택): 켜진 스위치 손잡이 색입니다. 지정하지 않으면 지금처럼 `onBrand`입니다. 파스텔 포인트 색처럼 `onBrand`를 어둡게 잡는 앱에서 손잡이를 흰색으로 둘 수 있습니다.
- **새 옵션**
  - `KjunDatePicker` `clearable`: 값이 있을 때 지우기 버튼을 보입니다(빈 문자열로 바꿈).
  - `KjunSwitch` `description`: 라벨 아래 설명 문구입니다. 화면 낭독기에도 전달합니다.
  - `KjunFormGroup` `optional`: 라벨 뒤에 "(선택)"/"(optional)"을 붙입니다.
  - `KjunButton` `shape="circle"`: 아이콘만 있는 원형 버튼입니다.
  - `KjunButton` `variant="link"`: 여백 없이 글자에 맞는 링크 모양 버튼입니다. Native는 터치 영역을 44로 넓힙니다.
  - `KjunListSection` `divider={false}`, `density="compact"`: 구분선 없는 목록과 높이 44의 촘촘한 행입니다.
- **새 컴포넌트 `KjunFab`**: 오른쪽 아래에 떠 있는 56 원형 주요 행동 버튼입니다. `safeAreaBottom`·`offsetBottom`으로 하단 영역을 피합니다. Native는 부모 기준으로 놓이므로 화면 최상위 View에 둡니다.
- **Native 굵기별 글꼴**: `KjunProvider`의 `fontFamily`·`numericFontFamily`가 굵기별 이름(`{ 400: "Pretendard-Regular", 700: "Pretendard-Bold" }`)도 받습니다. Android·Expo에서 KJUN 글자가 한 굵기로만 나오던 문제를 해결합니다. 문자열은 이전과 같습니다. 기기에서는 아직 확인하지 않았습니다.
- **수정**
  - Native `KjunBadge`가 가로 줄의 세로 가운데 정렬을 무시하고 위쪽에 붙던 문제를 고쳤습니다.
  - `KjunButtonGroup` 선택 칸에 `border` 색 테두리를 더해, 밝은 색상에서도 선택 칸이 바탕과 구분됩니다.

## 0.12.2 — 2026-10-23

- **Native TimePicker 시·분 칸**: 기기에서 시·분 숫자가 "·", "···"처럼 잘려 보이던 문제를 고쳤습니다. 칸 너비는 숨겨 둔 "00" 글자가 정하는데, 그 글자를 감싼 영역의 `flex: 1`이 앱 배치 엔진(Yoga)에서 기본 너비 0으로 계산돼 칸이 최소 너비(44px)에 머물렀습니다. 시간 칸에서는 이제 내용 너비에서 시작합니다. React Native Web에서는 재현되지 않습니다.

## 0.12.1 — 2026-10-23

- **Native 앱 멈춤 수정**: React Native(0.86 이상)는 앱 화면 요소를 전역 `HTMLElement`로 정의하지만, 이 요소에는 웹의 `matches`·`closest`·`querySelector`가 없습니다. KJUN의 레이어 포커스 코드가 이 요소를 웹 요소로 판단해 해당 함수를 부르면서, 기기에서 `KjunSelect`(이를 쓰는 시간 선택기 포함)가 다시 그려질 때, `KjunCombobox`를 누를 때, Popover·Tooltip·Dropdown을 열고 닫을 때 "is not a function" 오류로 멈출 수 있었습니다. 이제 함수가 실제로 있을 때만 부릅니다. 0.3.0부터 있던 문제이며, React Native Web에서는 재현되지 않습니다.

## 0.12.0 — 2026-10-20

화면의 글자와 간격을 이름으로 고르는 컴포넌트 세 개를 추가했습니다. 기존 컴포넌트는 바뀌지 않습니다.

- **`KjunText`**: `variant`(pageTitle·sectionTitle·cardTitle·body·label·meta·caption·숫자 역할)로 글자 크기·줄 높이·굵기를, `tone`(default·secondary·tertiary·disabled)으로 글자색 역할을 고릅니다. `maxLines`로 말줄임, `align`으로 정렬, 웹에서는 `as`로 제목 수준을 정합니다.
- **`KjunStack`**(세로)·**`KjunInline`**(가로): `gap`을 토큰 단계(`space.stack`·`space.section`·`space.inline`)로 고릅니다. Inline은 기본으로 줄바꿈합니다. 바로 안의 `KjunFormGroup`은 자체 아래 여백 없이 `gap`만 따릅니다.
- 숫자 역할(`numberSm`·`numberMd`·`numberLg`)은 자릿수 사이에서 줄바꿈하지 않고, 세 플랫폼 모두 고정폭 숫자를 씁니다. 웹 `KjunText` 안의 링크·강조는 브라우저 기본 모양을 유지하고, 앱의 `.prose p` 같은 규칙이 여백·색을 바꾸지 않습니다.
- 기본 `tone`은 웹에서 감싼 영역의 글자색을, Native에서 `text` 색을 씁니다. Native Stack·Inline은 Fragment 안의 문자열도 Text로 감쌉니다.
- 세 컴포넌트 모두 임의의 크기·색·간격 값을 받지 않습니다. 앱 CSS에는 페이지 폭·그리드 같은 큰 배치만 남기세요(문서 "색상·서체 연결").

## 0.11.0 — 2026-10-19

적용 프로젝트 의견 네 건을 반영했습니다. 바꿀 코드는 없지만 **위·아래 Drawer는 기본 높이 상한이 생겼습니다.**

- **Drawer**(세 플랫폼): `safeAreaTop`·`safeAreaBottom`(px)으로 안전 영역을 받습니다. 위·좌우 Drawer는 위 여백, 아래·좌우 Drawer는 footer 아래 여백으로 쓰고, 위·아래 Drawer는 반대쪽 안전 영역을 비워 둡니다. `maxHeight`(px)로 위·아래 Drawer의 높이 상한을 정합니다.
  - **동작 변경**: 위·아래 Drawer는 기본으로 화면 높이에서 반대쪽 안전 영역과 48px(`extensions.drawer.sheetGap`)을 뺀 높이까지만 커집니다. 넘치면 본문만 스크롤하고 머리글·footer는 고정합니다. 전에는 화면 전체 높이까지 커졌습니다.
  - Native `avoidKeyboard`(기본 true): 화면 키보드가 나오면 아래 Drawer는 키보드 위로 올라가고, 다른 위치는 높이를 줄여 본문이 스크롤됩니다. iOS는 키보드 위치로 계산하고, Android는 React Native Modal 창이 키보드만큼 줄어드는 것(adjustResize)에 맞춰 크기를 잽니다. 기기에서는 아직 확인하지 않았습니다.
- **Native 빈 글자**: 빈 문자열(`label=""`, `icon=""`, `desc=""` 등), Input의 문자열 `prefix`·`suffix`, 문자열·빈 값·0을 넘긴 slot(`header`·`footer`·`actions`·`leading`·`trailing`·`aside`·`children`)이 View에 그대로 놓여 기기에서 "Text strings must be rendered within a <Text>" 오류가 나던 문제를 고쳤습니다. 문자열은 KJUN 글자 스타일의 Text로 그리고, 빈 값은 그리지 않습니다.
- **KpiRow**: 좁은 화면 요약 행에서 한국어 라벨·값이 음절 중간이 아니라 띄어쓰기에서 줄바꿈합니다.
- **Native KjunFeedbackProvider**: 앱 화면을 감싸는 View가 부모 크기를 그대로 이어받아 `flex: 1` 화면이 높이를 잃지 않습니다. `style`로 덮어쓸 수 있습니다.

## 0.10.0 — 2026-10-19

Popover에 고정 머리글과 비모달 모드를 추가하고, 두 번째 적용 프로젝트(Tyve)의 보고를 반영했습니다. 바꿀 코드는 없지만 **FormGroup은 오류가 있어도 도움말을 함께 표시합니다.**

- **`header`**(React·Native prop, Vue `header` 슬롯): 본문 위에 고정되는 머리글입니다. 본문 한 곳만 스크롤하고, `maxHeight`는 머리글을 포함한 전체 높이입니다. 웹에서는 `ariaLabel`이 없으면 머리글이 대화상자 이름이 됩니다(Native는 `ariaLabel`을 지정하세요). `noPadding`은 본문 여백만 없앱니다.
- **`modal={false}`**: 페이지를 막지 않습니다. 열릴 때 초점을 가져가지 않으며(`focusOnOpen`이면 가져감), 첫 항목에서 Shift+Tab은 트리거로, 마지막 항목에서 Tab은 Popover를 닫고 트리거 다음 요소로 갑니다. 바깥을 누르거나 초점이 밖으로 나가면 닫히며 초점을 되돌리지 않고, Escape는 트리거로 돌아갑니다. 안에서 연 메뉴는 Popover를 닫지 않습니다.
  - React에서 초점을 받을 수 없는 빈 영역을 누르면 초점이 트리거로 돌아갑니다(react-aria 동작).
  - Native는 화면 판독기를 패널에 가두지 않는 데까지만 적용됩니다.

### 적용 프로젝트 피드백 반영

- **FormGroup**: 오류가 있어도 도움말을 유지하고 오류를 그 아래에 표시합니다. 입력은 도움말과 오류를 모두 `aria-describedby`로 연결합니다(기본 동작 변경). `labelHidden`으로 라벨을 화면에서만 숨길 수 있습니다. Native 기기 화면 판독기도 도움말과 오류를 이어서 읽습니다.
- **Select**: `id`(바깥 `<label for>` 연결)와 추가 설명 id(React `ariaDescribedBy`, Vue `ariaDescribedby`)를 받습니다. FormGroup 안에서 `id`를 주면 그룹 라벨도 그 id를 가리킵니다. id나 FormGroup이 있으면 placeholder를 이름으로 쓰지 않습니다.
- **설명 연결**: Input·Textarea·Select는 앱이 넘긴 설명 id와 FormGroup 설명을 중복 없이 합칩니다. 웹(React·Vue)의 Checkbox·Switch는 FormGroup 안에서 도움말·오류·필수 상태를 접근성 속성으로 받습니다(브라우저 제출을 막지 않습니다. Native는 아직 해당 없음).
- **Button `wrap`**: 긴 라벨을 줄바꿈합니다. 크기별 높이는 최소 높이가 됩니다.
- **Alert `live`**: `assertive`·`polite`·`off`로 보조기기 알림 방식을 정합니다. 생략하면 지금처럼 danger만 즉시 알립니다.
- **Tooltip `open`·`onOpenChange`**(Vue `v-model:open`): 표시 여부를 직접 제어합니다.
- **`data-kjun-content`**: KJUN 컨테이너 안의 앱 래퍼에 붙이면 그 안의 앱 마크업이 KJUN 기본 스타일 초기화를 받지 않습니다. 앱의 `input { … }` 같은 요소 선택자 스타일이 그대로 적용됩니다.
- **아이콘**: 등록되지 않은 이름을 쓰면 개발 모드(`process.env.NODE_ENV`가 production이 아닌 값으로 정해진 빌드)에서 한 번 경고합니다(대체 아이콘 동작은 같음).

### 결함 수정

- **단일 선택 메뉴**(React·Vue): `selected`가 boolean인 Dropdown 항목은 `menuitemradio`와 `aria-checked`로 선택 상태를 알립니다. Native는 이미 같은 규칙이었습니다.
- **Table 선택 바**: 방향키 이동이 없으므로 `role="toolbar"` 대신 이름 있는 `group`입니다.
- **Vue 3 Popover**: 열려 있거나 닫히는 동안 다시 그려질 때 대화상자가 초점을 다시 가져가던 문제를 고쳤습니다. 이제 열릴 때 한 번만 초점을 가져갑니다.

## 0.9.0 — 2026-10-18

적용 앱 피드백을 반영했습니다. 바꿀 코드는 없지만 **Select 검색 결과의 순서가 바뀝니다.**

- **Select 검색**: 결과를 일치도 순으로 정렬합니다(label이 검색어로 시작 → label에 포함 → `searchKeys` 필드에 포함, 같은 순위는 원래 순서). 새 prop `searchKeys`로 label 외 필드도 검색하고, `filterFn`으로 일치 판정을 직접 정할 수 있습니다(이때는 원래 순서 유지, 서버 검색만 쓰려면 `() => true`).
- **Popover `returnFocus`**(React·Vue 3): 닫힌 뒤 초점을 보낼 요소를 지정합니다. 요소·ref·요소를 돌려주는 함수를 받고, 대상이 없으면 트리거로 돌아갑니다.
- **DataState**: 래퍼에 `kjun-data-status-slot`·`kjun-data-loading-block`·`kjun-data-error`·`kjun-data-content` 클래스를 붙였습니다(웹). 구조 선택자 없이 각 부분을 꾸밀 수 있습니다.

### 결함 수정

- **Vue 3 Popover**: 안에서 연 Dropdown·Select 항목을 누르면 Popover까지 닫히던 문제를 고쳤습니다. 이제 맨 위 레이어만 바깥 누름과 Escape에 반응합니다.
- **RadioGroup**: `direction="vertical"`이 높이가 정해진 영역에서 둘째 열로 넘어가지 않습니다.
- **RefreshButton**: `mode="text"`의 접근성 이름이 보이는 글자(`text`)를 따릅니다.
- **Table**: 열 `format`에 함수가 아닌 값(예: `"percent"`)이 오면 표 전체가 깨지던 것을, 그 값을 무시하고 경고하도록 바꿨습니다.

## 0.8.1 — 2026-10-17

차트 스켈레톤을 다듬었습니다. 바꿀 코드는 없습니다.

- **제거된 kind 값**: JavaScript에서 `kind="line"`처럼 0.8.0에서 없앤 값이나 알 수 없는 값을 넘기면 frame으로 그리고, `data-kjun-chart-kind`도 `frame`으로 표시합니다.
- **Native 알림**: 로딩 문구가 있으면 Android에서 `accessibilityLiveRegion="polite"`로 읽힙니다.
- **donut**: 링과 문구가 앱의 CSS 리셋과 관계없이 `border-box`로 계산되어, 문구가 항상 구멍 안에 들어갑니다.

## 0.8.0 — 2026-10-16

차트 스켈레톤이 데이터 모양을 지어내지 않도록 정리했습니다. **깨지는 변경**이 있어 아래 표대로 코드를 바꿔야 합니다.

선·막대·캔들 차트의 실제 모양은 데이터마다 달라서, 미리 그린 가짜 시리즈는 도착 순간 화면을 크게 바꾸고 시세로 오해될 수 있었습니다. 이제 데이터와 무관하게 정해진 틀만 그립니다.

| 이전 | 이후 |
|---|---|
| `KjunChartSkeleton kind="line" \| "bar" \| "candle" \| "grid"` | `kind="frame"` (기본값이므로 생략 가능) |
| `<KjunSkeleton type="chart" />` | `<KjunChartSkeleton />` |
| `<KjunDataState skeleton skeletonType="chart" />` | `loadingContent`에 `<KjunChartSkeleton loadingText="" />` |
| 토큰 `extensions.skeleton.chartHeight`·`chartBarMaxWidth`·`chartAxisHeight`, `extensions.chartSkeleton.donutLabelWidth`·`donutLabelHeight` | 제거 |

- **`kind`**: `frame`(축·격자), `donut`(링), `matrix`(셀)만 남았습니다. 기본값은 `frame`입니다.
- **`rows`·`columns`**: matrix의 행·열 수입니다(기본 8·14, 1–100 사이로 맞춤).
- **`skeleton`**·**`loadingDelay`**: Table 계열과 같은 계약입니다. `skeleton={false}`이면 같은 높이 안에 스피너와 문구를, `loadingDelay` 동안은 빈 영역을 표시합니다.
- **접근성**: `loadingText`가 있으면 `role="status"`로 알립니다. DataState 안에서는 `loadingText=""`로 두어 중복 알림을 피하세요.
- **표시 개선**: 격자가 `--kjun-chart-grid` 색 역할을 쓰고 폭과 관계없이 1px로 그려집니다. donut 문구는 구멍 안에서 줄바꿈되고, 문구 칩은 테두리로 차트 위 레이어임을 드러냅니다.

```vue
<KjunChartSkeleton v-if="loading" :height="240" :loading-delay="300" />
<KjunChartSkeleton v-if="loading" kind="matrix" :rows="7" :columns="24" />
```

## 0.7.0 — 2026-10-16

로딩 표시 방식을 고를 수 있게 하고, KPI를 다른 표면 안에 넣을 수 있게 했습니다. 모두 기본값이 기존 동작과 같아 바꿀 코드는 없습니다.

- **`skeleton`**: Table·MarketTable·MarketCards·MarketSimpleList에 추가했습니다(기본 `true`). `false`이면 스켈레톤 대신 DataState의 스피너와 `loadingText`를 표시합니다.
- **`loadingDelay`**(ms): DataState와 위 네 컴포넌트에 추가했습니다(기본 `0`). 최초 로딩이 이 시간보다 길어질 때만 로딩 표시를 보여 주고, 그전에는 같은 공간을 비워 둡니다. 빠른 응답에서 로딩 표시가 깜빡이거나 레이아웃이 움직이지 않습니다.
- **`loadingText`**: Table과 Market 세 컴포넌트에 추가했습니다. 스피너 모드의 안내 문구입니다.
- **KpiHero·KpiRow `surface="none"`**: 자체 카드 배경·패딩·반경을 그리지 않습니다. 카드·모달 안이나 모바일 전폭 목록에 넣을 때 표면이 겹치지 않습니다.

```vue
<!-- 300ms 안에 끝나는 조회는 로딩 표시 없이, 그보다 길면 스피너와 안내 문구 -->
<KjunMarketCards :rows="rows" :loading="loading" :skeleton="false" :loading-delay="300" loading-text="관심 종목을 불러오는 중" ... />
<KjunKpiHero surface="none" label="총 평가 금액" :value="total" />
```

- Tabs 헤더를 스크롤 영역 위에 고정하는 방법(items만 넘기고 앱의 sticky 래퍼로 감싸기)을 Tabs 문서에 추가했습니다.

### 결함 수정

첫 적용 프로젝트의 피드백에서 찾은 결함입니다.

- **숫자 글꼴**: `.kjun-type-number-*`·`.kjun-type-display-*`가 접두사 없는 앱 변수 `--font-numeric`을 읽던 것을 `--kjun-font-numeric`(없으면 `--kjun-font`) 연결로 바꿨습니다. 앱이 `--font-numeric`을 정의하지 않아도 숫자 글꼴이 적용됩니다. 전역 이름 검사가 CSS `var()` 참조도 확인합니다.
- **IconToggle**: `activeColorClass`·`inactiveColorClass`로 넘긴 앱 색 클래스가 실제로 아이콘 색을 정합니다(이전에는 기본 색이 이겼습니다). 색 클래스를 쓰면 KJUN 기본 색과 hover 색을 적용하지 않습니다.
- **KpiHero**: 좁은 화면(400px 이하)에서 보조 지표가 셋 이상이면 두 열로 감쌉니다. 한 줄에 몰려 숫자가 자릿수 사이에서, 라벨이 음절 사이에서 끊기던 문제를 고쳤습니다. 새 토큰 `breakpoints.narrow`(400)와 `responsive.kpiHeroSecondary`를 추가했습니다.
- **Deviation**: 단계 경계(0.1·0.5·1%)를 `deviationThresholds`·`deviationLevel()`로 export하고, 단계별 배경 투명도를 토큰 `states.opacity.deviationLow·Medium·Strong`으로 옮겼습니다. 앱은 같은 경계를 사본 없이 가져다 쓸 수 있습니다.
- `forms.css`에 남아 있던 Vue 2 전용 `kj-` 선택자를 지웠습니다(Vue 3·React에는 영향 없음).

## 0.6.1 — 2026-10-15

- npm에 표시되는 패키지 설명(README)에서 Vue 2 안내를 Vue 3로 고쳤습니다(`@kjun-ui/icons`, `@kjun-ui/react`, `@kjun-ui/native`). 코드 변경은 없습니다.
- `@kjun-ui/vue3`도 다른 패키지처럼 GitHub Actions에서 provenance와 함께 배포합니다.

## 0.6.0 — 2026-10-15

Vue 패키지를 Vue 3용 `@kjun-ui/vue3`로 새로 만들었습니다. `@kjun-ui/vue2`는 0.5.x가 마지막 버전이며 더 이상 갱신하지 않습니다. **깨지는 변경**입니다.

- `@kjun-ui/vue3`는 Vue 3.5 이상이 필요합니다(peer `vue ^3.5`). React 패키지와 같은 DOM·클래스·`data-*`·`aria-*`를 렌더링하고, 스타일은 토큰 CSS만 사용합니다. Vue 2의 `kj-` 유틸리티 클래스는 더 이상 배포하지 않습니다.
- 플러그인: `app.use(Kjun)` (`import Kjun from '@kjun-ui/vue3/plugin'`). `{ skipExisting: true }` 옵션은 그대로입니다.
- 문서의 Vue 예제는 `<script setup>` SFC입니다. 예전 `?platform=vue2` 링크는 Vue 3 문서로 열립니다.

| Vue 2 (0.5) | Vue 3 (0.6) |
| --- | --- |
| `v-model` (`value` / `input`) — Input·Select 등 값 컴포넌트 | `v-model` (`modelValue` / `update:modelValue`) |
| Modal·Drawer·Popover `v-model` (`value` / `input`) | `v-model:open` |
| Select `:open.sync` | `v-model:open` |
| Table `selection-change`, `:sort.sync` + `sort-change`, `row-expand`·`row-collapse` | `v-model:selected`, `v-model:sort`, `v-model:expandedRows` |
| Pagination `update:currentPage`, `update:page-size` | `v-model:page`, `v-model:pageSize` |
| 슬롯 `header-actions`, `menu-header`, `selection-toolbar`, `sub-label`, SearchInput `item` | `headerActions`, `menuHeader`, `selectionToolbar`, `subLabel`, `option` |
| `formatters` 주입·prop | 컴포넌트별 `formatter`·`formatMetric` 함수 prop (React와 같음) |
| `inject: ['kjunFeedback']`, `this.kjunFeedback` | `const feedback = useKjunFeedback()` |
| Button `htmlType` | `type` |
| Icon `size="16px"` | `:size="16"` 또는 CSS 길이 문자열 |
| ErrorBoundary 새로고침 버튼 | `다시 시도`로 경계를 초기화, `fallback` 슬롯·`reset` 이벤트 |
| Breadcrumb `navigate` 이벤트 | `link` 슬롯 (`{ item, label }`) |
| RadioGroup 그룹 `disabled` | 옵션별 `disabled` (React와 같음) |

- 이벤트 이름은 kebab-case(`@page-change`, `@toggle-interest`, `@search-error`)이며, 행 클릭·재시도처럼 연결 여부로 동작이 바뀌는 콜백(`@row-click`, `@retry`)은 prop으로 선언되어 있습니다.
- 모든 슬롯은 타입(`SlotsType`)으로 선언되어 IDE에서 슬롯 이름과 데이터를 확인할 수 있습니다.
- 모든 웹 패키지의 `styles.css`에서 Vue 2 전용 규칙(Tailwind `kj-` 유틸리티, Vue 2 컴포넌트 스타일)을 뺐습니다. React·Vue 3 컴포넌트가 쓰는 `kjun-` 규칙은 그대로이며, 앱이 `kj-` 클래스를 직접 쓰고 있었다면 앱 스타일로 옮기세요.
- 입력 스타일(`forms.css`)은 토큰 패키지 소스로 옮겼습니다. 배포되는 `styles.css` 내용은 같습니다.
- Native: `block` RefreshButton이 행 폭을 채웁니다. 툴팁 래퍼가 내용 폭으로 줄이던 문제를 고쳤습니다.
- Native: QuantityStepper의 바깥 모서리 반경이 루트에 적용되고, 웹에서 `block`이 아니면 내용 폭에 맞춥니다(React와 같음).
- Vue 3: Popover 대화상자 안에서 Tab 포커스가 유지되고, 사라지는 중인 Toast처럼 `inert`인 요소는 Tab 순서에서 빠집니다.

## 0.5.1 — 2026-10-15

- **앱 래퍼에 붙이는 폼 레이아웃 도우미를 클래스에서 속성으로 바꿨습니다.** `class="kjun-form-layout"` 대신 `data-kjun-layout="form"`을 붙이세요. `kjun-`으로 시작하는 클래스는 KJUN 마크업으로 처리되기 때문에, 0.5.0에서는 이 도우미를 붙인 앱 래퍼와 그 안의 앱 요소가 KJUN 기본 텍스트(14px·줄높이 20px, 글꼴·색)와 reset을 받았습니다. 이제 래퍼와 안쪽 앱 요소는 앱 스타일을 그대로 유지하고, 래퍼 바로 아래 폼 그룹의 기본 아래 여백만 없어집니다. `kjun-form-layout` 클래스는 없앴습니다.

## 0.5.0 — 2026-10-14

KJUN이 앱과 함께 쓰는 이름 공간(CSS 클래스·변수·keyframes·요소 id, Vue 전역 컴포넌트·provide 키·인스턴스 멤버, 패키지 export)의 모든 이름이 `kjun`으로 시작합니다. 앱이 같은 이름을 써도 서로 영향을 주지 않습니다. 호환 별칭 없이 바뀌는 **깨지는 변경**입니다.

| 이전 | 0.5.0 |
| --- | --- |
| 컴포넌트·타입 `DsButton`, `DsButtonProps` … (세 플랫폼) | `KjunButton`, `KjunButtonProps` … |
| Vue 템플릿 태그 `<ds-button>` | `<kjun-button>` |
| Vue 마크업 클래스 `ds-*` (`ds-modal-container`, `ds-kpi-row__value` …) | `kjun-*` |
| `ds-form-layout` | `kjun-form-layout` |
| `flashClass` 값 `price-flash-up` / `price-flash-down` (`-bg`, `-bg-pop`, `-bg-strong` 포함) | `kjun-price-flash-up` / `kjun-price-flash-down` … |
| `mobile-simple-list*` 클래스 | `kjun-mobile-simple-list*` |
| Provider에 정의되던 접두사 없는 변수 (`--border`, `--brand`, `--text-primary`, `--font-sans`, `--ease-out`, `--motion-*`, `--extension-*` 등 582개) | 내부 변수 `--_kjun-*`. 공개 색상·서체 변수 `--kjun-*`는 그대로입니다. |
| Vue 인스턴스 메서드 `$formatNumber` 등 8개, `$toast` | `kjunFormatNumber` …, `kjunToast` |
| Vue provide 키 `dropdown`, `radioGroup`, `tabsContainer`, `accordion`, `dsFormGroup` | `kjunDropdown`, `kjunRadioGroup`, `kjunTabs`, `kjunAccordion`, `kjunFormGroup` |
| Vue 전용 마켓 클래스 `metric-pills`·`metric-pill`·`pill-arrow`, `market-table`, `market-card`·`card-left`·`card-right` … | `kjun-metric-pill-group`·`kjun-metric-pill`·`kjun-metric-pill-arrow`, `kjun-market-table-frame`, `kjun-market-card`·`kjun-market-card-left`·`kjun-market-card-right` … |
| Vue Drawer 바깥 레이어 `ds-drawer-overlay` | `kjun-drawer-layer` |
| 생성되는 요소 id (`tab-…`, `tabpanel-…`, `accordion-header-…`, `modal-title-…`, `drawer-title-…`, React·Native `useId` 값 등) | `kjun-`로 시작 |
| `--card-border` | `--_kjun-role-card-border` |

- **Provider가 `--border`, `--font-sans` 같은 변수를 더 이상 정의하지 않습니다.** 앱 CSS가 이 이름을 읽으면 앱의 값이 그대로 쓰입니다. KJUN이 정의하던 값에 기대던 앱 CSS는 앱에서 직접 정의하세요.
- **Vue 플러그인**: `Vue.use(Kjun, { skipExisting: true })`(`import Kjun from '@kjun-ui/vue2/plugin'`)로 앱이 이미 등록한 같은 이름의 컴포넌트를 유지할 수 있습니다. 옵션 없이 설치하면 덮어쓰기 전에 경고합니다.
- **Vue `KjunErrorBoundary`**는 가장 가까운 경계만 에러를 처리합니다. `error` 이벤트(React·Native의 `onError`)를 내보내고 앱의 `Vue.config.errorHandler`(없으면 콘솔)로 에러를 알립니다. 바깥 경계는 반응하지 않습니다. 이전에는 에러를 알리지 않고 삼켰습니다.
- **감속 모드(`prefers-reduced-motion`)**의 애니메이션 단축이 kjun 컴포넌트에만 적용됩니다. Provider 안 앱 애니메이션은 그대로 재생됩니다.
- **kjun 마크업 판별**: 클래스가 `kjun-`으로 *시작*할 때만 kjun 마크업으로 처리합니다. `my-kjun-logo` 같은 앱 클래스는 앱 마크업입니다.
- 폼 그룹 간격 규칙이 앱의 `flex`·`grid` 클래스를 읽지 않습니다. 앱 래퍼에서 폼 그룹을 나란히 배치할 때는 `kjun-form-layout`을 붙이세요.
- Vue Select의 지우기 버튼 자리 여백이 다시 적용됩니다(0.4.0에서 빠졌던 규칙).
- 저장소의 단위 테스트(`tests/global-names.test.mjs`)가 빌드 결과의 CSS 클래스·변수·keyframes, 요소 id, Vue 전역 컴포넌트·provide 키·인스턴스 멤버를 확인하고, `kjun`으로 시작하지 않는 이름이 있으면 실패합니다. 패키지 export는 예전 `Ds*` 이름이 남지 않았는지만 확인합니다.
- 컴포넌트 안에서 다른 컴포넌트·provide 키를 직접 참조하던 앱 코드(예: `inject: ['dropdown']`로 만든 사용자 정의 항목)는 위 표의 새 이름을 쓰세요.

## 0.4.2 — 2026-10-14

- 0.4.1에서 빠진 `ds-*` 규칙도 kjun 컴포넌트 안에서만 적용됩니다. `:is(.kjun-…, .ds-…)`처럼 kjun 클래스가 선택지로만 들어 있던 규칙이 앱 마크업에 적용되던 문제를 고쳤습니다. 대상: KPI·숫자 표시(`ds-kpi-hero*`, `ds-kpi-row*`, `ds-animated-number*`), `ds-button-group`, `ds-badge`, `ds-breadcrumb-link`, `ds-pagination-button`.

## 0.4.1 — 2026-10-14

- `ds-`로 시작하는 kjun 컴포넌트 스타일(입력 필드, 선택 컨트롤, 드롭다운 항목, 폼 그룹 등 57개 클래스)이 kjun 컴포넌트 안에서만 적용됩니다. 앱 마크업이 같은 `ds-*` 이름을 써도 Provider 안에서 kjun 스타일을 받지 않습니다.
- 앱 래퍼에 붙이는 레이아웃 도우미는 `kjun-form-layout`을 쓰세요. `ds-form-layout`은 0.4.x 동안 그대로 동작하지만 다음 버전에서 제거할 예정입니다.

## 0.4.0 — 2026-10-11

`KjunProvider`(와 `KjunFeedbackProvider`)로 앱 전체를 감싸도 kjun CSS가 앱 마크업의 모양을 바꾸지 않습니다. 컴포넌트·props·이벤트·슬롯·`--kjun-*` 변수 이름은 그대로지만, 아래 항목은 **깨지는 변경**입니다.

- **Provider가 앱 요소를 꾸미지 않습니다.** 기본 스타일 초기화(reset), Tailwind 기본 변수(`--tw-*`), 기본 글꼴·글자색·글자 크기는 kjun 컴포넌트 안에서만 적용됩니다. Provider에 기대어 앱 본문의 글꼴·색을 정하던 앱은 앱 CSS에서 직접 지정하세요.
- **Vue 내부 유틸리티 클래스가 `kj-` 접두사를 씁니다.** 앱의 Tailwind 클래스(`hidden md:flex` 등)와 이름이 겹치지 않습니다. 같은 `styles.css`를 쓰므로 React 앱도 해당합니다.
- **kjun 유틸리티를 직접 쓰던 코드는 `kj-` 이름으로 바꾸세요.** 앱 마크업에 쓴 `text-text-secondary`, `font-medium` 같은 kjun 전용 클래스와, 클래스를 받는 props에 넘기던 값이 대상입니다: `alignClass`, `widthClass`, `rowClass`, `cellClass`, `descClass`, `menuClass`, `flashClass`, `activeColorClass`, `inactiveColorClass`, `titleClass`, `subtitleClass`. 예: `activeColorClass="text-favorite"` → `"kj-text-favorite"`.
- **Vue `DsIconToggle`의 `activeColorClass`·`inactiveColorClass` 기본값**이 `kj-text-brand`·`kj-text-text-tertiary`로 바뀌었습니다.
- **kjun 컴포넌트 안에 넣은 슬롯 콘텐츠**는 kjun 기본 스타일을 따릅니다. 요소 선택자 대신 클래스로 꾸미세요.
- **`kjun-`로 시작하는 클래스 이름은 kjun 전용입니다.** 앱 요소나 Provider의 `className`에 `kjun-`로 시작하는 클래스를 붙이면 그 영역이 kjun 마크업으로 처리됩니다.
- 앱 아이콘 주변 글자의 색·크기는 kjun 아이콘에 그대로 이어집니다(`currentColor`, `1em`).

## 0.3.2 — 2026-10-11

- GitHub Actions 릴리스로 배포합니다. npm 패키지에 빌드 출처(provenance)가 표시됩니다. 패키지 코드는 0.3.1과 같습니다.
- 문서 사이트의 컴포넌트 카탈로그에서 이관 전 내부 경로 기록을 지웠습니다.

## 0.3.1 — 2026-10-09

- `@kjun-ui/vue2`가 React 없이 동작합니다. Alert 액션 크기 정의가 React 모듈을 불러오던 문제를 고쳤습니다.
- Vue 2 Breadcrumb·BottomNavigation·ListRow 링크는 `javascript:`·`data:` 같은 주소를 렌더링하지 않습니다. 상대 경로와 http·https·mailto·tel 주소는 그대로 사용합니다.
- `@kjun-ui/native`의 `react-native` peer 범위를 `>=0.86.3`으로 넓혔습니다.
- 패키지 README에 npm 설치 명령을 넣고 필수 색상 역할 수를 27개로 바로잡았습니다.

## 0.3.0 — 2026-10-09

- npm 첫 공개 배포입니다. 문서: https://ui.kjun.dev
