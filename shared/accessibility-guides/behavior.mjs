const action = '버튼의 실행 이벤트를 소비 코드에 전달합니다. disabled·loading이 제공된 컨트롤은 실행을 차단하며, 슬롯 액션의 상태는 별도로 지정합니다.';
const choice = '값과 선택 이벤트를 연결하는 제어형 컨트롤입니다. 표시된 이름과 선택·비활성 상태를 해당 플랫폼의 요소에 전달합니다.';
const text = '표시 텍스트·대체 이름은 프로젝트가 전달한 값으로 구성합니다. 단위와 상태의 의미는 텍스트로 함께 제공해야 합니다.';
export const behavior = {
  button: action, action, toggle: 'active와 toggle 이벤트로 눌림 상태를 연결합니다. 대상 이름을 버튼 이름에 포함할 수 있습니다.', checked: choice, choice,
  remove: '삭제 버튼이 remove 이벤트를 전달합니다. 항목 제거와 이후 포커스 대상은 소비 코드가 정합니다.',
  dismiss: 'closable일 때 닫기 버튼을 제공하고 close 이벤트를 전달합니다.',
  'tab-order': '스크롤 장식 자체의 실행 이벤트는 없으며, 공급한 하위 컨트롤이 원래의 키보드 순서를 유지합니다.',
  field: 'FormGroup이 라벨·도움말 또는 오류의 식별자를 만들고 하위 입력에 연결합니다. 오류를 설정하면 도움말 대신 오류 설명을 사용합니다.',
  radio: choice, tabs: '선택한 탭 값에 맞춰 해당 패널을 표시합니다. 하위 TabPane은 부모 Tabs의 선택 상태를 사용합니다.',
  menu: '트리거가 메뉴를 열고 활성 항목 실행 뒤 닫습니다. 비활성 항목은 실행되지 않습니다.',
  divider: '메뉴 항목 사이를 구분하며 실행 이벤트와 입력 라벨은 없습니다. 부모 메뉴 안에서의 의미와 포커스 제외 조건을 검사합니다.',
  accordion: '항목 제목의 버튼으로 펼침 상태와 본문 표시를 전환합니다.',
  dialog: '열림 상태와 닫기 이벤트를 연결합니다. 제목 또는 이름 속성으로 창의 목적을 지정합니다. 모달과 팝오버의 초기 포커스 설정은 서로 다릅니다.',
  tooltip: '트리거의 hover·포커스에 맞춰 설명을 표시합니다. 트리거 자체의 이름을 대신하지 않습니다.',
  select: '값·옵션과 선택 이벤트를 연결합니다. 필터 입력과 열림 상태는 선택 도구의 공개 API에 따라 처리합니다.',
  search: '입력값으로 원격 옵션을 요청하고 선택된 항목을 소비 코드에 전달합니다. 대체·취소된 요청 결과는 반영하지 않습니다.',
  date: '웹 패키지는 브라우저 date 입력을 사용하고 Native는 날짜 버튼과 달력 Modal을 사용합니다.',
  time: '시·분·선택적인 초마다 Select를 조합하고 선택값을 시각 문자열로 전달합니다.',
  slider: '손잡이별 값과 범위·이름을 제공하며 step에 맞는 값을 전달합니다.',
  stepper: '수량 입력의 미확정 문자열을 관리하고 Enter·blur에서 확정합니다. 증감 버튼은 min·max·step을 적용합니다.',
  link: '웹은 링크 주소로 이동하고 Native는 프로젝트가 전달한 탐색 콜백을 호출합니다.',
  pagination: '페이지 버튼과 페이지 크기 선택이 변경 요청을 전달하며, 현재 페이지는 소비 코드가 갱신합니다.',
  'bottom-nav': '현재 목적지와 탐색 이벤트를 연결하고 각 목적지의 이름을 제공합니다.',
  table: '설정에 따라 검색·정렬·선택·확장 컨트롤을 제공합니다. 행을 선택하거나 펼친 상태는 제어값과 변경 이벤트로 연결합니다.',
  market: '시세 행과 정렬·필터 컨트롤을 조합합니다. 행 실행과 데이터 변경은 프로젝트가 처리합니다.',
  'data-state': '조회 실패를 텍스트로 설명하고 재시도 이벤트를 제공합니다. 이전 결과를 유지하는 설정에서는 실패 안내와 기존 콘텐츠가 함께 표시됩니다.',
  boundary: '자식 렌더 오류를 fallback으로 바꿉니다. Vue는 새로고침, React·Native는 reset 이벤트를 제공합니다.',
  feedback: 'Toast는 알림 메시지와 닫기를, Confirm·Prompt는 순서대로 처리되는 요청·취소·검증 결과를 제공합니다.',
  text, image: 'alt 또는 name으로 이미지 이름을 전달하고 decorative 설정으로 장식 여부를 구분합니다.', chart: text, progress: text,
  decorative: '장식이나 로딩 자리표시자이며 자체 입력·실행 이벤트를 제공하지 않습니다.',
};
const labelBehavior = {
  field: '라벨은 FormGroup의 label, 설명은 hint 또는 error에서 가져옵니다. Input·Textarea는 FormGroup의 required를 필수 입력 의미로 전달합니다. 두 인스턴스의 필수 상태·오류 전환에서 실제 연결을 검사합니다.',
  image: 'alt·name으로 대체 텍스트를 구성하고 decorative일 때 이미지 역할에서 제외합니다.',
  menu: '트리거 버튼과 각 메뉴 항목은 표시 텍스트를 이름으로 사용합니다. 메뉴 컨테이너의 이름 연결과 열렸을 때 ID 참조를 별도로 검사합니다.',
  dialog: '창의 제목과 ariaLabel로 이름을 구성합니다. Native Web에서는 Modal 호스트와 내용의 역할이 중첩될 수 있어 실제 dialog 이름을 확인합니다.',
  tooltip: 'content가 설명 내용입니다. 트리거의 이름과 별도로 aria-describedby 연결 여부를 검사합니다.',
  tabs: '탭의 label과 활성 패널을 함께 표시합니다. 선택된 탭과 패널의 이름·ID 연결은 플랫폼별 출력에서 검사합니다.',
  feedback: 'Toast 메시지와 요청 제목·Prompt 오류를 표시합니다. live 역할 및 입력 이름·오류 설명의 실제 연결을 검사합니다.',
  text: '지정한 수치·단위·상태 텍스트를 표시합니다. 접근성 트리에서도 해당 텍스트가 유지되는지 검사합니다.',
  progress: 'label과 현재 백분율을 표시합니다. progressbar 역할의 현재값·범위가 브라우저에 전달되는지 검사합니다.',
  chart: '그래프의 데이터와 대체 이름을 제공합니다. 그래픽 역할·이름이 실제로 노출되는지 검사합니다.',
  divider: '이름이나 오류 필드는 없으며 부모 메뉴의 구분선입니다. 이 검사는 separator 역할과 포커스 제외 조건에 한정됩니다.',
};
const focusBehavior = {
  menu: '열린 메뉴로 이동하고 닫힌 뒤 트리거로 복귀하는 경로를 검사합니다. Native는 Modal 경로이며 DOM 방향키나 초기 포커스 지원을 추정하지 않습니다.',
  dialog: 'Modal·Drawer는 창 내부 포커스를, Popover는 focusOnOpen과 트리거 조합을 사용합니다. 초기 포커스·Tab 이동·닫힌 뒤 복귀 결과를 각각 검사합니다.',
  tooltip: '설명은 트리거를 보조하며 자체 입력 대상은 없습니다. 표시·닫기 동안 트리거에 포커스가 남는지 검사합니다.',
  feedback: 'Toast는 알림을 표시하고 Confirm·Prompt는 Modal을 사용합니다. 알림의 포커스 유지와 두 요청의 초기 포커스·복귀를 따로 검사합니다.',
};
export function platformBehavior(target, platform, item) {
  let description = behavior[target.profile];
  if (item === 'labeling') description = labelBehavior[target.profile] || 'label·ariaLabel·옵션 텍스트 등 공개 API와 하위 콘텐츠에서 컨트롤 이름을 구성합니다. 실제 이름, 오류 상태와 라벨·설명 ID를 검사하며 장식 아이콘은 이름을 대신하지 않습니다.';
  if (item === 'focus') description = focusBehavior[target.profile] || '포커스 순서는 실제 활성 컨트롤과 공급한 하위 구성에 따릅니다. Tab으로 진입·이동할 수 있는지 확인하며 화면 전환 이후의 포커스는 프로젝트에서 정합니다.';
  if (target.scenario.parent) description = `${target.scenario.parent} 안에서 사용하는 하위 구성입니다. ` + description;
  if (target.scenario.children) description += ' 이 항목은 문서에 명시한 하위 컨트롤을 공급한 조합을 검사합니다.';
  if (platform === 'native' && ['select', 'search', 'time'].includes(target.profile)) description += ' Native는 DOM listbox 대신 Modal 내부 입력·radio 옵션을 사용하며 입력 포커스가 내부 입력으로 이동할 수 있습니다.';
  if (platform === 'native' && target.profile === 'menu') description += ' Native는 Modal과 menuitem을 사용합니다. DOM menu 역할과 방향키 동작의 제공 여부는 결과에서 구분합니다.';
  return target.subject + '. ' + description;
}
