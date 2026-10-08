import { part as p, textPart as t, type GuideAuthor } from "./types.ts";
export const extensions: Record<string, GuideAuthor> = {
  DsListRow: {
    parts: [t("주 행동 영역", "제목과 설명을 누르면 프로필 설정을 엽니다.", "프로필 설정"), t("설명", "주 행동의 목적을 보충합니다.", "이름과 사진을 변경합니다.", true), t("보조 행동", "주 행동과 분리된 공유 버튼입니다. 함께 실행되지 않습니다.", "공유", true)],
    related: "generic-lists", states: [{ id: "long", label: "긴 라벨", description: "행 높이를 늘려 제목과 설명을 모두 표시합니다.", settings: { long: true } }],
  },
  DsListSection: {
    parts: [t("섹션 제목", "목록 묶음의 목적입니다.", "설정", true), t("섹션 설명", "목록에 포함된 작업을 설명합니다.", "계정과 알림을 관리합니다.", true), p("행 목록", "소비자가 ListRow와 자식 컨트롤을 배치합니다.", 'ul.kjun-list, [role="list"]')], related: "generic-lists",
  },
  DsTopNavigation: {
    parts: [p("앞쪽 탐색", "24px 아이콘과 최소 44px 영역을 사용하며 앱이 뒤로 가기 행동을 연결합니다.", '[aria-label="뒤로 가기"]', true), t("화면 제목", "20px·600 굵기의 제목입니다. 양쪽 행동과 첫 줄을 맞추며 긴 제목은 줄바꿈합니다.", "프로젝트 설정"), t("행동 영역", "제목 줄에 정렬한 ghost 저장 버튼 예시입니다. 소비자가 행동과 variant를 선택합니다.", "저장", true)], related: "app-screen",
    states: [
      { id: "safe-area", label: "안전 영역", description: "앱이 상단 안전 영역 24px을 전달합니다.", settings: { safeAreaTop: 24 } },
      { id: "long-action", label: "긴 행동", description: "제목 공간이 부족하면 행동을 다음 줄로 배치합니다.", settings: { actions: "긴 문구", exampleWidth: "320" } },
      { id: "long-leading", label: "긴 앞쪽 문구", description: "한 줄 말줄임으로 제목 공간을 확보하며 접근성 이름은 유지합니다.", settings: { leading: "긴 문구", exampleWidth: "320" } },
      { id: "mixed", label: "아이콘 조합", description: "RefreshButton·MenuButton·IconToggle이 44px 영역과 24px 아이콘을 사용합니다.", settings: { actions: "아이콘 조합" } },
    ],
  },
  DsBottomNavigation: {
    parts: [t("현재 목적지", "앱의 value가 현재 목적지를 결정합니다. 강조색과 라벨 굵기, 하단 선택 표시선으로 구분합니다.", "홈"), t("다른 목적지", "웹에서는 링크, Native에서는 앱 이동 요청입니다.", "활동"), t("보조 수치", "아이콘 오른쪽 위에 표시하며 아이콘·라벨의 정렬에 영향을 주지 않습니다.", "3", true)], related: "app-screen",
    states: [{ id: "current", label: "목적지 변경", description: "소비자가 활동을 현재 위치로 제공합니다.", values: { destination: "activity" } }, { id: "keyboard", label: "키보드 표시", description: "기본 hideOnKeyboard=true로 탐색 영역을 숨깁니다.", settings: { keyboardVisible: true } }],
  },
  DsBottomActionBar: {
    parts: [t("보조 설명", "14px·줄 높이 20px의 보조 설명입니다. 긴 설명은 줄바꿈합니다.", "저장하면 모든 기기에 적용됩니다.", true), t("주요 행동", "좁은 영역에서 확인 버튼이 남는 폭을 채웁니다. 저장 요청은 앱이 처리합니다.", "변경 사항 저장")], related: "app-screen",
    states: [{ id: "keyboard", label: "키보드 표시", description: "기본 hideOnKeyboard=false로 CTA를 유지합니다.", settings: { keyboardVisible: true } }],
  },
  DsImage: {
    parts: [p("이미지 영역", "비율을 유지하는 컨테이너 안에서 원본을 표시합니다. 대체 텍스트는 이미지와 같은 내용을 설명합니다.", 'img, [role="img"]')], related: "thumbnail",
    figures: [{ id: "failure", label: "이미지 실패", description: "이미지 영역을 유지하고 소비자의 대체 콘텐츠를 표시합니다.", settings: { imageState: "실패" }, parts: [t("실패 대체 표현", "패키지 컨테이너 안의 소비자 콘텐츠입니다.", "이미지를 불러올 수 없습니다")] }],
    states: [{ id: "failure", label: "로드 실패", description: "잘못된 이미지 데이터를 실제로 로드하여 실패를 재현합니다.", settings: { imageState: "실패" } }, { id: "contain", label: "원본 비율 유지", description: "전체 이미지를 보여주고 남는 영역을 유지합니다.", settings: { fit: "contain", aspectRatio: 1 } }],
  },
  DsAvatar: {
    parts: [p("프로필 영역", "이미지가 없으면 이름의 첫 글자를 표시하며 접근성 이름은 전체 이름을 유지합니다.", '[aria-label="김하늘"]')], related: "generic-lists",
    states: [{ id: "photo", label: "사진", description: "실제 이미지 주소를 제공합니다.", settings: { imageState: "사진" } }, { id: "failure", label: "실패 대체", description: "사진 실패 시 이름의 첫 글자로 돌아갑니다.", settings: { imageState: "실패" } }],
  },
  DsChip: {
    parts: [t("라벨", "표시하거나 삭제할 항목의 이름입니다.", "프로젝트"), p("삭제 요청", "누르면 소비자에게 삭제를 요청합니다. 패키지가 항목을 지우지는 않습니다.", '[aria-label="프로젝트 삭제"]', true)], related: "input-settings",
    states: [{ id: "without-remove", label: "삭제 없음", description: "removable=false로 삭제 버튼을 생략합니다.", settings: { removable: false } }],
  },
  DsSlider: {
    parts: [t("라벨", "조절하는 값의 의미입니다.", "알림 음량", true), p("손잡이", "포인터·키보드·접근성 증감 행동으로 값을 바꿉니다.", 'thumb=input[type="range"], [role="slider"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 step", description: "0~1 범위를 0.1 단위로 조절합니다.", settings: { decimal: true }, values: { slider: .5 } }],
  },
  DsRangeSlider: {
    parts: [p("시작 손잡이", "끝 값을 넘어가지 않는 구간 시작값입니다.", 'thumb=[aria-label="시작 값"]'), p("끝 손잡이", "시작 값 아래로 내려가지 않는 구간 끝값입니다.", 'thumb=[aria-label="끝 값"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 구간", description: "손잡이 순서를 유지하며 소수 단위로 조절합니다.", settings: { decimal: true }, values: { range: [.2, .8] } }],
  },
  DsTimePicker: {
    values: { time: "09:30" },
    parts: [p("시 선택", "유효한 24시간제 시각의 시를 선택합니다.", '[aria-label="알림 시각 시"]'), p("분 선택", "선택한 시 안에서 유효한 분을 고릅니다.", '[aria-label="알림 시각 분"]'), p("지우기", "값이 있을 때 오른쪽에 나타나며, 값을 null로 바꾸고 첫 구간으로 초점을 옮깁니다.", '[aria-label="알림 시각 지우기"]', true)], related: "input-settings",
    states: [{ id: "seconds", label: "초 선택", description: "precision=second로 초 선택 영역을 추가합니다.", settings: { precision: "second" }, values: { time: "09:30:15" } }, { id: "bounded", label: "시각 범위", description: "09:30:15~18:30:45 사이의 시각만 선택합니다.", settings: { precision: "second", bounded: true } }],
  },
  DsQuantityStepper: {
    parts: [p("감소 버튼", "확정값에서 step을 뺍니다.", '[aria-label="수량 줄이기"]'), p("숫자 입력", "입력 문자열은 Enter·blur에서 숫자로 확정합니다.", '[role="spinbutton"]'), p("증가 버튼", "확정값에 step을 더합니다.", '[aria-label="수량 늘리기"]')], related: "input-settings",
    states: [{ id: "decimal", label: "소수 수량", description: "직접 입력은 소수 두 자리로 반올림하고 버튼은 0.1씩 증감합니다.", settings: { decimal: true }, values: { quantity: 1.25 } }],
  },
};
