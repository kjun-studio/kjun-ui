import { readFileSync } from "node:fs";
import { detail, event, slot, fields } from "./helpers.mjs";
import { eventCalendarProp, eventCalendarEvents, eventCalendarTypes } from "./event-calendar.mjs";
const sliderSummaries = {
  valueLabel: { type: '"off" | "drag" | "always"', default: '"off"', ...{ summary: "손잡이 위 말풍선에 값을 보여 줄 때를 정합니다.", details: [{ label: "값", text: "drag는 끄는 동안과 키보드 포커스 중에만, always는 늘 보여 줍니다. 세로 슬라이더는 손잡이 오른쪽에 둡니다. formatValue를 따르고, 손잡이가 이미 값을 읽어 주므로 보조기기에는 숨깁니다." }] } },
  fillOrigin: { type: "number", summary: "채움이 min 대신 이 값에서 시작합니다. −50~50 같은 양방향 값에 쓰며, 기준점에 세로 눈금을 함께 그립니다. min과 max 사이일 때만 적용됩니다." },
  minStepsBetweenThumbs: { type: "number", default: "0", summary: "두 손잡이가 유지할 최소 step 수입니다. 끌기·키보드·트랙 누름 모두 이 간격 앞에서 멈춥니다. 0이면 두 손잡이가 같은 값에 겹칠 수 있습니다." },
  name: { type: "string", summary: "폼 제출 이름입니다. 숨은 input으로 값을 보내며, RangeSlider는 같은 이름으로 시작·끝 두 값을 보냅니다." },
  id: { type: "string", summary: "루트 그룹의 id입니다." },
  className: { type: "string", summary: "루트(kjun-slider)에 더할 클래스입니다. 크기는 size·length로 정하세요." },
  style: { summary: "루트에 더할 스타일입니다. 폭과 바깥 여백 정도만 바꾸세요." },
  testID: { type: "string", summary: "테스트에서 루트 View를 찾는 ID입니다." },
};

