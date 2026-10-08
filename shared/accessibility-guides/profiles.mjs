// The three entries are executable check contracts, not accessibility conformance claims.
const check = (procedure, expected) => ({ procedure, expected });
const activation = check('첫 대상에 Tab으로 접근한 뒤 Enter·Space를 누르고 예제 상태를 비교합니다.', '실행 콜백 또는 선택 상태가 바뀌고, 비활성 설정이 있는 경우 실행되지 않습니다.');
const names = check('표시된 컨트롤의 접근성 이름과 라벨·설명 ID, 열린 컨트롤의 aria-controls·activedescendant, 중복 ID를 검사합니다.', '각 컨트롤의 이름이 비어 있지 않고 라벨·설명 및 열린 컨트롤의 ID 참조가 유일한 실제 요소를 가리킵니다. 닫힌 뒤 제거되는 패널의 controls 참조는 열렸을 때 검사합니다.');
const focus = check('대상에 Tab으로 진입한 뒤 다음 Tab·Shift+Tab 이동을 확인합니다.', '활성 컨트롤에 키보드로 접근하고 다음 컨트롤 또는 영역 밖으로 이동할 수 있습니다.');
const staticReason = '기본 비대화형 표시에는 자체 키보드 명령이나 포커스를 이동·복귀시키는 동작이 없습니다. 슬롯에 추가한 액션은 해당 컨트롤 계약으로 검증합니다.';
const passive = (label) => [null, label, null];
export const profiles = {
  button: [activation, names, focus], action: [activation, names, focus], toggle: [activation, names, focus], checked: [activation, names, focus],
  choice: [activation, names, focus], remove: [activation, names, focus], dismiss: [activation, names, focus],
  'tab-order': [check('공급한 버튼들을 Tab으로 순서대로 탐색합니다.', '앞·뒤 컨트롤을 건너뛰거나 키보드 포커스가 갇히지 않습니다.'), names, focus],
  field: [check('두 필드 중 첫 필드에 Tab 진입 후 입력하고 disabled·읽기 전용·편집 가능 상태를 전환합니다.', '값이 갱신되고 비활성 필드는 Tab에서 제외됩니다. 읽기 전용은 진입할 수 있으나 편집되지 않으며, 상태 해제 후 편집할 수 있습니다.'),
    check('FormGroup 두 개의 라벨·hint·필수 상태를 검사하고 required·error를 설정·해제합니다.', '정확한 접근성 이름, 필수 입력 의미, 도움말·오류 ID 연결, aria-invalid 전환을 제공하며 ID가 중복되지 않습니다.'),
    check('Tab으로 필드에 진입해 오류를 표시한 뒤 포커스 테두리·크기와 Tab·Shift+Tab 이동을 검사합니다.', '오류 상태에서도 독립적인 포커스 테두리가 보이고 크기를 유지하며 앞뒤 컨트롤로 이동할 수 있습니다.')],
  radio: [check('첫 라디오에서 ArrowRight로 다음 활성 옵션을 선택합니다.', '비활성 옵션을 건너뛰며 단일 선택 상태가 다음 활성 옵션으로 바뀝니다.'), names, focus],
  tabs: [check('첫 탭에서 ArrowRight를 누릅니다.', '둘째 탭이 선택되고 둘째 패널만 표시됩니다. 비활성 탭은 선택되지 않습니다.'),
    check('선택 탭과 패널의 role·이름·ID 연결을 검사합니다.', 'tablist·tab·tabpanel 역할과 유효한 aria-controls·aria-labelledby 연결이 있습니다.'), focus],
  menu: [check('트리거에서 ArrowDown으로 열고 방향키로 이동한 뒤 Enter로 실행하고, 다시 열어 Escape를 누릅니다.', '활성 항목이 이동하고 실행 콜백이 발생하며 Escape로 닫힙니다.'), names,
    check('키보드로 메뉴를 연 뒤 초기 포커스와 Escape 이후를 검사합니다.', '메뉴 안에 포커스가 진입하고 닫힌 뒤 트리거로 돌아옵니다.')],
  divider: [null, check('부모 Dropdown을 열어 구분선의 역할과 포커스 제외 여부를 검사합니다.', 'separator 역할이 있고 Tab 대상이 아닙니다.'), null],
  accordion: [check('항목 제목에서 Enter·Space로 펼침 상태를 전환합니다.', 'aria-expanded가 바뀌고 연결 본문이 열리고 닫힙니다.'), names, focus],
  dialog: [check('트리거의 Enter로 열고 Escape로 닫습니다.', '이름이 있는 dialog가 열리고 Escape로 닫힙니다.'), names,
    check('키보드로 열어 초기 포커스·Tab 순환을 확인하고 Escape로 닫습니다.', '초기 포커스와 Tab이 대화상자 안에 있고 닫힌 뒤 원래 트리거로 돌아옵니다.')],
  tooltip: [check('도움말 트리거에 키보드 포커스를 주고 Escape를 누릅니다.', '도움말이 표시되고 Escape로 사라집니다.'),
    check('키보드 포커스로 도움말을 표시하고 설명 ID를 검사합니다.', '트리거의 aria-describedby가 도움말 텍스트에 연결됩니다.'),
    check('도움말 표시·Escape 닫기 전후의 포커스를 비교합니다.', '포커스가 도움말로 이동하지 않고 트리거에 머뭅니다.')],
  select: [check('선택 도구를 키보드로 열고 ArrowDown·Enter로 선택한 뒤 다시 열어 Escape로 닫습니다.', '활성 옵션과 선택 값이 바뀌고 팝업이 닫힙니다.'), names,
    check('선택 도구를 열고 Escape로 닫은 뒤 포커스를 검사합니다.', '입력 또는 원래 선택 트리거에 포커스가 돌아옵니다.')],
  search: [check('자산 검색어를 입력하고 ArrowDown·Enter로 원격 결과를 선택한 뒤 Escape를 누릅니다.', '유효한 aria-activedescendant를 제공하고 선택 값이 바뀌며 결과가 닫힙니다.'), names, focus],
  date: [check('날짜 필드에 키보드로 진입하고 열린 달력의 방향키·Escape를 검사합니다.', '활성 날짜가 방향키에 반응하고 Escape로 닫힙니다. 브라우저 기본 date 입력은 키보드 편집을 검사합니다.'), names, focus],
  time: [check('시각 선택 도구에 키보드로 진입하여 값을 변경하고 Escape로 닫습니다.', '시·분 값 변경이 전달되고 열린 팝업이 닫힙니다.'), names, focus],
  slider: [check('각 슬라이더에 포커스를 주고 ArrowRight를 누릅니다.', 'aria-valuenow 또는 range 값이 증가하며 범위 안에 있습니다.'), names, focus],
  stepper: [check('수량을 입력하고 Enter로 확정한 뒤 증가 버튼을 Space로 실행합니다.', '입력값과 증감 결과가 값 상태에 반영됩니다.'), names, focus],
  link: [check('링크에 Tab 진입 후 Enter로 실행합니다. 외부 주소 요청은 테스트에서 차단·관찰합니다.', '지정한 주소 또는 프로젝트 탐색 콜백이 실행됩니다.'), names, focus],
  pagination: [activation, names, focus], 'bottom-nav': [activation, names, focus],
  table: [check('행 선택 체크박스를 Space로 전환하고 행 확장을 Enter로 실행합니다.', '선택 상태가 바뀌고 해당 행의 상세 본문이 표시됩니다.'), names, focus],
  market: [check('시세 목록의 정렬·행·필터 중 명시한 예제 컨트롤을 키보드로 실행합니다.', '선택 또는 정렬·행 콜백이 전달됩니다.'), names, focus],
  'data-state': [check('조회 실패로 전환한 뒤 재시도를 키보드로 실행합니다.', '실패 텍스트가 표시되고 재시도로 로딩 상태가 됩니다.'), names, focus],
  boundary: [check('자식 렌더에서 오류를 발생시키고 다시 시도를 키보드로 실행합니다.', 'fallback이 오류를 설명하고 reset 콜백을 전달합니다.'), names, focus],
  feedback: [check('Toast 닫기·Confirm 취소·Prompt 입력 검증을 키보드로 실행합니다.', '알림이 닫히고 요청 결과가 반환되며 잘못된 입력은 오류로 안내합니다.'),
    check('Toast의 live 역할과 Prompt 오류 상태·라벨·ID 참조를 검사합니다.', '알림은 status/alert로 표시되고 입력 오류는 이름 있는 필드에 연결됩니다.'),
    check('Toast가 트리거 포커스를 유지하는지, Confirm·Prompt가 초기 포커스를 받고 닫힌 뒤 복귀하는지 검사합니다.', '알림은 포커스를 빼앗지 않고, 두 대화상자는 내부 포커스·닫힌 뒤 트리거 복귀를 제공합니다.')],
  text: passive(check('예제의 의미 있는 텍스트가 접근성 트리에 포함되는지 검사합니다.', '명시한 상태·수치·단위가 스냅샷에 있으며 aria-hidden으로 사라지지 않습니다.')),
  image: passive(check('일반·장식 모드를 각각 설정해 이미지의 접근성 이름을 검사합니다.', '일반 모드는 지정한 대체 텍스트가 있고 장식 모드는 이미지 역할에서 제외됩니다.')),
  chart: passive(check('추세 그래프의 접근성 역할과 이름을 검사합니다.', 'img 역할과 추세를 설명하는 이름을 제공합니다.')),
  progress: passive(check('진행률의 역할·이름 또는 수치 텍스트·최솟값·최댓값을 검사합니다.', 'progressbar 역할에 현재값과 유효한 범위가 있고 이름 또는 표시 수치가 있습니다.')),
  decorative: [null, null, null],
};
export function notApplicable(profile, item, subject) {
  if (profile === 'decorative') return subject + '. 입력·실행·오류 필드·포커스 대상이 없는 장식 요소입니다. 로딩 상태나 의미는 적용 프로젝트가 상위 텍스트로 제공합니다.';
  if (profile === 'divider') return '부모 메뉴의 시각적 구분선에는 실행이나 포커스 이동·복귀 동작이 없습니다. 부모의 메뉴 탐색 검사를 확인하세요.';
  return subject + '. ' + staticReason;
}