const bindings = JSON.parse(readFileSync(new URL("./extensions.json", import.meta.url), "utf8"));
const guides = JSON.parse(readFileSync(new URL("../component-guides.json", import.meta.url), "utf8"));
const summaries = {
  target: "링크 행이 열리는 곳입니다(예: \"_blank\"는 새 탭). 새 탭에는 rel을 주지 않아도 noopener noreferrer가 붙습니다.",
  rel: "링크의 rel입니다. 생략하면 target=\"_blank\"일 때 noopener noreferrer를 씁니다.",
  trailingPosition: "끝 칸 값의 자리입니다. side(기본값)는 글 전체 옆의 별도 열이고, title은 제목과 같은 줄, below는 제목 아래 자기 줄(글 폭 전체, 시작 정렬)입니다. below는 주소·메모처럼 긴 값에 씁니다. title이면 설명과 children이 값의 길이와 무관하게 글 폭 전체를 써서, 막대가 있는 행들의 끝선이 맞습니다.",
  expandedContent: "펼친 동안 행 아래에 보이는 내용입니다. 제목이 시작하는 선에서 시작하고, 버튼 바깥이므로 버튼·링크를 넣을 수 있습니다.",
  reorderable: "행 순서를 사용자가 바꿀 수 있게 합니다. order에 있는 value를 가진 행마다 위·아래 이동 버튼을 행의 actions 뒤에 그립니다. 순서는 앱이 관리하며 KJUN은 행을 직접 옮기지 않습니다. 기본값 false입니다.",
  order: "보이는 순서대로 나열한 행 value 배열입니다. 앱이 이 순서로 행을 그립니다. 배열에 없는 value의 행과 value가 없는 행은 이동 버튼이 없습니다. reorderable에 필요합니다.",
  reorderControls: "이동 컨트롤의 종류입니다. buttons(기본값)는 위·아래 버튼, handle은 끄는 손잡이, both는 둘 다입니다. 손잡이는 포인터로 끌면 이웃 행의 가운데를 지날 때마다 한 칸씩 옮기고, 키보드에서는 Enter·Space로 잡은 뒤 위·아래 화살표로 옮기고 Enter로 놓으며 Escape로 처음 자리에 되돌립니다. 끌거나 잡은 동안에는 한 칸마다 onOrderChange만, 놓을 때 onReorder가 한 번 발생합니다. 스크린리더의 누르기로도 잡고 놓을 수 있지만, 탐색 모드에서는 화살표 키를 스크린리더가 먼저 쓰므로 스크린리더 사용자를 위해서는 버튼이 함께 있는 both를 권합니다. 앱이 한 칸 이동을 적용하지 않으면 그 칸에서 멈추고, 놓을 때는 마지막 요청이 적용되기를 잠시 기다린 뒤 알립니다. Native는 손잡이를 그리지 않고 항상 위·아래 버튼을 그립니다.",
  reorderDisabled: "이동 버튼을 모두 끕니다. 가격순처럼 자동 정렬 중일 때 켜세요. 기본값 false입니다.",
  reorderDisabledText: "이동을 끈 이유입니다. reorderDisabled일 때 행 아래에 보이고 이동 버튼의 설명으로 함께 읽습니다.",
  // TimePicker refines these two below.
  hourCycle: "시계 방식입니다. 24는 00~23시, 12는 오전/오후와 1~12시를 보입니다.",
  readOnly: "값을 보여 주기만 하고 바꾸지 않습니다.",
  showValue: "값 출력을 표시합니다. false여도 숫자 값·키보드 조작·접근성 이름은 유지합니다. label도 없으면 빈 캡션 영역을 만들지 않습니다.",
  radius: "행을 카드와 같은 단계(none·sm·md·lg·xl = 0·8·12·16·24)의 둥근 카드로 묶고, 행 누름 배경·구분선을 그 모서리로 잘라 냅니다. 제목·설명·actions·footer는 카드 밖에 둡니다. 기본값 none은 이전처럼 각진 모양입니다. 첫 행과 마지막 행의 누름 배경·키보드 초점 링은 카드 모서리를 따릅니다.",
  ariaLabel: "시각적 라벨이 부족한 경우 사용할 접근성 이름입니다. ListRow에서는 누르는 행·링크 행의 이름이 되며, 금액처럼 화면 낭독기가 함께 읽어야 할 값을 넣습니다.",
  emphasized: "목록이 향하는 값(합계·잔액 등)을 강조합니다. 제목은 한 단계 굵게, 값은 큰 숫자체로 키우며 색은 바꾸지 않습니다.",
  destructive: "제목을 danger 색으로 그립니다(계정 삭제 등). 설명 색과 동작은 그대로입니다.",
  chevron: "행 끝에 이동을 뜻하는 chevron-right 아이콘을 장식으로 둡니다. 화면 낭독기에는 읽히지 않으며 trailing과 함께 쓰면 맨 끝에 옵니다.",
  surface: "표면색(surface) 바탕을 그립니다. 기본값 true이며 false면 바탕 없이 부모 배경이 그대로 보입니다. 헤더·하단 탭바·하단 버튼 영역에서는 화면 바탕과 이어져 별도의 띠처럼 보이지 않게 할 때 씁니다. 내용이 그 뒤로 스크롤되는 고정 영역에는 바탕을 두세요.",
  color: "이니셜·대체 아이콘 뒤 바탕색입니다. 웹은 CSS 색 문자열(var(--kjun-...) 권장), Native는 ColorValue를 받습니다. 생략하면 secondary 역할입니다. 이미지가 보이면 가려집니다.",
  textColor: "이니셜과 대체 아이콘의 색입니다. 웹은 CSS 색 문자열, Native는 ColorValue를 받습니다. 생략하면 textSecondary 역할입니다.",
  divider: "행 사이 구분선을 그립니다. 기본값 true이며 false면 선 없이 붙여 그립니다.",
  density: "행 밀도입니다. 기본값 default는 높이 56, compact는 44(터치 최소 크기)에 위아래 여백 12이며 시작 여백 16은 같습니다.",
  block: "부모의 전체 너비를 채우고 중앙 숫자 입력을 확장합니다. 기본값 false는 80px 입력과 정사각형 증감 버튼으로 구성합니다.",
  title: "영역이나 행의 제목입니다. 긴 문구는 줄바꿈합니다.", description: "제목 또는 행동을 보충하는 설명입니다.",
  href: "웹에서 이동할 실제 링크 주소입니다. 앱 라우터는 이동 이벤트의 기본 동작을 취소할 수 있습니다.",
  disabled: "이 컴포넌트의 사용자 입력 또는 주 행동을 막습니다. 별도 자식 컨트롤의 비활성은 직접 연결합니다.",
  safeArea: "KjunProvider의 safeArea(웹은 없으면 브라우저 env(safe-area-inset-*))만큼 화면 가장자리에서 띄웁니다. 기본값 true이며, 앱이 이미 그 공간을 비웠거나(Drawer 안, SafeAreaView 안) 화면 가장자리가 아닌 곳에 놓을 때 false로 끕니다.",
  keyboardVisible: "키보드 표시 여부입니다. 웹은 앱이 감지해 넘기고, 창 크기 조절도 앱의 책임입니다.",
  hideOnKeyboard: "keyboardVisible=true일 때 이 영역을 숨길지 결정합니다.",
  iconStyle: "아이콘을 그리는 방식입니다. auto(기본)는 미선택을 외곽선, 현재 목적지를 채운 아이콘으로 그려 색과 모양으로 구분합니다. filled는 모두 채움형(색으로만 구분하므로 면적이 비슷한 아이콘 세트에 권장), outline은 모두 외곽선(현재 목적지만 획 2px)입니다. 채움형이 없는 아이콘은 외곽선으로 남습니다.",
  showLabels: "아이콘 아래에 라벨을 보입니다. 기본값 true이며 false면 아이콘만 56px 높이로 그리고 label은 접근성 이름으로 남습니다. 아이콘이 없는 글자 전용 바는 항상 라벨을 보입니다.",
  src: "로드할 이미지 URL 또는 data URL입니다. 변경하면 새 요청으로 처리합니다.",
  source: "Native 이미지 리소스입니다. 제공하면 src보다 우선하며 require로 가져온 로컬 리소스도 받습니다.",
  alt: "이미지의 내용을 설명하는 전체 대체 텍스트입니다.",
  decorative: "장식용 이미지의 접근성 이름을 숨깁니다. 인접 텍스트로 같은 정보를 이미 제공할 때 사용합니다.",
  aspectRatio: "이미지 컨테이너의 가로/세로 비율입니다. 양수가 아니면 1로 표시합니다.",
  fit: "cover는 영역을 채우며 일부를 자르고 contain은 전체 이미지를 유지합니다.",
  lazy: "웹 이미지의 브라우저 지연 로딩을 사용합니다. Native에는 이 prop이 없습니다.",
  name: "프로필의 전체 이름입니다. 이미지 실패 시 첫 글자를 표시하되 접근성 이름은 전체를 유지합니다.",
  size: "공개된 크기 중 하나를 선택합니다. Native 상호작용 영역은 최소 터치 크기를 확보합니다.",
  shape: "프로필을 원형 또는 모서리가 둥근 사각형으로 표시합니다.",
  icon: "라벨 앞에 배치할 KJUN 아이콘 이름입니다.",
  removable: "라벨 옆의 삭제 요청 버튼을 표시합니다. 항목을 자동 제거하지 않습니다.",
  removeLabel: "삭제 버튼의 접근성 이름입니다. 생략하면 라벨 뒤에 ‘삭제’를 붙입니다.",
  label: "표시하거나 조절하는 값의 목적을 설명하는 라벨입니다.",
  error: "입력 영역을 오류로 표현합니다. 검증과 오류 설명은 소비자가 제공합니다.",
  clearable: "값이 있을 때 선택한 시각을 null로 바꾸는 지우기 버튼을 표시합니다.",
  minuteStep: "분 선택지의 간격입니다. 1~59의 정수이며 0분부터 시작합니다.",
  secondStep: "초 선택지의 간격입니다. 1~59의 정수이며 0초부터 시작합니다.",
  id: "실제 숫자 입력의 ID입니다. 외부 라벨과 명시적으로 연결할 때 사용합니다.",
};
const carouselSummaries = {
  ariaLabel: "캐러셀 영역의 이름입니다(예: 추천 상품). title이 없으면 필요합니다. 영역은 ‘캐러셀’, 슬라이드는 ‘2 / 4’처럼 순서를 함께 읽습니다.",
  title: "슬라이드 위에 놓는 섹션 제목(h2)입니다. 영역 이름이 되고, 웹의 이전·다음 버튼은 슬라이드 양쪽 대신 제목 오른쪽에 항상 보이며 처음·끝에서 비활성입니다. 작은 카드 여러 장을 보여 주는 카드 줄에 씁니다.",
  slideSize: "full은 슬라이드를 영역 폭에 맞추고, peek은 다음 슬라이드를 24px 보이게 하며, auto는 슬라이드 내용이 폭을 정합니다(카드 줄).",
  gap: "슬라이드 사이 간격입니다. none·sm·md·lg = 0·8·12·16px이며 기본값은 md입니다.",
  index: "제어할 때의 현재 슬라이드 번호(0부터)입니다. 바꾸면 그 슬라이드로 스크롤하며 범위를 벗어나면 처음·끝으로 맞춥니다.",
  defaultIndex: "제어하지 않을 때 처음 보여 줄 슬라이드 번호(0부터)입니다. 애니메이션 없이 바로 그 위치에서 시작합니다.",
  snapAlign: "슬라이드가 멈추는 기준입니다. start(기본)는 시작 가장자리, center는 가운데입니다. slideSize=\"peek\"와 함께 쓰면 현재 슬라이드를 가운데 두고 양옆 슬라이드가 24px씩 보입니다.",
  bleed: "화면 여백 밖까지 슬라이드를 펼칩니다. none(기본)·sm·md·lg = 0·12·16·24px만큼 양옆으로 넓어지고, 첫 슬라이드는 원래 콘텐츠 시작선에 맞춰 멈춥니다. 부모의 좌우 여백과 같은 값을 고르세요.",
  indicatorPlacement: "위치 표시를 놓는 곳입니다. below(기본)는 슬라이드 아래, overlay는 슬라이드 위에 반투명 바탕(overlay 색 역할)의 둥근 띠로 겹칩니다. 점은 아래 가운데, 숫자는 아래 끝에 놓여 사진 위에서도 읽힙니다.",
  titleAs: "title의 제목 수준입니다(h2~h6, 기본값 h2). 화면의 문서 구조에 맞춥니다. Native에는 없습니다.",
  indicators: "슬라이드 아래 표시입니다. true 또는 \"dots\"는 표시 점, \"count\"는 \"3 / 24\" 같은 숫자 표시(슬라이드가 많을 때), false는 없음입니다. 기본값 true이며 슬라이드가 하나면 그리지 않습니다. Native 스크린리더에는 하나의 조절 컨트롤로 보여, 위·아래로 쓸어 슬라이드를 옮깁니다.",
  mouseDrag: "마우스로 슬라이드를 끌어 넘깁니다. 기본값 true이며 화면 폭의 1/5보다 길게 끌면 한 장 넘어가고, 짧으면 제자리로 돌아갑니다. 입력창 안에서 시작한 드래그는 글자 선택으로 남습니다. 마우스 휠로는 넘어가지 않습니다. Native에는 없습니다.",
  controls: "이전·다음 버튼을 그립니다. 기본값 true이며 웹에서 마우스처럼 올려 둘 수 있는 포인터일 때만 씁니다. title이 없으면 두 버튼이 슬라이드 아래 끝 8px 안쪽의 둥근 띠 하나에 모이고, 점이 없으면(indicators=\"count\" 또는 false) 그 사이에 \"2 / 4\" 위치를 보여 줍니다. 사진 배너(full·peek)는 반투명 바탕(overlay 색)에 흰 글자, 카드 줄(auto·minSlideWidth)은 표면색 바탕에 테두리와 그림자입니다. 처음·끝에서는 그쪽 버튼이 꺼지고 초점은 다른 버튼으로 갑니다. 버튼과 화살표 키는 실제로 멈추는 위치 단위로 움직여, 카드 줄 끝처럼 여러 장이 한 위치에 멈추면 그 장들을 한 번에 건너뜁니다. 버튼·표시 점·mouseDrag를 모두 끄면 마우스로 넘길 수 없어 개발 모드에서 경고합니다. Native는 버튼 없이 넘깁니다.",
  className: "루트 section에 더할 클래스입니다. 크기·간격은 slideSize·gap으로 정하세요.",
  style: "루트에 더할 스타일입니다. 바깥 여백이나 폭 제한에 사용하세요.",
  id: "루트 section의 ID입니다.",
  minSlideWidth: "슬라이드의 최소 폭(px)입니다. 정하면 이 폭 이상을 지키는 만큼 여러 장을 한 줄에 나눠 놓아 끝에 잘린 카드가 남지 않고, 폭이 바뀌면 장 수를 다시 셉니다(예: 180이면 720px에서 3장, 400px에서 2장). 한 장보다 적어지지는 않습니다. 정하면 slideSize 대신 씁니다.",
  action: "제목 줄 끝, 이전·다음 버튼 앞에 놓는 행동입니다(예: ghost sm KjunButton \"전체 보기\"). 터치 화면에서는 버튼이 숨으므로 이 행동만 남습니다. Vue는 action 슬롯입니다.",
};
const imageSummaries = {
  shape: "이미지 모서리입니다. square(기본)는 각지게, rounded는 12px 둥글게, circle은 원으로 자릅니다. 목록 썸네일이나 갤러리에서 감싸는 요소 없이 모서리를 둥글게 할 때 씁니다.",
  aspectRatio: "이미지 영역의 가로/세로 비율입니다. 양수가 아니면 1로 표시합니다. \"auto\"면 불러온 이미지의 원래 비율로 높이가 정해지고, 불러오기 전에는 높이가 0이며 주소가 없거나 실패하면 정사각형 대체 표현을 그립니다.",
  lazy: "웹 이미지의 브라우저 지연 로딩을 사용합니다. Native는 같은 코드를 위해 받기만 하고, 그려질 때 불러옵니다.",
  fallback: "주소가 없거나 불러오지 못했을 때 대신 그릴 내용입니다. 비우면 사진 아이콘입니다. 글자를 주면 사진 아이콘 아래 12px 캡션으로 좌우 12px 안쪽에 가운데 정렬하고, 이미지 폭이 120px보다 좁으면 아이콘만 남깁니다(이름은 alt로 읽음). 요소를 주면 그대로 가운데에 그립니다.",
};
// React Chip passes the attributes it does not use to its root span, like Vue.
const chipRoot = {
  className: { summary: "바깥 span에 더할 클래스입니다. 크기·여백은 size로 정하세요." },
  id: { summary: "바깥 span의 ID입니다." },
  style: { summary: "바깥 span에 더할 스타일입니다. 바깥 여백이나 폭 제한에 쓰세요." },
  autoFocus: { summary: "바깥 span에 그대로 전달합니다. span은 초점을 받지 않으므로 삭제 버튼에는 영향이 없습니다." },
  onClick: event("바깥 span의 클릭을 받습니다.", "칩 안 어디든 누를 때. 삭제 버튼 클릭도 여기까지 올라옵니다.", "MouseEvent<HTMLSpanElement>", "반환값을 사용하지 않습니다.", "라벨은 버튼이 아니므로 값을 고르는 동작은 KjunFilterGroup을 쓰세요."),
  onKeyDown: event("바깥 span으로 올라오는 키 입력을 받습니다.", "삭제 버튼에 초점이 있을 때 키를 누르면", "KeyboardEvent<HTMLSpanElement>", "반환값을 사용하지 않습니다."),
  onChange: event("바깥 span에 그대로 전달합니다.", "칩에는 값을 바꾸는 입력이 없어 직접 발생하지 않습니다", "FormEvent<HTMLSpanElement>", "반환값을 사용하지 않습니다."),
};
// Native has no DOM attributes; like Badge it takes a test id and an outer style.
const chipNative = {
  testID: { summary: "테스트에서 칩을 찾는 ID입니다." },
  style: { summary: "칩 바깥 View에 더할 스타일입니다. 바깥 여백이나 정렬에 쓰고, 크기·여백은 size로 정하세요." },
};
const colorPickerSummaries = {
  defaultValue: "제어하지 않을 때의 시작 값입니다. 생략하면 색 없음(null)에서 시작합니다.",
  swatches: "앱이 고를 수 있게 내놓는 색 목록입니다. 문자열 또는 { value, label }이며 label이 없으면 HEX를 읽습니다. label을 준 견본을 고르면 트리거에 이름을 먼저, 코드를 뒤에 보여 주고 웹에서는 견본에 마우스를 올리면 이름이 뜹니다. 형식이 틀린 항목은 빼고 개발 모드에서 한 번 경고합니다.",
  custom: "채도·명도 영역과 색상 슬라이더를 켭니다. 회색까지 내려도 색상(hue)을 잃지 않습니다.",
  alpha: "투명도 슬라이더와 % 입력을 켭니다. 켜면 값은 항상 #RRGGBBAA이고, 끄면 들어온 값의 투명도를 버립니다.",
  input: "HEX 입력을 켭니다. 칸 앞에 흐린 #, 투명도 칸 뒤에 %를 붙이고 값이 없으면 RRGGBB를 자리 표시로 둡니다. 6자리(alpha면 8자리)가 다 차면 값에 바로 반영하고, 확정은 Enter나 포커스 이탈 때 한 번 알립니다. #3B8 같은 짧은 형식은 그때 펼치고, 틀린 값은 되돌립니다.",
  clearable: "견본 맨 앞에 ‘색 없음’ 칸(흐린 사선)을 둡니다. 고르면 값이 null이 됩니다. HEX 칸을 비우고 확정해도 같습니다.",
  recentColors: "앱이 보관하는 최근 사용 색입니다. 문자열 또는 { value, label }이며, 주면 견본 아래 ‘최근 사용 색’ 줄(최대 8칸)을 그립니다. 견본에 이미 있는 색은 줄에서 빼고 그리며(앱 목록에는 남습니다), 남는 색이 없으면 줄을 그리지 않습니다. 두 줄이 함께 보이면 각각 캡션을 붙입니다. 새 값으로 패널을 닫을 때 다음 목록을 알리므로 앱이 저장해서 다시 넘겨 주세요. Vue는 v-model:recentColors입니다.",
  eyeDropper: "HEX 칸 앞에 화면에서 색을 고르는 스포이드 아이콘 버튼(채움 없음)을 둡니다. 브라우저에 EyeDropper가 있을 때(Chromium 데스크톱, Native는 RN Web)만 그리고 다른 곳에서는 그리지 않습니다. 고른 색은 바로 확정하고, alpha면 현재 투명도를 유지합니다.",
  inline: "트리거 없이 240px 패널을 페이지 흐름에 바로 놓습니다. 설정 화면처럼 늘 펼쳐 둘 때 씁니다. 떠 있는 레이어가 아니므로 테두리·그림자 대신 input 채움과 12px 모서리를 쓰고, 패널 이름은 FormGroup 라벨이나 ariaLabel입니다. open·size·placeholder·variant·renderTrigger는 쓰지 않습니다. 닫히지 않으므로 최근 사용 색은 고르기를 마칠 때마다(견본·손 뗌·HEX 확정) 앞으로 옮기고, 최근 줄에서 고른 색은 줄을 그대로 둡니다.",
  variant: "\"field\"(기본)는 Input 모양 트리거입니다. \"swatch\"는 툴바용으로 input 높이와 같은 정사각 버튼(sm 32·md 40·lg 48)에 색 칩만 둡니다. 이름은 ariaLabel과 현재 값으로 읽습니다.",
  icon: "variant=\"swatch\"와 함께 쓰는 아이콘 이름입니다. 주면 채움 없는 버튼에 아이콘과 그 아래 16×3px 색 막대를 그려 글자 색 같은 도구 버튼이 됩니다. hover와 열림 때만 채움이 생깁니다.",
  open: "제어할 때의 패널 열림 상태입니다.",
  defaultOpen: "제어하지 않을 때 처음부터 패널을 열어 둡니다.",
  size: "트리거 크기입니다. Input과 같은 sm·md·lg(32·40·48px)입니다.",
  placeholder: "값이 없을 때 트리거 문구입니다. 기본값은 ‘색 선택’입니다.",
  ariaLabel: "트리거 이름입니다. 현재 값(예: #3B82F6, 투명도 80%)을 이름 뒤에 붙여 읽습니다. FormGroup 안에서는 라벨이 이름을 정합니다.",
  error: "오류 상태를 표시하고 aria-invalid를 붙입니다.",
  disabled: "트리거를 비활성으로 두고 패널을 열지 않습니다.",
  readOnly: "값을 보여 주기만 하고 패널을 열지 않습니다. name이 있으면 폼 제출에는 포함됩니다.",
  id: "트리거 버튼의 ID입니다. 바깥 <label for>와 연결할 때 씁니다.",
  name: "폼 제출용 숨은 input의 이름입니다. 색 없음이면 빈 문자열을 제출합니다.",
  className: "바깥 요소에 더할 클래스입니다.",
  style: "바깥 요소에 더할 스타일입니다.",
  testID: "테스트에서 바깥 View를 찾는 ID입니다.",
  renderTrigger: "트리거 안 내용을 직접 그립니다. ({ value, open })를 받습니다. 버튼과 접근성 이름은 KJUN이 계속 맡습니다.",
};
const colorPickerCallback = (key) => key === "onRecentColorsChange"
  ? event("다음 최근 사용 색 목록을 알립니다.", "recentColors를 준 피커가 새 값으로 패널을 닫을 때. 그 값이 이미 맨 앞이거나 색 없음(null)이면 알리지 않습니다", "string[]: 새 값을 맨 앞에 둔 최대 8개의 #RRGGBB(alpha면 #RRGGBBAA)", "반환값을 사용하지 않습니다.", "앱이 목록을 저장하고 recentColors로 다시 넘깁니다. 여러 피커가 같은 목록을 함께 써도 됩니다.")
  : key === "onOpenChange"
  ? event("패널 열림 상태의 변경을 알립니다.", "트리거를 누르거나 바깥을 누르거나 Escape로 닫을 때", "boolean: 다음 열림 상태", "반환값을 사용하지 않습니다.", "제어할 때는 소비자가 open을 갱신합니다.")
  : key === "onValueChange"
    ? event("값 변경을 알립니다.", "드래그 중 움직일 때마다, 견본·키·HEX로 값이 바뀔 때. 값이 같으면 알리지 않습니다", "#RRGGBB(alpha면 #RRGGBBAA) 문자열 / null", "반환값을 사용하지 않습니다.", "제어할 때는 소비자가 value를 갱신합니다.")
    : event("한 번의 선택이 끝났음을 알립니다.", "드래그를 놓을 때, 견본·색 없음·최근 색을 고를 때, 영역·슬라이더 키를 누를 때, 스포이드로 고를 때, HEX·% 칸에서 Enter를 누르거나 칸을 떠날 때(입력 도중에는 알리지 않음). 값이 바뀐 경우만, 값 변경 알림 다음", "#RRGGBB(alpha면 #RRGGBBAA) 문자열 / null", "반환값을 사용하지 않습니다.", "저장처럼 한 번만 할 일을 여기서 하세요.");
const colorTriggerSlot = slot("트리거 안 내용을 직접 그립니다. 버튼과 접근성 이름은 KJUN이 맡습니다.", "{ value: string | null; open: boolean }");
const stepsSummaries = {
  items: "단계 목록입니다. 2개 이상이며 순서대로 그립니다. 각 항목은 key?(없으면 인덱스), label(단계 이름·축약형 제목), description?(세로 전용 설명), meta?(세로 전용, 시각 등. 숫자 글꼴), status?(이 단계의 상태: complete·current·error·upcoming. current로 정한 상태보다 우선합니다), disabled?(onStepSelect가 있어도 버튼으로 만들지 않습니다. 작업 중에 모든 단계를 잠글 때 씁니다)입니다. status는 순서대로 끝나지 않는 흐름에 씁니다. 예를 들어 지금 보는 단계 뒤에 이미 승인된 단계가 있으면 그 단계에 complete를 줍니다. 단계 사이 선은 양쪽 단계가 모두 도달했을 때만 강조 색으로 그립니다. 가로 라벨은 6자 안팎을 권장하며 어절 단위로 2줄까지 줄바꿈한 뒤 말줄임표로 줄입니다. 2개 미만이면 개발 모드에서 경고합니다.",
  current: "현재 단계의 번호(0부터)입니다. items 개수와 같으면 모든 단계가 완료입니다. 범위를 벗어난 값은 0~개수로 자르고 소수는 내림하며 NaN은 0으로 봅니다. 항목에 status를 주면 생략할 수 있고, 그때는 current·error로 표시한 첫 단계(없으면 complete가 아닌 첫 단계)를 현재 단계로 봅니다. 축약형 머리줄은 이 단계를 보여 줍니다.",
  currentStatus: "현재 단계의 상태입니다. active(기본)는 진행 중이고, error는 결제 실패·배송 실패처럼 막힌 상태로 danger 색과 느낌표로 그립니다. 모든 단계가 완료이면 무시합니다.",
  orientation: "배치 방향입니다. horizontal(기본)은 24px 번호 원과 아래 라벨, vertical은 12px 점과 오른쪽 제목·meta·description이며 마커 모양도 이것으로 정해집니다.",
  layout: "가로 전용입니다. auto(기본)는 컨테이너 폭이 단계 수×80px보다 좁거나 단계가 11개 이상이면 축약형(현재 라벨 · n / N · 다음)으로 바꾸고, full·compact는 어느 폭에서든 그 형태로 고정합니다. 세로에서는 무시합니다. 축약형에서는 단계를 선택할 수 없습니다.",
  selectable: "onStepSelect가 버튼으로 만드는 단계입니다. complete(기본)는 완료된 단계만 눌러 되돌아가게 하고, all은 현재 단계를 뺀 모든 단계(아직 가지 않은 단계 포함)를 눌러 앞으로 건너뛸 수도 있게 합니다. 축약형에서는 버튼을 만들지 않습니다.",
  ariaLabel: "목록의 접근성 이름입니다. 생략하면 Provider 언어의 ‘진행 단계’를 씁니다. 단계는 ‘1단계, 약관 동의, 완료’처럼 읽고 현재·오류 단계에 aria-current=\"step\"을 답니다.",
  className: "루트 목록에 더할 클래스입니다. 크기와 색은 앱 팔레트와 부모 폭으로 정하세요.",
  style: "루트에 더할 스타일입니다. 바깥 여백이나 폭 제한에 사용하세요.",
  id: "루트 목록의 ID입니다.",
  testID: "테스트에서 루트 View를 찾는 ID입니다.",
};
const listSectionBadge = slot("섹션 제목 바로 뒤에 붙이는 짧은 표시입니다(개수·새 항목).", "ReactNode", "KjunBadge count처럼 표시용 콘텐츠를 넣습니다. 제목 뒤 6px(ListRow 배지와 같은 간격)에 두고 제목 첫 줄 가운데에 맞추며, 제목 줄보다 큰 배지도 제목 높이를 늘리지 않습니다. 긴 제목은 배지 앞에서 줄바꿈합니다. 목록 이름은 제목과 배지 글자를 함께 읽고(\"최근 거래 12\"), 제목(heading) 자체는 제목 글자만 읽습니다. title이 없으면 그리지 않습니다.");
const listRoots = (name, platform) => ({
  id: { type: "string", summary: (name === "KjunListGroup" ? "루트 div" : "루트 section") + "의 id입니다." },
  className: { type: "string", summary: (name === "KjunListGroup" ? "루트(kjun-list-group)" : "루트(kjun-list-section)") + "에 더할 클래스입니다. 간격·모서리는 " + (name === "KjunListGroup" ? "variant" : "radius·density·KjunListGroup") + "로 정하세요." },
  style: { summary: (platform === "native" ? "루트 View에 더할 스타일입니다." : "루트에 더할 인라인 스타일입니다.") + " 바깥 여백이나 폭 제한에 쓰세요." },
  testID: { type: "string", summary: "테스트에서 루트 View를 찾는 ID입니다." },
});
const carouselAction = slot("제목 줄 끝, 이전·다음 버튼 앞에 놓는 행동입니다(예: \"전체 보기\" 버튼).", "ReactNode", "터치 화면에서는 이전·다음 버튼이 숨으므로 이 행동만 남습니다.");
const carouselSlides = slot("슬라이드 목록입니다. 직접 자식 하나가 슬라이드 하나입니다.", "ReactNode", "슬라이드 안의 버튼·입력도 Tab으로 이동할 수 있습니다. 안의 입력에서는 화살표 키를 가로채지 않습니다.");
const childProps = {
  prefix: slot("숫자 앞에 붙는 단위 장식입니다.", "제공 데이터 없음", "화면 장식으로만 쓰이며 읽기 문구와 범위 문구에는 붙지 않습니다. 글자만 필요하면 prefix prop을 쓰세요."),
  suffix: slot("숫자 뒤에 붙는 단위 장식입니다.", "제공 데이터 없음", "화면 장식으로만 쓰이며 읽기 문구와 범위 문구에는 붙지 않습니다. 글자만 필요하면 suffix prop을 쓰세요."),
  leading: slot("주 콘텐츠 앞쪽에 배치할 아이콘·이미지입니다.", "ReactNode", "ListRow에서는 기본 최소 40px 영역과 본문 간격 12px를 사용합니다. leadingSize를 지정하면 해당 정사각형 영역을 예약합니다. 아바타·이미지 자체 크기는 소비자가 지정하며 icon·iconColor·iconBackground는 무시합니다. 앞 영역에는 별도의 상호작용을 넣지 말고 actions에 배치하세요."),
  trailing: slot("행 뒤쪽의 보조 정보입니다.", "ReactNode", "수치·배지 등 표시용 콘텐츠만 넣으세요. 버튼은 actions로 분리합니다."),
  badge: slot("제목 바로 뒤에 붙이는 짧은 표시입니다(새 기능·베타·개수).", "ReactNode", "KjunBadge 같은 표시용 콘텐츠를 넣고, 제목 첫 줄 가운데에 맞춰 6px 뒤에 놓습니다. 긴 제목은 배지 앞에서 줄바꿈합니다. 화면 낭독기는 행 이름에서 제목 다음에 읽습니다(Native는 문자열·숫자일 때)."),
  actions: slot("주 콘텐츠와 분리된 보조 행동입니다.", "ReactNode", "버튼·Switch·Checkbox 등의 값과 콜백을 소비자가 연결합니다."),
  expanded: slot("펼친 동안 행 아래에 보이는 내용입니다.", "ReactNode", "제목이 시작하는 선에서 시작합니다. 버튼 바깥이므로 버튼·링크를 넣을 수 있습니다. 닫힌 동안에는 그리지 않습니다."),
  children: slot("영역 안에 배치할 소비자 콘텐츠입니다.", "ReactNode", "ListSection에는 ListRow를, BottomActionBar에는 Button·FormActions를 배치합니다."),
  empty: slot("행이 없을 때 행 자리에 표시할 내용입니다.", "ReactNode", "KjunEmpty 등 빈 상태를 넣습니다. 행이 하나라도 있으면 표시하지 않습니다."),
  loading: slot("행을 불러오는 동안 행(과 empty) 자리에 표시할 내용입니다.", "ReactNode", "KjunListSkeleton variant=\"row\"처럼 행 시작 여백을 스스로 가진 내용을 넣습니다. 감싸는 영역은 여백 없이 행처럼 가장자리까지 차지합니다. 불러오는 중임을 화면 낭독기에 알리려면 스켈레톤의 loadingText를 주세요(status로 읽음). 비우면 행이나 empty를 표시합니다."),
  footer: slot("행 아래 둘 보조 안내문입니다.", "ReactNode", "12px 3차 글자색으로 표시합니다. 둥근 섹션에서는 카드 밖 아래에 놓입니다."),
  fallback: slot("이미지가 없거나 실패했을 때 표시할 콘텐츠입니다.", "ReactNode", "실패해도 이미지 컨테이너의 비율과 대체 텍스트를 유지합니다."),
};
const listRowContent = slot("제목·설명 아래 같은 시작선에 놓는 표시용 내용입니다(예산·진행 막대, 보조 수치).", "ReactNode", "누르는 행에서는 행 버튼 안에 들어가므로 버튼·링크·입력을 넣지 마세요(웹 개발 모드 경고). 웹에서는 행의 설명(aria-describedby)으로 함께 읽지만 Native는 읽지 않으니, 꼭 들려야 할 금액·진행률은 ariaLabel에 넣으세요.");
const topNavigationSlots = {
  leading: slot("뒤로 가기 등 앞쪽 탐색 행동입니다.", "ReactNode", "가용 폭의 최대 40%를 사용합니다. 내부 Button의 긴 라벨은 한 줄 말줄임하며, ariaLabel로 전체 목적을 제공하세요."),
  actions: slot("화면의 보조 행동 묶음입니다.", "ReactNode", "제목의 120px 기준 폭을 확보하기 어려우면 묶음 전체를 다음 줄로 배치합니다. 긴 Button 문구는 영역 안에서 줄바꿈합니다. Button·MenuButton·RefreshButton·IconToggle의 아이콘은 24px이며 최소 44px 컨트롤 영역을 사용합니다."),
};
const numberInputSummaries = platform => ({
  format: { summary: "기본값 묶음을 고릅니다. number는 천 단위 쉼표·정수, amount는 같은 규칙에 앱이 suffix를 지정하는 금액, percent는 쉼표 없이 소수 1자리·음수 허용·\"%\"입니다. 동작은 갈라지지 않고 아래 개별 prop이 항상 프리셋을 덮습니다.", default: '"number"' },
  decimals: { summary: "소수 자릿수 상한(0~6의 정수)입니다. 확정할 때 이 자릿수까지 0으로 채웁니다(3.5 → 3.50). 생략하면 format 프리셋(number·amount 0, percent 1)을 씁니다." },
  grouping: { summary: "정수부에 천 단위 쉼표를 보입니다. 값에는 쉼표가 들어가지 않습니다. 생략하면 format 프리셋(percent만 false)을 씁니다." },
  allowNegative: { summary: "음수를 받습니다. 허용하면 텍스트 어디에 -가 있어도 음수로 보고, 허용하지 않으면 -를 무시합니다. 생략하면 format 프리셋(percent만 true)을 씁니다. 음수를 받는 입력은 웹 inputMode가 text, Native 키보드가 iOS는 numbers-and-punctuation, Android는 numeric입니다." },
  min: detail("허용하는 최솟값입니다.", { "동작": "편집 중에는 그대로 두고, 확정(blur·Enter)할 때 벗어나 있으면 오류 상태와 내장 문구(\"1,000원 이상 입력해 주세요\")를 보입니다. 앱이 value나 min·max를 바꿀 때도 바로 확인합니다. 값을 고치지 않으므로 거부는 앱이 정합니다. 편집 중 값이 범위로 돌아오면 오류를 바로 지웁니다. 오류 prop이나 FormGroup 오류가 있으면 그쪽이 우선합니다.", "FormGroup 안": "내장 문구는 FormGroup의 오류 자리에 표시되고, 그동안 도움말을 대신합니다." }),
  max: detail("허용하는 최댓값입니다.", { "동작": "min과 같습니다. 확정할 때 벗어나면 오류 상태와 내장 문구(\"100% 이하로 입력해 주세요\")를 보입니다." }),
  prefix: { summary: platform === "vue3" ? "숫자 앞에 붙는 글자입니다. 노드가 필요하면 prefix 슬롯을 씁니다." : "숫자 앞에 붙는 단위 장식입니다. 문자열이 아니면 화면 장식으로만 쓰고 내장 문구에는 붙지 않습니다." },
  suffix: { summary: platform === "vue3" ? "숫자 뒤에 붙는 글자입니다(예: \"원\", \"kg\"). 생략하면 format 프리셋(percent의 \"%\")을 씁니다. 노드가 필요하면 suffix 슬롯을 씁니다." : "숫자 뒤에 붙는 단위 장식입니다(예: \"원\", \"kg\"). 생략하면 format 프리셋(percent의 \"%\")을 씁니다. 문자열이면 읽기 문구와 범위 문구에도 붙습니다." },
  readingAid: { summary: "정수부가 1만 이상일 때 입력 바로 아래에 \"1억 2,003만 5,000 원\" 같은 읽기 문구를 보입니다. suffix가 문자열이면 공백 뒤에 붙고, percent에서는 꺼집니다. 한국어 메시지에서만 만들며 화면 낭독기에는 aria-describedby로만 연결해 입력 중 계속 읽지 않습니다. FormGroup 도움말은 이 문구 아래 줄입니다.", default: "false" },
  align: { summary: "숫자의 가로 정렬입니다. end는 숫자를 끝 쪽에 맞춥니다. 금액을 세로로 나열할 때 씁니다.", default: '"start"' },
  size: { summary: "KjunInput과 같은 크기(sm·md·lg)입니다. 높이·글자·모서리가 같습니다.", default: '"md"' },
  disabled: { summary: "입력을 막고 Tab 순서에서 뺍니다.", default: "false" },
  readOnly: { summary: "값을 보여 주기만 하고 바꾸지 않습니다. 초점은 받습니다.", default: "false" },
  error: { summary: "입력 영역을 오류로 표현합니다. 이 값이나 FormGroup 오류가 있으면 범위 밖 내장 문구보다 우선합니다.", default: "false" },
  id: { summary: "실제 입력의 ID입니다. 외부 라벨과 명시적으로 연결할 때 사용합니다. FormGroup 안에서는 FormGroup이 정합니다." },
  ariaLabel: { summary: "화면 낭독기가 읽는 이름입니다. 보이는 라벨이 없을 때 필요하며, FormGroup 라벨이 있으면 생략합니다." },
  placeholder: { summary: "값이 비었을 때 보이는 안내 문구입니다. 값을 대신하지 않습니다." },
  name: { summary: "폼 제출용 숨은 input의 이름입니다. 쉼표 없이 소수 자릿수를 채운 값(\"1250000\", \"12.50\")을 제출하고, 비활성이면 제출하지 않습니다." },
  className: { summary: "루트(kjun-number-input)에 더할 클래스입니다." },
  style: { summary: platform === "native" ? "루트 View에 더할 스타일입니다." : "루트에 더할 인라인 스타일입니다." },
});
const valueDescription = {
  KjunNumberInput: "정규화된 값 문자열입니다. 빈 값은 \"\", 예는 \"1250000\"·\"-3.5\"·\"12.50\"이며 그룹 구분 문자(쉼표)는 없습니다. 퍼센트는 보이는 그대로라 화면의 12.5%가 \"12.5\"입니다. 편집 중에 앱이 바꾸면 편집을 끝내고 그 값을 보이며, 초안과 같은 수(\"12.\"에 대한 \"12\")는 무시합니다.",
  KjunBottomNavigation: "현재 목적지의 key입니다. 실제 라우팅 결과에 따라 앱이 갱신합니다.",
  KjunFloatingNavigation: "현재 목적지의 key입니다. 실제 라우팅 결과에 따라 앱이 갱신합니다.",
  KjunSlider: "현재 숫자 값입니다. min~max 범위의 유한한 값을 전달합니다.",
  KjunRangeSlider: "순서가 있는 [시작 값, 끝 값] 숫자 쌍입니다. 시작 값은 끝 값보다 클 수 없습니다.",
  KjunColorPicker: "대문자 #RRGGBB(alpha면 #RRGGBBAA)이고 색 없음은 null입니다. 짧은 형식·소문자도 받아 정규화합니다.",
  KjunTimePicker: "분 단위는 HH:mm, 초 단위는 HH:mm:ss이며 비어 있으면 null입니다. 날짜·시간대는 포함하지 않습니다.",
  KjunQuantityStepper: "확정된 숫자 값입니다. 편집 중 문자열과 구분하며 소수 자릿수는 precision 이하여야 합니다. 범위 밖 값(재고가 줄어든 장바구니 수량)은 오류로 표시하되 버튼·입력은 그대로 쓸 수 있고, 누르거나 확정하면 범위 안으로 맞춥니다.",
};
const distributionRoot = {
  className: "루트에 더할 클래스입니다. 막대의 높이는 size로 정하세요.",
  style: "루트에 더할 스타일입니다. 바깥 여백이나 폭 제한에 사용하세요. 막대는 부모 폭을 채웁니다.",
  id: "루트의 ID입니다.",
};
const distributionSummaries = (platform) => ({
  KjunZoneGauge: {
    value: { type: "number | null", summary: "표식이 놓일 값입니다. null·undefined·숫자가 아닌 값은 데이터 없음입니다. 축과 구간 이름은 그대로 두고 구간 색과 표식만 뺍니다. 0은 실제 값입니다. 축을 벗어난 값은 가까운 끝에 붙습니다." },
    min: { default: "0", summary: "축의 시작 값입니다." },
    max: { default: "100", summary: "축의 끝 값입니다. min보다 커야 하며, 그렇지 않으면 축을 그리지 않습니다." },
    zones: { type: "{ to: number; label?: string; color?: " + (platform === "native" ? "ColorValue" : "string") + " }[]", ...detail("축을 나누는 구간 목록입니다.", { "항목 필드": "to: 구간이 끝나는 값(앞 구간의 끝 또는 min에서 시작), label?: 구간 이름, color?: 앱이 정하는 구간 색", "규칙": "to 순서로 정렬해 그리고 축 밖은 잘라 냅니다. 경계에 놓인 값은 위쪽 구간에 속합니다. 마지막 구간이 max에 닿지 않으면 나머지를 이름 없는 중립 구간으로 그립니다.", "색": "KJUN은 색을 정하지 않습니다. color가 없는 구간은 중립 트랙색(switch-track)입니다. 색만으로 구분하지 않도록 label을 함께 주세요." }) },
    label: { summary: "축 위에 보이는 이름입니다. 스크린리더가 가장 먼저 읽습니다." },
    ariaLabel: { summary: "보이는 label이 없거나 더 자세한 이름이 필요할 때의 접근성 이름입니다. 있으면 label 대신 읽습니다." },
    size: { type: '"sm" | "md"', default: '"md"', summary: "md는 10px, sm은 8px 트랙입니다. 표식은 트랙 위아래로 6px씩 더 나오고, 트랙은 표식 양옆 2px을 비워 어떤 배경 위에서도 표식이 구간 색과 떨어져 보입니다." },
    zoneLabels: { default: "true", summary: "구간 이름을 축 아래에 그립니다. 이름이 있는 구간이 하나도 없으면 그리지 않습니다." },
    showValue: { default: "true", summary: "이름 줄 끝에 값과 값이 속한 구간 이름을 보입니다(예: 72 · 고평가). false여도 스크린리더는 값을 읽고, 데이터가 없을 때의 missingText는 그대로 보입니다." },
    formatValue: { type: "(value: number) => string", ...detail("값의 표시 문구를 만듭니다.", { "인자와 반환": "(value: number) => string. 데이터가 없을 때는 호출하지 않습니다.", "기본": "생략하면 Provider locale의 숫자 표기(소수 둘째 자리까지)를 씁니다.", "접근성": "화면과 스크린리더에 같은 문구를 씁니다." }) },
    missingText: { default: '"—"', summary: "데이터가 없을 때 값 자리에 보일 문구입니다. 주면 스크린리더도 이 문구를 읽고, 생략하면 ‘데이터가 없습니다’를 읽습니다." },
    ...Object.fromEntries(Object.entries(distributionRoot).map(([key, summary]) => [key, { summary }])),
  },
  KjunStackedBar: {
    items: { type: "{ key?: string; label: string; value: number | null; color?: " + (platform === "native" ? "ColorValue" : "string") + " }[] | null", ...detail("전체를 이루는 항목 목록입니다.", { "항목 필드": "label: 항목 이름, value: 수치, color?: 앱이 정하는 항목 색, key?: 항목 순서가 바뀔 때 쓰는 고유 값", "비율": "KJUN이 수치로 정수 퍼센트를 계산하고 합이 100이 되게 맞춥니다. 음수는 0으로 세고, 값이 없는 항목은 계산에서 뺍니다.", "상태": "목록이 없거나 값이 모두 없으면 막대와 범례를 그리지 않습니다. 합이 0이면 빈 트랙을 그립니다. 0보다 큰 항목은 최소 4px로 그립니다.", "색": "KJUN은 색을 정하지 않습니다. color가 없는 항목은 중립 트랙색(switch-track)입니다." }) },
    label: { summary: "막대 위에 보이는 이름입니다. 스크린리더가 가장 먼저 읽습니다." },
    ariaLabel: { summary: "보이는 label이 없거나 더 자세한 이름이 필요할 때의 접근성 이름입니다. 있으면 label 대신 읽습니다." },
    valueText: { summary: "이름 줄 끝에 보일 앱의 요약 문구입니다(예: 20명 · 강세 우위). 스크린리더는 이름 다음에 읽습니다. 데이터가 없으면 이 자리에 missingText를 보입니다. 길면 말줄임합니다." },
    size: { type: '"sm" | "md"', default: '"md"', summary: "md는 10px, sm은 8px 트랙입니다." },
    legend: { default: "true", summary: "막대 아래에 항목별 색 칸·이름·수치·비율을 그립니다. 색만으로 구분하지 않게 하므로 끄면 앱이 같은 정보를 따로 보여 주세요. 꺼도 스크린리더는 항목을 모두 읽습니다." },
    formatValue: { type: "(value: number) => string", ...detail("항목 수치의 표시 문구를 만듭니다(예: 12명).", { "인자와 반환": "(value: number) => string. 값이 없는 항목에는 호출하지 않습니다.", "기본": "생략하면 Provider locale의 숫자 표기(소수 둘째 자리까지)를 씁니다.", "접근성": "범례와 스크린리더에 같은 문구를 씁니다." }) },
    missingText: { default: '"—"', summary: "데이터가 없을 때와 값이 없는 항목에 보일 문구입니다. 주면 스크린리더도 이 문구를 읽고, 생략하면 데이터가 없을 때 ‘데이터가 없습니다’를 읽습니다." },
    ...Object.fromEntries(Object.entries(distributionRoot).map(([key, summary]) => [key, { summary }])),
  },
});
const fileUploadSummaries = {
  files: "앱이 가진 파일 목록입니다. 각 항목은 id·name·size(바이트)·status(queued·uploading·done·error)와 선택적인 progress(0~100)·error(실패 문구)·previewUrl(썸네일)·type입니다. 비어 있으면 넓은 선택 영역을, 하나라도 있으면 목록과 추가 행을 그립니다.",
  accept: "<input accept>와 같은 규칙(.pdf, image/*, application/pdf)입니다. 고를 때의 사전 검사와 안내 문구의 형식 목록에 씁니다. 서버 검증을 대신하지 않습니다.",
  maxSize: "파일 하나의 최대 크기(바이트)입니다. 넘는 파일은 놓거나 고른 뒤 거부하고 이유를 알립니다.",
  maxFiles: "최대 개수입니다. files 길이와 비교해 남은 자리만큼 앞에서부터 받고, 다 차면 추가 행을 비활성으로 바꿉니다.",
  multiple: "false면 파일 하나만 다룹니다. 추가 행 대신 행에 바꾸기 버튼을 두고, 새로 고른 파일을 onSelect로 넘겨 앱이 교체합니다. 기본값 true입니다.",
  disabled: "고르기·끌어다 놓기와 행의 삭제·다시 시도를 막습니다.",
  hint: "선택 영역 둘째 줄 문구입니다. 생략하면 accept·maxSize·maxFiles로 ‘PDF, 이미지 · 파일당 20MB · 5개까지’처럼 만듭니다.",
  size: "빈 필드의 크기입니다. md(기본값)는 136px 높이의 넓은 선택 영역이고, compact는 파일이 있을 때의 추가 행과 같은 한 줄(56px, 카드 80px)입니다. 파일이 있으면 두 값의 모양이 같습니다.",
  trigger: "고르는 방법입니다. area(기본값)는 선택 영역·추가 행 전체가 버튼입니다. button은 안내 문구 줄 끝에 ‘파일 선택’(파일이 있으면 형식 안내 줄 끝에 ‘파일 추가’) 보조 버튼을 두고 그 버튼만 누를 수 있습니다. 끌어다 놓기는 카드 어디에서나 그대로 받습니다(웹). 카드를 넓게 누르게 하기 어려운 화면(댓글·채팅 첨부)에 씁니다.",
  layout: "파일을 보여 주는 모양입니다. list(기본값)는 행 목록이고, grid는 사진 첨부용 정사각형 타일입니다. 타일은 최소 72px에서 폭에 맞춰 열 수를 정하고 8px 간격으로 놓으며, 마지막에 추가 타일(maxFiles가 있으면 n/최대 개수)을 둡니다. 올리는 중이면 타일 아래쪽에 막대를, 실패하면 타일을 실패 면으로 덮고 다시 시도 버튼을 둡니다. 삭제 ×는 오른쪽 위 24px 원입니다. 파일 이름과 상태는 화면 낭독기에 읽힙니다.",
  id: "숨은 파일 입력의 ID입니다. 바깥 <label for>와 연결할 때 씁니다. FormGroup 안에서는 그룹 ID를 씁니다.",
  ariaLabel: "FormGroup 라벨이 없을 때 필드 묶음의 이름입니다.",
  ariaDescribedBy: "FormGroup의 도움말·오류에 더해 연결할 설명 ID입니다.",
  className: "루트 카드에 더할 클래스입니다.",
  style: "루트 카드에 더할 스타일입니다.",
};
const fileUploadCallbacks = {
  onSelect: event("고른 파일을 사전 검사한 결과를 알립니다.", "파일 선택 창에서 고르거나(웹), 카드에 놓거나(웹), onPick이 파일을 돌려줄 때(Native). 고른 파일이 없거나 취소하면 알리지 않습니다", "(accepted, rejected): 통과한 파일 배열(웹 File, Native KjunPickedFile)과 { file, reason: \"type\" | \"size\" | \"count\" } 배열", "반환값을 사용하지 않습니다.", "앱이 accepted를 files에 넣고 업로드를 시작합니다. 거부 이유는 KJUN이 추가 행 아래에 알립니다."),
  onRemove: event("행의 삭제를 요청합니다.", "행이나 타일의 ×를 누를 때. 대기·업로드 중인 파일의 ×는 ‘업로드 취소’로 읽힙니다", "string: 파일 id", "반환값을 사용하지 않습니다.", "앱이 files에서 빼고, 필요하면 전송 취소·서버 삭제를 합니다. 빠진 뒤 포커스는 다음 행의 ×, 없으면 이전 행, 그것도 없으면 추가 버튼으로 옮깁니다."),
  onRetry: event("실패한 파일의 재시도를 요청합니다.", "실패한 행의 다시 시도, 또는 머리의 다시 시도(실패한 행마다 한 번씩)", "string: 파일 id", "반환값을 사용하지 않습니다.", "앱이 status를 uploading으로 바꾸고 다시 보냅니다."),
  onPick: event("Native에서 앱의 파일 선택기를 엽니다.", "선택 영역·추가 행·바꾸기를 누를 때", "없음", "Promise<KjunPickedFile[] | null>: { name, size, type?, uri? } 배열, 취소면 null", "expo-document-picker 같은 선택기를 앱이 연결합니다. 패키지는 선택 라이브러리에 의존하지 않습니다."),
};
const fileUploadTypes = [fields("KjunUploadFile", "files의 항목입니다.", [["id", "string", "고유한 파일 id"], ["name", "string", "파일 이름"], ["size", "number", "바이트 크기"], ["status", "\"queued\" | \"uploading\" | \"done\" | \"error\"", "업로드 상태"], ["progress", "number | undefined", "uploading일 때 0~100. 없으면 막대가 불확정으로 움직입니다."], ["error", "string | undefined", "실패 행에 보일 문구. 두 줄까지 보이고 넘치면 말줄임합니다."], ["previewUrl", "string | undefined", "이미지 썸네일 주소. 불러오지 못하면 확장자를 보입니다."], ["type", "string | undefined", "MIME 형식"]])];
const splitPaneSummaries = {
  direction: "나누는 방향입니다. horizontal(기본값)은 패널을 좌우로, vertical은 상하로 둡니다. 상하 분할은 부모가 높이를 정해야 합니다.",
  sizeUnit: "크기 값의 단위입니다. ratio(기본값)는 경계를 뺀 공간에서 첫 패널이 차지하는 비율(0~1)이라 컨테이너가 커지면 함께 커집니다. px는 첫 패널의 픽셀이라 창 폭이 바뀌어도 사이드 목록이 같은 폭을 지킵니다. size·defaultSize와 크기 콜백 값이 모두 이 단위를 따릅니다.",
  size: "제어할 때 첫 패널의 크기입니다(sizeUnit 단위). 한계를 벗어난 값은 화면에서 가장 가까운 허용 크기로 그립니다.",
  defaultSize: "제어하지 않을 때의 처음 크기이자 손잡이를 두 번 누르면(접히지 않는 패널은 Enter도) 되돌아가는 크기입니다(sizeUnit 단위). 생략하면 공간의 절반입니다.",
  minSize: "[첫 패널, 둘째 패널]의 최소 크기(px)입니다. 기본값 [0, 0]입니다. 비율이나 maxSize와 부딪치면 최소 크기가 이기고, 컨테이너가 두 최소 크기의 합보다 좁으면 첫 패널의 최소 크기를 지킵니다.",
  maxSize: "[첫 패널, 둘째 패널]의 최대 크기(px)입니다. null은 제한 없음이며 기본값 [null, null]입니다.",
  ariaLabel: "경계 손잡이의 접근성 이름입니다(예: 메시지 목록 크기). 손잡이는 현재·최소·최대 크기를 백분율로 함께 알립니다.",
  disabled: "경계를 고정합니다. 손잡이는 포커스·키·끌기를 받지 않고 막대가 옅은 테두리색이 됩니다. 기본값 false입니다.",
  collapsible: "첫 패널을 접을 수 있게 합니다. 최소 크기와 접힌 크기의 중간보다 작게 끌면 접히고 다시 끌어 넓히면 펼쳐집니다. Enter는 접기와 펼치기를 오가고, Home은 접으며, 접힌 상태에서 증가 키는 접기 전 크기로 펼칩니다. 기본값 false입니다.",
  collapsedSize: "접힌 첫 패널이 남기는 크기(px)입니다. 기본값 0이면 패널이 사라지고 읽기·탭 순서에서도 빠집니다. 48처럼 주면 아이콘 레일이 남으며, 레일 내용은 앱이 collapsed 값을 보고 first에 그립니다.",
  collapsed: "제어할 때 첫 패널의 접힘 상태입니다. " + "접는 조작은 변경 요청을 보내고, 소비자가 이 값을 갱신해야 접힙니다.",
  defaultCollapsed: "제어하지 않을 때 접힌 채로 시작합니다. 기본값 false입니다.",
  className: "루트에 더할 클래스입니다. 패널 크기는 size·minSize·maxSize로 정하세요.",
  style: "루트에 더할 스타일입니다. 바깥 크기나 여백에 사용하세요. 루트는 부모의 폭과 높이를 채웁니다.",
  id: "루트의 ID입니다.",
};
const splitPaneSlots = {
  first: slot("첫 패널의 내용입니다. 좌우 분할에서는 시작 쪽, 상하 분할에서는 위쪽입니다.", "ReactNode", "패널은 내용이 넘치면 스스로 스크롤합니다. 크기는 이 패널을 기준으로 정합니다."),
  second: slot("둘째 패널의 내용입니다. 첫 패널과 경계를 뺀 나머지 공간을 채웁니다.", "ReactNode", "패널은 내용이 넘치면 스스로 스크롤합니다."),
};
const splitPaneCallbacks = {
  onSizeChange: event("첫 패널의 새 크기를 알립니다.", "끄는 동안 값이 바뀔 때마다, 화살표·Home·End·Enter로 옮길 때, 손잡이를 두 번 눌러 기본 크기로 돌릴 때", "number: 한계를 적용한 크기. ratio는 0~1 비율(소수 넷째 자리까지), px는 정수 픽셀", "반환값을 사용하지 않습니다.", "제어할 때는 소비자가 size를 갱신합니다. 갱신하지 않으면 경계는 움직이지 않습니다."),
  onChangeCommit: event("크기 조절이 끝났음을 알립니다.", "끌기를 놓거나 취소될 때 한 번, 키로 옮길 때마다 한 번. 값이 바뀌지 않았으면 발생하지 않습니다.", "number: 마지막 크기(sizeUnit 단위)", "반환값을 사용하지 않습니다.", "크기를 저장한다면 이 시점에 저장하세요. 저장과 복원은 소비자가 맡습니다."),
};
const callback = (name, key, platform) => {
  if (name === "KjunSplitPane" && key === "onCollapsedChange") return event("첫 패널을 접거나 펼치라는 요청입니다.", "끌어서 접힘 경계를 지날 때, Enter·Home·증가 키, 손잡이를 두 번 누를 때" + (platform === "native" ? ", 화면 낭독기의 활성화 동작" : ""), "boolean: 바뀔 접힘 상태", "반환값을 사용하지 않습니다.", "제어할 때는 소비자가 collapsed를 갱신합니다. 접힘 상태를 저장하려면 이 시점에 저장하세요.");
  if (name === "KjunSplitPane") return splitPaneCallbacks[key];
  if (name === "KjunNumberInput" && key === "onValueChange") return event("값 변경을 소비자에게 알립니다.", "편집할 때마다. 확정이나 Escape로 보이는 값이 바뀌면(3.5 → 3.50) 그 값도 한 번 더 알려 value가 늘 화면과 같습니다", "string: 그룹 구분 문자가 없는 값(\"\", \"1250000\", \"-3.5\")", "반환값을 사용하지 않습니다.", "소비자가 value를 갱신합니다. 편집 중 값은 소수 자릿수를 채우지 않은 상태입니다.");
  if (name === "KjunNumberInput" && key === "onChangeCommit") return event("편집이 확정됐음을 알립니다.", "blur 또는 Enter. 소수 자릿수를 채운 값으로, 값 변경 콜백 다음", "string: 소수 자릿수를 채운 값(\"12.50\")", "반환값을 사용하지 않습니다.", "저장·조회 등 확정이 필요한 작업에 쓰고, 범위 밖 값을 받아들일지는 앱이 정합니다.");
  if (key === "onOrderChange") return event("행을 옮긴 뒤의 새 순서를 알립니다.", "행의 위·아래 이동 버튼을 누를 때. 맨 위·맨 아래에서 더 갈 수 없는 방향과 reorderDisabled일 때는 발생하지 않습니다.", "(string | number)[]: 옮긴 뒤의 행 value 배열", "반환값을 사용하지 않습니다.", "소비자가 order를 갱신하고 그 순서로 행을 다시 그립니다. 갱신하지 않으면 행은 움직이지 않습니다. 저장도 소비자가 맡습니다.");
  if (key === "onReorder") return event("같은 이동을 자세히 알립니다.", "onOrderChange와 같은 시점", "{ value, from, to, order }: 옮긴 행의 value, 원래 위치와 새 위치(0부터), 새 순서", "반환값을 사용하지 않습니다.", "서버에 한 건의 이동만 보내는 식으로 쓸 때 사용합니다. order 갱신은 onOrderChange에서 합니다.");
  if (name === "KjunColorPicker") return colorPickerCallback(key);
  if (name === "KjunAvatarGroup") return event("그룹을 눌렀음을 알립니다.", "pressable이고 비활성이 아닌 그룹을 누르거나 Enter·Space로 실행할 때", platform === "native" ? "GestureResponderEvent" : "MouseEvent", "반환값을 사용하지 않습니다.", "전체 목록을 여는 등 다음 행동은 앱이 정합니다.");
  const changeWhen = name.includes("Slider") ? "드래그·트랙 선택·키보드·접근성 증감으로 실제 값이 바뀔 때" : name === "KjunTimePicker" ? "휠의 확인, 칸의 숫자 입력·↑↓, 지우기, inline 휠의 멈춤으로 완전한 시각이 바뀔 때" : "Enter·blur 확정 또는 증감 버튼으로 숫자가 바뀔 때";
  const arg = name === "KjunRangeSlider" ? "[시작 숫자, 끝 숫자]" : name === "KjunTimePicker" ? "HH:mm 또는 HH:mm:ss 문자열 / null" : "새 숫자";
  if (key === "onValueChange" && name === "KjunListSection") return event("고른 행 값의 변경을 요청합니다.", "value를 가진 행을 누를 때(single은 이미 고른 행을 누르면 알리지 않음)" + (platform === "vue3" ? "" : ", 행의 " + (platform === "native" ? "onPress" : "onClick") + "보다 먼저"), "single은 누른 행의 value, multiple은 그 행을 넣거나 뺀 새 배열", "반환값을 사용하지 않습니다.", "소비자가 섹션의 value를 갱신합니다. 갱신하지 않으면 선택 표시도 바뀌지 않습니다.");
  if (key === "onValueChange") return event("값 변경을 소비자에게 요청합니다.", changeWhen, arg, "반환값을 사용하지 않습니다.", "소비자가 value를 갱신합니다. 패키지가 업무 상태를 소유하지 않습니다.");
  if (key === "onChangeCommit") return event("변경 조작이 완료됐음을 알립니다.", name.includes("Slider") ? "포인터 조작 종료 또는 키보드 조작 완료 시, 값이 실제로 변경된 경우" : changeWhen + ", 값 변경 콜백 다음", arg, "반환값을 사용하지 않습니다.", "저장·조회 등의 후속 요청을 연결합니다. 값 변경 콜백과 같은 요청을 중복 실행하지 마세요.");
  if (key === "onInvalidInput") return event("숫자로 확정할 수 없는 입력을 알립니다.", "Enter·blur 시 공백·잘못된 문자열·안전한 숫자 범위 초과를 발견했을 때", "입력했던 원본 문자열", "반환값을 사용하지 않습니다.", "초안은 마지막 확정값으로 복원합니다. 오류 메시지는 소비자가 표시합니다.");
  if (key === "onReselect") return event("현재 목적지를 다시 눌렀음을 알립니다.", "선택된 목적지를 다시 누를 때(onNavigate 다음)", "(key, event): 목적지 key와 " + (platform === "native" ? "GestureResponderEvent" : "MouseEvent<HTMLAnchorElement>"), "목록을 맨 위로 올리거나 새로 고치는 데 씁니다.", "앱이 어떤 동작을 할지 정합니다.");
  if (key === "onNavigate") return event("목적지 이동을 요청합니다.", "비활성 목적지를 제외한 링크·탐색 항목을 실행할 때", "(key, event): 목적지 key와 " + (platform === "native" ? "GestureResponderEvent" : "MouseEvent<HTMLAnchorElement>"), "웹 라우터는 event.preventDefault()로 링크의 기본 이동을 취소할 수 있습니다.", "앱이 이동과 value 갱신을 담당합니다. 수정키·가운데 클릭은 일반 링크 동작을 유지하도록 앱에서 구분하세요.");
  if (key === "onRemove") return event("라벨 삭제를 요청합니다.", "활성 삭제 버튼을 실행할 때", "없음", "반환값을 사용하지 않습니다.", "소비자가 항목을 제거합니다. 제거 후 다음 칩의 ref로 focus()를 부르거나 입력으로 초점을 옮기세요.");
  if (key === "onLoad" || key === "onError") return event(key === "onLoad" ? "현재 이미지의 로드 완료를 알립니다." : "현재 이미지의 로드 실패를 알립니다.", "현재 요청 이미지에서 " + (key === "onLoad" ? "load" : "error") + "가 발생했을 때. 이전 주소·이전 요청의 응답은 무시합니다.", "없음", "반환값을 사용하지 않습니다.", "실패 대체 표현은 내부에서 표시합니다. 다른 주소로 재시도하려면 src/source를 갱신하세요.");
  if (key === "onClick" || key === "onPress") return event("목록 행의 주 행동을 실행합니다.", "비활성 행을 제외한 주 행동 영역을 실행할 때. actions의 버튼 실행과 독립적입니다.", platform === "native" ? "GestureResponderEvent" : "MouseEvent<HTMLElement>", "웹 링크의 기본 이동을 취소하려면 event.preventDefault()를 호출합니다.", "소비자가 이동·선택·실행을 처리합니다.");
  if (key === "onExpandedChange") return event("펼침 행의 다음 펼침 값을 알립니다.", "비활성 행을 제외하고 행 머리를 누를 때", "boolean: 반대로 바뀐 값", "반환값을 사용하지 않습니다.", "소비자가 expanded를 갱신합니다. 갱신하지 않으면 행은 그대로 있습니다.");
  if (key === "onCheckedChange") return event("스위치 행의 다음 켜짐 값을 알립니다.", "비활성 행을 제외하고 행 어디든 누를 때", "boolean: 반대로 바뀐 값", "반환값을 사용하지 않습니다.", "소비자가 checked를 갱신합니다. 갱신하지 않으면 스위치 표시는 그대로입니다.");
  if (key === "onIndexChange") return event("현재 슬라이드가 바뀌었음을 알립니다.", "스크롤이 멈춘 위치, 화살표 키, 이전·다음 버튼, 표시 점으로 다른 슬라이드에 도착할 때", "새 슬라이드 번호(0부터)", "반환값을 사용하지 않습니다.", "제어할 때는 소비자가 index를 갱신합니다. 갱신하지 않으면 표시 점은 index를 따르고 스크롤 위치는 사용자가 놓은 자리에 둡니다.");
  if (key === "onStepSelect") return event("단계를 골랐음을 알립니다.", "넓은 가로 배치나 세로 배치에서 버튼인 단계를 누르거나 Enter·Space를 누를 때. 기본은 완료된 단계만 버튼이고 selectable=\"all\"이면 예정 단계도 버튼입니다. 현재·오류 단계와 축약형에서는 발생하지 않습니다", "누른 단계의 번호(0부터)", "반환값을 사용하지 않습니다.", "앱이 어느 화면으로 돌아갈지 정하고 current를 갱신합니다. 이 컴포넌트는 current를 바꾸지 않습니다.");
  throw Error("Missing extension callback: " + name + "." + key);
};
const avatarGroupProps = platform => ({
  items: { type: "KjunAvatarGroupItem[]", ...detail("앞에서부터 그릴 사람 목록입니다.", { "항목 필드": "key: 고유 문자열, src?: 사진 주소, name?: 이름(첫 글자를 대신 그림), color?·textColor?: 첫 글자 바탕·글자 색(바탕 기본은 tertiary로, 그룹 뒤 secondary 카드와 한 단계 다름), fallback?: 첫 글자 대신 그릴 내용, onLoad?·onError?: 사진 로드 완료·실패 알림" + (platform === "vue3" ? "(KjunAvatar의 fallback slot과 load·error 이벤트에 연결)." : ", 그 밖의 KjunAvatar 속성. size·shape·alt·decorative는 그룹이 정합니다."), "읽기": "각 아바타는 낭독되지 않고 그룹 이름 하나로 읽힙니다." }) },
  max: { default: "4", summary: "그릴 아바타의 최대 수입니다. 넘는 사람은 \"+N\" 칩으로 모으며, 칩은 이 수에 들어가지 않습니다. 1보다 작은 값은 1로 봅니다." },
  total: detail("전체 인원입니다. 서버가 일부 사람만 보낼 때 줍니다.", { "기본": "생략하면 items의 수입니다. items보다 작으면 items의 수를 씁니다.", "+N": "total에서 그린 수를 뺀 값이 \"+N\"이 되고, 100 이상은 \"+99\"로 줄여 보이며 그룹 이름에는 실제 인원을 읽습니다. xs·sm은 세 글자가 원에 들어가지 않아 \"+\" 없이 \"99\"로 표시합니다." }),
  size: { type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', summary: "KjunAvatar와 같은 크기입니다. 원형이 겹치는 폭은 xs 6, sm 8, md 12, lg 16, xl 20px입니다." },
  shape: { type: '"circle" | "square"', default: '"circle"', summary: "circle은 겹쳐 놓고 배경색 링으로 경계를 오립니다. square는 겹치지 않고 크기별 2·4·4·6·8px 간격을 둡니다." },
  ariaLabel: { summary: "그룹을 읽는 하나의 이름입니다(예: \"참여자 128명\"). 생략하면 인원 수(\"3명\")를 읽습니다." },
  ringColor: { type: platform === "native" ? "ColorValue" : "string", summary: "원을 서로 오려 내는 2px 링의 색입니다. 그룹이 놓인 바탕색과 같게 둡니다. 생략하면 표면색(surface)입니다. square에서는 쓰지 않습니다." },
  pressable: { default: "false", summary: "그룹 전체를 하나의 버튼으로 만듭니다(전체 목록 열기 등). " + (platform === "native" ? "onPress" : platform === "vue3" ? "click 이벤트" : "onClick") + "로 받으며, 포인터를 올리거나 누르면 각 아바타 위에 옅은 덧칠이 생기고 누르면 카드처럼 0.99로 줄어듭니다. 터치에서는 그룹 크기를 그대로 두고 누르는 영역만 44px로 넓힙니다. false면 포커스를 받지 않는 이미지입니다." },
  disabled: { default: "false", summary: "pressable 그룹의 누름을 막고 흐리게 그립니다. 포커스도 받지 않습니다." },
  className: { summary: "루트(div 또는 button)에 KJUN 클래스 뒤로 더할 클래스입니다. 바깥 여백·배치에 씁니다." },
  style: { summary: "루트에 더할 스타일입니다. 바깥 여백·배치에 쓰고, 겹침·크기는 size·shape로 정하세요." },
  id: { summary: "루트(div 또는 button)의 id입니다. ref도 같은 루트를 가리킵니다." },
  "aria-describedby": { summary: "그룹을 더 설명하는 글의 id입니다(예: 아직 응답하지 않은 사람 안내). 그룹 이름 뒤에 읽힙니다." },
});
export const extensionContracts = Object.fromEntries(Object.entries(bindings).map(([name, platforms]) => [name, Object.fromEntries(Object.entries(platforms).map(([platform, keys]) => {
  const props = Object.fromEntries(keys.map(key => {
    let entry;
    if (name === "KjunAvatarGroup" && avatarGroupProps(platform)[key]) entry = avatarGroupProps(platform)[key];
    else if (name === "KjunZoneGauge" || name === "KjunStackedBar") {
      entry = distributionSummaries(platform)[name][key];
      if (!entry) throw Error("Missing extension prop description: " + name + "." + key);
      entry = { ...entry };
    }
    else if (name === "KjunFileUpload") {
      entry = key.startsWith("on") ? fileUploadCallbacks[key] : fileUploadSummaries[key] ? { summary: fileUploadSummaries[key] } : undefined;
      if (!entry) throw Error("Missing extension prop description: " + name + "." + key);
    }
    else if (name === "KjunEventCalendar") entry = eventCalendarProp(key, platform);
    else if (name === "KjunSplitPane") {
      entry = key.startsWith("on") ? callback(name, key, platform) : splitPaneSlots[key] ?? (splitPaneSummaries[key] ? { summary: splitPaneSummaries[key] } : undefined);
      if (!entry) throw Error("Missing extension prop description: " + name + "." + key);
    }
    else if (name === "KjunColorPicker" && key.startsWith("on")) entry = colorPickerCallback(key);
    else if (name === "KjunColorPicker" && key === "renderTrigger") entry = detail(colorPickerSummaries.renderTrigger, { "인자와 반환": "({ value: string | null; open: boolean }) => ReactNode", "접근성": "버튼과 이름(라벨, 현재 값)은 KJUN이 그대로 맡으므로 그린 내용에 같은 문구를 다시 읽히지 않게 aria-hidden을 주세요." });
    else if (name === "KjunColorPicker" && colorPickerSummaries[key]) entry = { summary: colorPickerSummaries[key] };
    else if (name === "KjunNumberInput" && numberInputSummaries(platform)[key]) entry = { ...numberInputSummaries(platform)[key] };
    else if (name === "KjunSteps" && !key.startsWith("on") && stepsSummaries[key]) entry = { summary: stepsSummaries[key] };
    else if (name === "KjunImage" && imageSummaries[key]) entry = { summary: imageSummaries[key] };
    else if (name === "KjunCarousel" && carouselSummaries[key]) entry = { summary: carouselSummaries[key] };
    else if (name === "KjunCarousel" && key === "children") entry = carouselSlides;
    else if (name.endsWith("Slider") && key === "marks") entry = { type: "boolean | { value: number; label?: string }[]", ...detail("트랙 위 눈금입니다.", { "값": "true면 step마다 4px 점을 찍습니다(24개 이하일 때, 넘으면 개발 콘솔에 한 번 경고). 배열이면 그 값마다 점을 찍고 label이 있는 점은 트랙 아래(세로는 오른쪽)에 12px 라벨을 둡니다. 최솟값·최댓값은 트랙 끝이라 점 없이 라벨만 두고, 라벨은 트랙 끝에 맞춥니다. 라벨을 누르면 가까운 손잡이가 그 값으로 이동하고 확정됩니다.", "표시": "채움 구간 위의 점은 손잡이 색, 나머지는 3차 글자색입니다. 눈금은 장식이며 값과 조작은 그대로입니다." }) };
    else if (name.endsWith("Slider") && key === "orientation") entry = { type: '"horizontal" | "vertical"', default: '"horizontal"', ...detail("트랙 방향입니다.", { "세로": "아래가 최솟값, 위가 최댓값이며 위아래 화살표로 조절합니다. 라벨·값은 트랙 위에 가운데 정렬하고, 눈금 라벨은 트랙 오른쪽에 둡니다. 길이는 length(기본 160px)입니다." }) };
    else if (name.endsWith("Slider") && key === "length") entry = { type: "number", default: "160", summary: "세로 슬라이더의 트랙 길이(px)입니다. 가로 슬라이더는 부모 폭을 채우므로 무시합니다." };
    else if (key === "formatRange") entry = { type: "(start: number, end: number) => string", ...detail("범위 전체의 표시 문구를 만듭니다.", { "예": "(s, e) => `${s / 10000}만~${e / 10000}만 원`처럼 단위를 한 번만 쓰거나 최댓값일 때 \"이상\"을 붙입니다.", "접근성": "각 손잡이가 읽는 값은 formatValue(또는 기본 숫자 서식)를 그대로 씁니다." }) };
    else if (name.endsWith("Slider") && sliderSummaries[key]) entry = { ...sliderSummaries[key] };
    else if (name.endsWith("Slider") && key === "size") entry = { type: '"sm" | "md"', default: '"md"', summary: "sm은 12px 라벨·값, 4px 트랙, 16px 손잡이입니다. 누름 영역은 크기와 상관없이 44px입니다." };
    else if (key === "formatValue") entry = detail("각 손잡이의 숫자를 표시 문자열로 바꿉니다.", { "인자와 반환": "(value: number) => string. RangeSlider는 시작·끝 값에 각각 적용합니다. 생략하면 Provider 언어의 숫자 서식(예: 980,000)에 min·step의 소수 자릿수를 맞춰 씁니다(step 0.5면 1.0·1.5).", "접근성": "화면 출력과 " + (platform === "native" ? "accessibilityValue.text" : "aria-valuetext") + "에 같은 문자열을 사용합니다. showValue=false여도 접근성 값 설명은 유지합니다.", "상태 책임": platform === "vue3" ? "modelValue와 update:modelValue·change 이벤트는 숫자 형식을 유지합니다." : "value와 onValueChange·onChangeCommit 콜백은 숫자 또는 숫자 쌍 형식을 유지합니다." });
    else if (name === "KjunChip" && platform === "native" && chipNative[key]) entry = { ...chipNative[key] };
    else if (name === "KjunChip" && chipRoot[key]) entry = { ...chipRoot[key] };
    else if (key.startsWith("on")) entry = callback(name, key, platform);
    else if (name === "KjunTopNavigation" && topNavigationSlots[key]) entry = topNavigationSlots[key];
    else if (name === "KjunListRow" && key === "children") entry = listRowContent;
    else if (name === "KjunListSection" && key === "badge") entry = listSectionBadge;
    else if ((name === "KjunListSection" || name === "KjunListGroup") && ["id", "className", "style", "testID"].includes(key)) entry = { ...listRoots(name, platform)[key] };
    else if (name === "KjunListRow" && key === "selected") entry = detail("하나를 고르는 목록의 선택지입니다.", { "표시": "true면 행 끝에 강조색 체크를 그립니다. open 섹션에서는 고르지 않은 행에 빈 원을, 고른 행에 채운 체크와 selectedBg 면을 그리고, multiple 섹션에서는 행마다 체크칸을 그립니다. 누를 수 있는 행에 selected(true·false)를 주면 모든 플랫폼에서 radio로 읽히고 고른 행이 checked입니다. 고른 값은 앱이 관리합니다." });
    else if (name === "KjunListRow" && (key === "titleLines" || key === "descriptionLines")) entry = { summary: (key === "titleLines" ? "제목" : "설명") + "을 이 줄 수까지만 보이고 넘치면 말줄임표로 줄입니다. 생략하면 모두 줄바꿈합니다." };
    else if (name === "KjunListRow" && key === "checked") entry = detail("행 전체를 스위치로 만듭니다.", { "동작": platform === "vue3" ? "v-model:checked로 연결합니다. 행 어디를 눌러도 update:checked로 반대 값을 알리고, 행 끝 스위치는 장식입니다. 행이 switch 역할과 checked 상태를 가집니다." : "행 어디를 눌러도 onCheckedChange로 반대 값을 알리고, 행 끝 스위치는 장식입니다. 행이 switch 역할과 checked 상태를 가집니다." });
    else if (name === "KjunListSection" && key === "headingLevel") entry = detail("섹션 제목의 제목 수준입니다.", { "값": "2·3·4 중 하나이며 기본 3입니다. 페이지의 제목 구조에 맞춰 화면 낭독기의 제목 탐색 순서를 정합니다. Native는 Native Web에서 aria-level로 알리고, 기기에는 제목 역할만 있습니다." });
    else if (name === "KjunListGroup" && key === "variant") entry = { type: '"inset" | "flush" | "open"', ...detail("섹션을 쌓는 모양입니다.", { "값": "inset(기본)은 행을 lg 모서리 카드로 묶고 24px 띄우며, 제목·설명·actions·footer는 카드 밖에 둡니다. 카드는 면 색만 쓰므로 앱이 background와 surface를 다르게 줄 때 경계가 보입니다. flush는 직각 섹션을 8px 간격으로 쌓습니다. open은 모든 섹션을 열린 목록(섹션 variant의 open)으로 그리고 20px 띄웁니다.", "섹션 설정": "섹션에 radius나 variant를 직접 주면 그 값이 우선합니다." }) };
    else if (name === "KjunListSection" && key === "variant") entry = { type: '"default" | "open" | "details"', ...detail("행을 그리는 모양입니다.", { "default": "기본값입니다. 행을 구분선으로 나누고, radius나 그룹 inset이면 카드로 묶습니다.", "details": "누르지 않고 읽는 항목·값 목록입니다(\"결제 수단 / 신한카드\"). 행은 32px(위아래 6), 목록 위아래에 10을 더해 카드 안쪽 여백 16을 맞추고, 구분선은 기본으로 그리지 않습니다. 라벨(title)은 보조 색 본문체(14/20/400)로 최대 40% 폭에서 줄바꿈하고, 값(trailing)은 글자색 14/20/500으로 남은 폭을 모두 씁니다. 짧은 값은 끝선에 붙고, 줄바꿈하는 값은 시작에서부터 읽힙니다. 라벨과 값은 첫 줄 기준선에 맞춥니다. 누르는 행을 넣으면 개발 모드에서 한 번 경고하고, density는 쓰지 않습니다.", "open": "카드와 구분선 없이 여백으로 묶는 열린 목록입니다. 행은 최소 64px(compact 56px), 제목 16px, 설명 14px이고, 기본 아이콘은 40px 둥근 사각형 위에 그립니다(배경색은 iconBackground, 생략하면 secondary, destructive면 dangerBg). 호버·눌림·고른 행의 면은 양옆 4px 안쪽의 16px 둥근 면입니다.", "선택 표시": "open에서는 선택지 행 끝에 빈 원(multiple은 둥근 사각형)을 그리고, 고른 행은 강조색으로 채운 체크와 selectedBg 면으로 표시합니다. default의 single은 고른 행 끝에만 체크를 그리고, multiple은 open처럼 체크칸을 그립니다(면은 칠하지 않음).", "구분선": "open은 구분선을 그리지 않습니다. divider를 직접 true로 주면 개발 모드에서 한 번 경고합니다.", "생략": "KjunListGroup의 variant가 open이면 open, 아니면 default입니다. details는 섹션에 직접 줄 때만 적용됩니다. open이면 radius는 쓰지 않습니다." }) };
    else if (name === "KjunListSection" && key === "selectionMode") entry = { type: '"none" | "single" | "multiple"', default: '"none"', ...detail("행이 고르는 선택지인지, 몇 개를 고르는지 정합니다.", { "single": "선택지 행들이 한 묶음이 됩니다. 목록이 radiogroup이 되어 섹션 제목·설명을 묶음 이름·설명으로 읽고, 웹" + (platform === "native" ? "(Native Web)" : "") + "에서는 Tab 정지가 선택된 행 하나이고 화살표 키로 다음 행으로 옮기며 고릅니다(비활성 행은 건너뜀).", "multiple": "선택지 행마다 checkbox로 읽고 행 끝에 체크칸(둥근 사각형)을 그려, 고른 칸은 강조색으로 채웁니다. 행마다 Tab 정지가 있고 Space·Enter로 넣고 뺍니다.", "선택지 행": "selected(true·false)를 준 누를 수 있는 행, 또는 섹션 " + (platform === "vue3" ? "v-model" : "value") + "과 함께 value를 준 행입니다. none인 섹션에 선택지 행을 두면 개발 모드에서 경고합니다.", "상태 책임": "선택 값은 앱이 소유합니다. 섹션 " + (platform === "vue3" ? "v-model" : "value·onValueChange") + "로 연결하거나, 행마다 selected와 " + (platform === "native" ? "onPress" : "onClick") + "로 연결하세요." }) };
    else if (name === "KjunListSection" && (key === "value" || key === "modelValue")) entry = { type: "string | number | null | (string | number)[]", ...detail("고른 행들의 value입니다" + (platform === "vue3" ? "(v-model)." : "."), { "값 형태": "selectionMode single은 값 하나(아무것도 고르지 않았으면 null), multiple은 배열입니다. 생략하면 섹션이 선택을 다루지 않고 행의 selected를 그대로 씁니다.", "행 연결": "value가 같은 행이 selected가 되고, 누르면 " + (platform === "vue3" ? "update:modelValue" : "onValueChange") + "로 다음 값을 알립니다. 이때 행의 selected는 무시합니다." }) };
    else if (name === "KjunListRow" && key === "busy") entry = detail("행의 마지막 누름을 아직 처리하는 중입니다.", { "동작": "true인 동안 누름을 무시하고, 화면 낭독기에 처리 중(" + (platform === "native" ? "busy 상태" : "aria-busy") + ")으로 알립니다. 포커스와 역할은 그대로 남아 Tab으로 닿습니다. 스위치 행은 KjunSwitch의 loading처럼 손잡이 안에 스피너를 그리고, 다른 누르는 행은 선택 표시·체크·chevron 자리에 같은 크기의 스피너를 그립니다. 링크 행은 이동하지 않으며 hover·눌림 면도 칠하지 않습니다.", "사용": "저장처럼 시간이 걸리는 토글은 요청을 보내며 busy를 켜고, 끝나면 " + (platform === "vue3" ? "checked" : "checked") + "를 결과 값으로 바꾸고 busy를 끕니다. 행 모양과 높이는 바뀌지 않습니다." });
    else if (name === "KjunListRow" && key === "value") entry = { type: "string | number", summary: "선택을 소유한 섹션(" + (platform === "vue3" ? "v-model" : "value") + ") 안에서 이 행이 나타내는 값입니다. 섹션 값에 들어 있으면 selected로 그리고, 누르면 섹션이 다음 값을 알립니다." };
    else if (name === "KjunListRow" && key === "current") entry = detail("지금 열린 항목을 표시합니다(목록 옆에 열린 메시지, 보고 있는 설정 화면).", { "표시": "행을 selectedBg 면으로 칠합니다. hover·눌림 면은 그 위에 그대로 보이고 chevron과 높이는 바뀌지 않습니다.", "접근성": platform === "native" ? "Native Web에서는 aria-current(링크 행은 page, 다른 행은 true)를, 기기에서는 selected 상태를 줍니다." : "링크 행은 aria-current=\"page\", 다른 행은 aria-current=\"true\"를 가집니다.", "주의": "스위치(checked)·선택(selected) 행은 자기 상태가 있으므로 current를 무시하고 개발 모드에서 경고합니다. 고르는 목록은 selected나 섹션의 selectionMode를 쓰세요." });
    else if (name === "KjunListRow" && (key === "target" || key === "rel") && platform === "native") entry = { summary: (key === "target" ? "Native Web 링크 행이 열리는 곳입니다(예: \"_blank\"는 새 탭). 새 탭에는 rel을 주지 않아도 noopener noreferrer가 붙습니다." : "Native Web 링크의 rel입니다. 생략하면 target=\"_blank\"일 때 noopener noreferrer를 씁니다.") + " 기기에서는 쓰지 않습니다." };
    else if (name === "KjunListRow" && key === "href" && platform === "native") entry = { summary: "Native Web에서 이동할 링크 주소입니다. 기기에서는 href로 이동하지 않으므로 onPress에서 앱 라우터로 이동하세요. 기기에서 onPress 없이 href만 주면 개발 모드에서 경고합니다." };
    else if (name === "KjunListSection" && key === "titleVariant") entry = detail("섹션 제목 모양을 고릅니다.", { "값": "title은 16px 제목, label은 행 위의 작은 라벨입니다. 생략하면 설명이 있는 제목은 title, 없는 제목은 label입니다." });
    else if (name === "KjunListRow" && key === "icon") entry = detail("앞쪽 열에 그릴 아이콘 이름입니다.", { "기본": "leadingSize·iconBackground를 생략하면 24px 열에 20px 아이콘을 그립니다. 본문 간격은 12px입니다. 기본색은 textSecondary이고 destructive면 danger입니다. open 섹션에서는 40px 둥근 사각형 위에 text 색 20px 아이콘을 그립니다.", "크기·색": "leadingSize로 영역과 아이콘 크기를 함께 고르고 iconColor·iconBackground로 앱의 색상을 지정합니다.", "leading과 함께": platform === "vue3" ? "leading 슬롯이 있으면 슬롯을 그립니다." : "leading이 있으면 leading을 그립니다." });
    else if (name === "KjunListRow" && key === "leadingSize") entry = { type: '"xs" | "sm" | "md" | "lg"', ...detail("앞쪽 정사각형 영역과 기본 아이콘의 크기입니다.", { "크기": "xs 24/16px, sm 32/20px, md 40/24px, lg 56/28px(영역/아이콘). 구분선은 크기에 맞춘 본문 시작선에서 시작합니다.", "생략": "배경이 있는 기본 아이콘은 sm, 배경 없는 아이콘은 기존 24px 열·20px 아이콘, 커스텀 leading은 최소 40px입니다. 명시한 xs는 24/16px로 기존 기본값과 다릅니다.", "커스텀 leading": "배치 영역만 정합니다. 콘텐츠 자체 크기는 소비자가 맞추고, 아이콘 색상·배경은 적용하지 않습니다.", "높이": "행은 콘텐츠에 맞춰 커집니다. 설명이 길어도 앞 영역을 첫 제목·설명 줄에 맞추며 큰 leading이 잘리지 않습니다." }) };
    else if (name === "KjunListRow" && key === "iconColor") entry = { type: platform === "native" ? "ColorValue" : "string", summary: "기본 아이콘의 앱 소유 색상입니다. 지정하면 기본 textSecondary·destructive의 danger보다 우선하며 제목 색상은 바꾸지 않습니다. 생략하면 기존 색상 규칙을 유지합니다. 커스텀 leading에는 적용하지 않습니다." };
    else if (name === "KjunListRow" && key === "iconBackground") entry = { type: platform === "native" ? "ColorValue" : "string", ...detail("기본 아이콘 뒤의 원형 배경 색상입니다.", { "기본": "생략하면 배경이 없습니다. 색상을 지정하고 leadingSize를 생략하면 sm(지름 32px·아이콘 20px)을 사용합니다.", "색상": "색상은 앱이 제공합니다. 패키지가 팔레트나 색상 대비를 자동으로 선택하지 않으므로 iconColor와 함께 읽기 좋은 조합을 지정하세요.", "범위": "icon이 없거나 커스텀 leading이 있으면 적용하지 않습니다. 배경은 장식이며 행의 클릭·키보드·접근성 동작은 같습니다." }) };
    else if (childProps[key]) entry = childProps[key];
    else if (key === "value" || key === "modelValue") entry = detail(valueDescription[name], { "상태 책임": guides[name].interaction });
    else if (key === "items") entry = detail("안정적인 key와 이름을 가진 목적지 목록입니다.", { "항목 필드": "key: 고유 문자열, label: 전체 이름, href: 웹 링크 주소, icon?: 아이콘 이름, badge?: 문자열·숫자·true(점), disabled?: 이동 비활성. 99보다 큰 숫자는 99+로 표시하고 접근성 이름에는 실제 값을 읽습니다. 웹에서는 href를 제공하세요.", "권장 사용": "2~5개의 주요 목적지를 권장합니다. 항목 순서와 현재 key는 앱에서 관리합니다." });
    else if (key === "thumbLabels") entry = { default: '["최솟값", "최댓값"]', ...detail("시작·끝 손잡이의 접근성 이름 쌍입니다.", { "키보드": "Tab 순서는 시작→끝으로 고정됩니다. 손잡이는 서로 넘지 않으며 Home/End도 다른 손잡이 값으로 제한됩니다." }) };
    else if (key === "precision") entry = name === "KjunTimePicker" ? detail("minute는 시·분, second는 시·분·초를 제공합니다.", { "값 형태": "정밀도를 바꿀 때 소비자가 value 형식도 함께 바꾸거나 null로 초기화하세요." }) : detail("수량의 소수 자릿수입니다. 0~6의 정수를 받습니다.", { "반올림": "Enter·blur 시 지정 자리로 반올림합니다. 정확히 절반이면 절댓값이 커지는 방향이며 이후 min/max로 제한합니다.", "설정 제약": "value·min·max·step은 precision으로 표현 가능해야 하며 정수 스케일 값은 Number.MAX_SAFE_INTEGER 범위여야 합니다." });
    else if (["min", "max", "step"].includes(key)) entry = detail(name === "KjunTimePicker" ? (key === "min" ? "선택할 수 있는 가장 이른 시각입니다." : "선택할 수 있는 가장 늦은 시각입니다.") : key === "step" ? (name === "KjunQuantityStepper" ? "버튼과 방향키의 증감 단위입니다. 버튼을 길게 누르면 0.4초 뒤부터 0.1초마다 반복하고 범위 끝에서 멈춥니다. 직접 입력은 배수로 강제하지 않습니다." : "최솟값부터 시작하는 선택 간격입니다. 소수 여섯 자리까지 지원합니다.") : key === "min" ? "허용하는 최솟값입니다." : "허용하는 최댓값입니다.", { "범위": name === "KjunTimePicker" ? "precision과 같은 형식으로 전달하고 min ≤ max여야 합니다. 자정을 넘는 범위는 지원하지 않습니다." : name === "KjunQuantityStepper" ? "min ≤ max이고 step > 0이어야 합니다. 범위를 벗어난 직접 입력은 확정할 때 제한합니다." : "min < max, step > 0이어야 합니다. max가 step에 맞지 않으면 max 이하의 마지막 단계를 사용합니다." });
    else if (name === "KjunListRow" && key === "expanded") entry = detail("행이 자기 내용을 펼치게 합니다.", { "동작": platform === "vue3" ? "v-model:expanded로 연결합니다. 행 머리가 버튼이 되어 누르면 update:expanded로 반대 값을 알리고, 내용은 expanded 슬롯에 넣습니다." : "행 머리가 버튼이 되어 누르면 onExpandedChange로 반대 값을 알립니다. 내용은 expandedContent에 넣습니다.", "표시": "끝에 아래 방향 꺾쇠가 붙고 펼치면 위로 뒤집힙니다. 내용은 같은 행 안, 제목이 시작하는 선에서 열립니다. hover·누름 배경은 행 머리에만 깔립니다.", "함께 쓰지 않는 것": "href·checked·selected·chevron. 함께 주면 그쪽 역할이 우선하고 개발 모드에서 경고합니다." });
    else if (name === "KjunBottomActionBar" && key === "variant") entry = { type: '"docked" | "floating"', default: '"docked"', ...detail("바의 모양입니다.", { "floating": "화면 가장자리에서 떨어진 알약 모양입니다. KjunFloatingNavigation과 같은 띄움·여백·테두리·그림자를 씁니다. 설명과 작업은 항상 한 줄에 놓이고 긴 설명은 말줄임합니다. 설명이 없으면 글자가 있는 버튼들이 폭을 나눠 채웁니다.", "버튼": "size를 주지 않은 버튼은 lg, 모양은 알약이 되어 바 높이가 60px입니다. 작업은 두세 개까지 권합니다.", "배치": "바는 화면 맨 아래 자리를 그대로 차지하고 둘레만 투명합니다. 내용 위에 겹쳐 띄우려면 앱이 배치합니다. surface는 이 모양에서 효과가 없습니다." }) };
    else if (name === "KjunQuantityStepper" && key === "name") entry = { summary: "폼 제출용 숨은 input의 이름입니다. 확정된 value를 제출하고, 비활성이면 제출하지 않습니다." };
    // Described below with the other TimePicker props.
    else if (name === "KjunTimePicker" && (key === "layout" || key === "trigger")) entry = {};
    else if (summaries[key]) entry = { summary: summaries[key] };
    else throw Error("Missing extension prop description: " + name + "." + key);
    if (name === "KjunQuantityStepper" && key === "block") entry.default = "false";
    if (name === "KjunTimePicker" && key === "block") entry = { summary: "부모의 전체 너비를 채웁니다. 기본값 false는 시각 폭만 차지합니다.", default: "false" };
    if (name === "KjunTimePicker" && key === "hourCycle") entry = { type: "12 | 24", default: "24", ...detail("시계 방식입니다. 24는 00~23시, 12는 오전/오후 칸과 1~12시를 보입니다.", { "값 형태": "어느 쪽이든 값은 HH:mm(또는 HH:mm:ss) 24시간 문자열입니다.", "칸 순서": "한국어·일본어·중국어는 오전/오후를 시 앞에, 그 밖의 언어는 뒤에 둡니다." }) };
    if (name === "KjunTimePicker" && key === "readOnly") entry = { default: "false", summary: "시각을 보여 주기만 하고 바꾸지 않습니다. 칸은 초점을 받지만 휠을 열지 않고 지우기 버튼도 숨깁니다. inline 휠은 움직이지 않습니다." };
    if (name === "KjunTimePicker" && key === "layout") entry = { type: '"auto" | "popover" | "sheet" | "inline"', default: '"auto"', ...detail("휠을 여는 방식입니다.", {
      "auto": platform === "native" ? "기기와 터치 화면은 아래 시트, 마우스를 쓰는 웹 미리보기는 팝오버로 엽니다." : "마우스 화면(pointer: fine)은 팝오버, 터치 화면(pointer: coarse)은 아래 시트로 엽니다.",
      "popover·sheet": "휠을 돌리는 동안은 초안입니다. 확인을 눌러야 " + (platform === "vue3" ? "update:modelValue와 change" : "onValueChange와 onChangeCommit") + "가 한 번 발생합니다. 취소·Esc·바깥 누름·시트 내리기는 값을 그대로 둡니다. ‘지금’은 현재 시각을 minuteStep에 맞춰 휠만 옮깁니다.",
      "inline": "필드 없이 휠을 그 자리에 보입니다. 열이 멈출 때마다 값을 바로 바꿉니다. value가 비어 있으면 현재 시각에서 시작하되 움직이기 전에는 값을 바꾸지 않습니다.",
      "휠": "시는 0~23(12시간제는 12·1~11), 분·초는 간격마다 한 줄이며 끝없이 돕니다. 오전/오후 열만 양 끝에서 멈춥니다. min·max 밖의 시각은 흐리게 남고, 그곳에 멈추면 가장 가까운 허용 시각으로 돌아갑니다.",
      "키보드": "열 사이는 ←→, ↑↓는 한 칸, PageUp·PageDown은 다섯 칸, Home·End는 처음·끝 허용 값입니다. Enter는 확인입니다.",
    }) };
    if (name === "KjunTimePicker" && key === "trigger") entry = { type: '"segments" | "button"', default: 'layout이 sheet면 "button", 그 밖에는 "segments"', ...detail("휠을 여는 필드의 모양입니다. inline에서는 쓰지 않습니다.", {
      "segments": "시·분(·초·오전/오후) 칸입니다. 칸을 누르면 그 열에 초점을 둔 휠이 열리고, " + (platform === "native" ? "웹 미리보기에서는 " : "") + "숫자를 입력하면 바로 값을 바꾸며 칸이 차면 다음 칸으로 넘어갑니다. ↑↓는 칸 값을 한 단계씩 바꿉니다.",
      "button": "‘오전 9:30’처럼 한 줄로 읽히는 필드 버튼입니다. 비어 있으면 ‘시간 선택’을 보입니다.",
    }) };
    if (name === "KjunTimePicker" && key === "name") entry = { summary: "폼 제출용 숨은 input의 이름입니다. 비어 있으면 빈 문자열을 제출합니다." };
    if (name === "KjunTimePicker" && key === "id") entry = { summary: "첫 칸(button 필드면 그 버튼)의 id입니다. FormGroup 없이 바깥 <label for>가 첫 구간을 가리킬 때 씁니다. 생략하면 FormGroup의 id를 씁니다." };
    if (name === "KjunQuantityStepper" && (key === "value" || key === "modelValue")) entry = detail(valueDescription[name], {
      "상태 책임": guides[name].interaction,
      "키보드": "Enter·blur는 변경값을 확정합니다. 편집 중 첫 Escape는 초안을 되돌리고 상위 창에 전달하지 않습니다. 편집이 끝난 뒤 Escape는 상위 창이 처리합니다. IME 조합 중 키와 조합 확정 keyCode=229는 수량을 확정하거나 증감하지 않습니다.",
      "폼 연결": "FormGroup의 라벨·ID·도움말·오류·필수 정보를 상속합니다. 명시한 ariaLabel·id는 입력의 이름·ID를 우선 지정하며, 오류 설명 연결은 유지합니다.",
    });
    if (name.includes("Slider") && ["min", "max", "step", "disabled"].includes(key)) entry.default = { min: "0", max: "100", step: "1", disabled: "false" }[key];
    return [key, entry];
  }));
  if (name === "KjunRangeSlider" && platform === "vue3") props.modelValue.type = "[number, number]";
  const events = {}, slots = {};
  if (platform === "vue3") {
    const eventKeys = name === "KjunSplitPane" ? { "update:size": "onSizeChange", change: "onChangeCommit", "update:collapsed": "onCollapsedChange" } : name === "KjunColorPicker" ? { "update:modelValue": "onValueChange", change: "onChangeCommit", "update:open": "onOpenChange", "update:recentColors": "onRecentColorsChange" } : name.includes("Slider") || ["KjunTimePicker", "KjunQuantityStepper", "KjunNumberInput"].includes(name) ? { "update:modelValue": "onValueChange", change: "onChangeCommit", ...(name === "KjunQuantityStepper" ? { "invalid-input": "onInvalidInput" } : {}) } : ["KjunBottomNavigation", "KjunFloatingNavigation"].includes(name) ? { navigate: "onNavigate", reselect: "onReselect" } : name === "KjunChip" ? { remove: "onRemove" } : name === "KjunAvatarGroup" ? { click: "onClick" } : ["KjunImage", "KjunAvatar"].includes(name) ? { load: "onLoad", error: "onError" } : name === "KjunCarousel" ? { "update:index": "onIndexChange" } : name === "KjunSteps" ? { "step-select": "onStepSelect" } : name === "KjunListRow" ? { "update:checked": "onCheckedChange", "update:expanded": "onExpandedChange" } : name === "KjunListSection" ? { "update:modelValue": "onValueChange", "update:order": "onOrderChange", reorder: "onReorder" } : {};
    for (const [eventName, key] of Object.entries(eventKeys)) events[eventName] = callback(name, key, platform);
    if (name === "KjunEventCalendar") Object.assign(events, eventCalendarEvents);
    const slotNames = { KjunSplitPane: ["first", "second"], KjunColorPicker: ["trigger"], KjunListRow: ["default", "badge", "leading", "trailing", "actions", "expanded"], KjunListSection: ["badge", "actions", "default", "loading", "empty", "footer"], KjunListGroup: ["default"], KjunListItem: ["default"], KjunTopNavigation: ["leading", "actions"], KjunBottomActionBar: ["default"], KjunImage: ["fallback"], KjunAvatar: ["fallback"], KjunCarousel: ["default", "action"], KjunNumberInput: ["prefix", "suffix"] }[name] || [];
    for (const key of slotNames) {
      if (name === "KjunColorPicker") { slots[key] = colorTriggerSlot; continue; }
      const definition = name === "KjunSplitPane" ? splitPaneSlots[key] : name === "KjunTopNavigation" ? topNavigationSlots[key] : name === "KjunCarousel" ? (key === "action" ? carouselAction : carouselSlides) : name === "KjunListRow" && key === "default" ? listRowContent : name === "KjunListSection" && key === "badge" ? listSectionBadge : childProps[key === "default" ? "children" : key];
      slots[key] = { ...definition, details: definition.details.map(row => row.label === "슬롯 데이터" ? { ...row, text: "제공 데이터 없음" } : row) };
    }
  }
  return [platform, { props, events, slots, ownership: [guides[name].interaction, guides[name].differences], types: name === "KjunFileUpload" ? fileUploadTypes : name === "KjunEventCalendar" ? eventCalendarTypes(platform) : ["KjunBottomNavigation", "KjunFloatingNavigation"].includes(name) ? [fields("NavigationDestination", "목적지 목록의 항목입니다.", [["key", "string", "고유한 목적지 key"], ["label", "string", "전체 목적지 이름"], ["href", platform === "native" ? "string | undefined" : "string", "웹 이동 주소. Native에서는 앱 콜백으로 이동합니다."], ["icon", "string | undefined", "보조 아이콘"], ["badge", "string | number | boolean | undefined", "보조 수치 또는 짧은 라벨. true는 점으로 표시하고 99보다 큰 숫자는 99+로 줄입니다."], ["disabled", "boolean | undefined", "이 목적지 이동 비활성"]])] : [] }];
}))]));
