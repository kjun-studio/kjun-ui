import type { FigureSpec, GuideCase } from "./types.ts";
import type { Values } from "../example-registry.ts";

export const designWidths = [375, 640] as const;
export type DesignSide = "before" | "after";
export interface DesignPoint {
  title: string;
  before: string;
  after: string;
  target: string;
}
export interface DesignCase {
  id: string;
  section: string;
  title: string;
  situation: string;
  name: string;
  components: string[];
  before: string;
  after: string;
  points: DesignPoint[];
  appliesWhen?: string;
  caution?: string;
  values?: Values;
  viewportHeight?: number;
}
const target = (id: string) => `[data-testid="design-${id}"]`;
export const designSections = [
  { id: "action-placement", title: "주요 버튼과 취소 버튼의 배치" },
  { id: "long-labels", title: "긴 한국어 라벨과 설명" },
  { id: "row-actions", title: "목록 행의 보조 행동" },
  { id: "field-errors", title: "오류 메시지 위치" },
  { id: "delete-confirmation", title: "삭제 확인" },
  { id: "refresh-context", title: "갱신 중 화면 유지" },
  { id: "empty-vs-error", title: "빈 결과와 조회 실패" },
  { id: "bottom-cta-layout", title: "하단 CTA와 본문" },
  { id: "keyboard-layout", title: "키보드 표시 시 배치" },
];
export const designCases: DesignCase[] = [
  {
    id: "action-placement", section: "action-placement", name: "GuideActionPlacement",
    title: "저장과 취소의 중요도를 나누세요",
    situation: "프로젝트 이름을 바꾼 뒤 저장하거나 편집을 취소하는 화면입니다. 같은 문구와 입력을 두고 버튼의 위계·순서·묶음만 바꿉니다.",
    components: ["DsButton", "DsFormActions"],
    before: "두 버튼이 모두 강조되어 다음 행동을 고르기 어렵습니다.",
    after: "취소는 가볍게, 저장은 분명하게 표시합니다.",
    points: [
      { title: "강조는 주요 행동에", before: "저장과 취소를 모두 primary로 표시해 중요도가 같습니다.", after: "저장만 primary, 취소는 ghost로 표시합니다. 취소는 비활성 버튼이 아닙니다.", target: "text=변경 사항 저장" },
      { title: "순서와 간격을 한 묶음으로", before: "저장이 먼저 오고 취소가 뒤에 있어 익숙한 폼 행동 순서와 다릅니다.", after: "FormActions의 취소 → 저장 순서, 오른쪽 정렬과 8px 간격을 사용합니다. 폭이 부족하면 같은 순서의 세로 배치로 전환하고 두 버튼이 전체 너비를 채웁니다.", target: target("actions") },
    ],
  },
  {
    id: "long-fields", section: "long-labels", name: "GuideLongFields",
    title: "긴 입력 라벨에는 세로 공간을 주세요",
    situation: "팀이 함께 쓰는 프로젝트 설정입니다. 전후 화면에서 라벨과 도움말의 원문은 같습니다. 열 수만 줄여 입력과 설명의 연결을 읽기 쉽게 만듭니다.",
    components: ["DsInput", "DsFormGroup"],
    before: "두 열의 좁은 폭에서 긴 라벨과 도움말이 여러 번 끊깁니다.",
    after: "한 열에서 라벨 → 입력 → 도움말 순서로 읽습니다.",
    points: [
      { title: "문구를 보존하는 배치", before: "같은 폭을 두 필드가 나눠 써 문장이 짧게 끊기고 입력 위치가 어긋납니다.", after: "필드마다 전체 폭을 주고 라벨을 자연스럽게 줄바꿈합니다. 글자 크기나 원문을 줄이지 않습니다.", target: target("fields") },
      { title: "안내는 해당 입력 가까이에", before: "긴 도움말이 좁은 열에 쌓여 다음 필드와의 관계를 파악하기 어렵습니다.", after: "각 입력 바로 아래에 도움말을 둡니다. 실행 예제에서 빈 값으로 저장하면 같은 위치에 수정 방법이 표시됩니다.", target: target("first-field") },
    ],
  },
  {
    id: "long-button", section: "long-labels", name: "GuideLongButton",
    title: "버튼에는 행동을, 주변에는 조건을 쓰세요",
    situation: "모든 팀원에게 적용할 변경 사항을 저장하는 화면입니다. 좁은 화면에서 긴 문장을 버튼 하나에 넣었을 때와 행동·설명을 나누었을 때를 비교합니다.",
    components: ["DsButton"],
    before: "긴 버튼 문구가 가용 폭을 넘거나 고정 높이 안에서 읽기 어려워집니다.",
    after: "대상과 적용 시점은 설명으로, 버튼에는 행동만 남깁니다.",
    points: [
      { title: "조건과 행동의 분리", before: "‘모든 팀원에게 적용할 변경 사항을 저장하고 설정 화면으로 돌아가기’를 한 버튼에 넣었습니다.", after: "‘모든 팀원에게 적용됩니다. 저장 후 설정 화면으로 돌아갑니다.’를 버튼 바로 위에서 설명합니다.", target: target("button-context") },
      { title: "한 줄 버튼의 한계", before: "웹 Button은 한 줄·고정 높이입니다. 좁은 폭에서 넘친 문구는 예제 영역 안에서 스크롤해 확인할 수 있습니다.", after: "‘변경 사항 저장’으로 행동을 명시합니다. 내부 글자 축소나 임의의 높이 변경으로 긴 문구를 숨기지 않습니다.", target: target("button-action") },
    ],
  },
  {
    id: "row-actions", section: "row-actions", name: "GuideRowActions",
    title: "보조 버튼은 그 행동의 대상 옆에 두세요",
    situation: "문서 제목을 누르면 상세 내용을 열고, 공유 버튼을 누르면 해당 문서의 공유 안내를 표시하는 목록입니다. 같은 두 문서와 두 공유 버튼의 위치를 비교합니다.",
    components: ["DsListRow", "DsListSection"],
    before: "공유 버튼을 목록 아래에 모아 어느 문서에 적용되는지 모호합니다.",
    after: "각 행 오른쪽에 공유 버튼을 두어 대상이 분명합니다.",
    points: [
      { title: "대상과 버튼의 거리", before: "첫 문서와 공유 버튼 사이에 다른 문서가 끼어 있습니다.", after: "공유 버튼을 해당 ListRow의 actions 영역에 둡니다. trailing에는 이동을 암시하는 아이콘만 표시합니다.", target: target("row-share") },
      { title: "서로 독립된 행동 영역", before: "본문과 버튼의 연결을 화면 위치만으로 알기 어렵습니다.", after: "본문은 문서 열기, 공유는 보조 행동입니다. 버튼은 본문 클릭 영역의 형제이며 각각 Tab으로 이동하고 실행할 수 있습니다.", target: target("rows") },
    ],
  },
  {
    id: "field-errors", section: "field-errors", name: "GuideFieldErrors",
    title: "오류는 고칠 입력 바로 아래에서 설명하세요",
    situation: "알림을 받을 이메일을 저장하다 검증에 실패한 폼입니다. 같은 입력값과 저장 버튼을 유지하고 오류의 위치와 설명을 바꿉니다.",
    components: ["DsInput", "DsFormGroup"], values: { email: "team@", invalid: true },
    before: "폼 위의 ‘입력 오류’만으로는 어느 값을 어떻게 고칠지 알기 어렵습니다.",
    after: "이메일 입력 아래에 빠진 부분과 올바른 형식의 예를 표시합니다.",
    appliesWhen: "특정 필드의 값 때문에 저장에 실패했을 때 적용합니다. 실행 예제에서 값을 수정한 뒤 다시 검증할 수 있습니다.",
    caution: "오류가 나도 입력값을 지우지 마세요. 통신·권한 오류는 필드 오류로 표현하지 않습니다. 예제의 형식 검사는 문서용입니다.",
    points: [
      { title: "수정할 곳에 원인과 방법을", before: "폼 위에 ‘입력 오류’만 표시해 사용자가 문제를 찾아야 합니다.", after: "‘@ 뒤에 도메인을 입력해 주세요. 예: team@example.com’으로 수정 방법을 안내합니다.", target: target("field-error") },
      { title: "입력값과 검증 흐름 보존", before: "입력은 유지되지만 오류 안내와 떨어져 있습니다.", after: "같은 값을 유지합니다. 수정 후 ‘이메일 저장’을 눌러 재검증하면 오류가 해제됩니다.", target: target("email-input") },
    ],
  },
  {
    id: "delete-confirmation", section: "delete-confirmation", name: "GuideDeleteConfirmation",
    title: "삭제할 대상과 되돌릴 수 없는 결과를 알리세요",
    situation: "‘프로젝트 계획’ 문서를 삭제하기 직전의 확인 창입니다. 실제 Modal 안에서 제목·설명·확정 버튼의 문구와 강조를 비교합니다.",
    components: ["DsModal", "DsButton"], values: { open: true, deleted: false }, viewportHeight: 720,
    before: "‘작업 확인’과 ‘확인’만 표시해 대상과 결과를 다시 추측하게 합니다.",
    after: "삭제 대상과 복구 불가를 설명하고 위험 행동은 ‘문서 삭제’로 명시합니다.",
    appliesWhen: "되돌릴 수 없는 문서를 삭제하기 직전에 적용합니다. 취소는 항목을 유지하고 삭제는 이 예제의 항목만 제거합니다.",
    caution: "취소를 비활성화하지 마세요. 실제로 복원할 수 있는 서비스라면 복구 가능 여부와 보관 기간을 사실대로 적습니다.",
    points: [
      { title: "대상과 결과를 함께 확인", before: "일반적인 제목과 ‘계속 진행할까요?’로 삭제 결과를 설명하지 않습니다.", after: "제목에 ‘프로젝트 계획’을, 본문에 문서 삭제와 복구 불가를 명시합니다.", target: target("delete-context") },
      { title: "안전한 취소와 위험 행동의 구분", before: "확정 버튼이 일반적인 primary와 ‘확인’ 문구여서 삭제인지 알기 어렵습니다.", after: "Modal의 취소·확정 순서를 유지하고 확정에 danger와 ‘문서 삭제’를 사용합니다.", target: '[role="dialog"] .kjun-modal-footer, [role="dialog"] .ds-modal-footer, [role="dialog"][aria-label] > div:last-child' },
    ],
  },
  {
    id: "refresh-context", section: "refresh-context", name: "GuideRefreshContext",
    title: "갱신 중에도 보고 있던 목록을 유지하세요",
    situation: "이미 조회한 프로젝트 문서를 같은 조건으로 갱신하는 화면입니다. 같은 두 문서와 선택 상태를 두고 로딩 중 기존 콘텐츠의 처리만 바꿉니다.",
    components: ["DsDataState", "DsRefreshButton"], values: { phase: "refreshing", selected: true },
    before: "목록을 로딩 화면으로 교체해 보고 있던 내용과 선택 상태를 확인할 수 없습니다.",
    after: "목록과 선택 상태를 유지하면서 갱신 중임을 함께 표시합니다.",
    appliesWhen: "현재 조건의 조회 결과가 이미 있는 동일 조건 갱신에 적용합니다. 시작·완료·실패 버튼으로 상태를 직접 재현합니다.",
    caution: "최초 조회에는 이전 결과가 없으므로 로딩 화면을 사용합니다. 검색 조건이 달라졌다면 이전 결과를 새 조건의 결과처럼 보여주지 마세요.",
    points: [
      { title: "맥락을 유지하는 갱신", before: "갱신을 최초 로딩처럼 처리해 목록 전체를 숨깁니다.", after: "DataState의 동일한 queryKey·resultKey를 유지해 기존 목록 위에 갱신 표시를 제공합니다.", target: target("refresh-content") },
      { title: "완료와 실패를 분리", before: "실패하면 목록 자리에 오류만 표시합니다.", after: "실패해도 기존 결과와 선택을 유지하고 이전 결과라는 안내와 재시도를 제공합니다.", target: target("refresh-controls") },
    ],
  },
  {
    id: "empty-vs-error", section: "empty-vs-error", name: "GuideEmptyVsError",
    title: "빈 결과와 조회 실패에 다른 다음 행동을 주세요",
    situation: "‘완료된 문서’ 필터의 빈 결과와 문서 조회 실패를 각 전후 화면에 함께 배치했습니다. 두 상황의 데이터와 조건은 같고 안내와 복구 행동만 다릅니다.",
    components: ["DsEmpty", "DsDataState", "DsAlert"], values: { filterReset: false, retried: false },
    before: "두 상황을 모두 ‘데이터 없음’으로 표시해 필터 문제인지 조회 실패인지 구분할 수 없습니다.",
    after: "빈 결과에는 필터 초기화, 조회 실패에는 재시도를 제공합니다.",
    appliesWhen: "요청이 성공했지만 결과가 0개인 상태와 요청 자체가 실패한 상태를 구분할 때 적용합니다. 두 복구 버튼은 독립적으로 실행됩니다.",
    caution: "조회 실패를 빈 결과로 단정하지 마세요. 예제의 재시도는 외부 요청 없이 로컬 성공 결과를 표시합니다.",
    points: [
      { title: "빈 결과에는 조건 변경", before: "조회가 성공한 빈 목록에도 일반적인 ‘데이터 없음’만 표시합니다.", after: "완료된 문서가 없음을 설명하고 필터 초기화로 전체 문서를 볼 수 있게 합니다.", target: target("empty-result") },
      { title: "실패에는 재시도", before: "요청 실패에도 같은 빈 상태를 사용해 사용자가 조건을 잘못 바꾸게 만듭니다.", after: "조회하지 못한 이유를 Alert로 알리고 DataState의 오류 영역에서 재시도합니다.", target: target("failed-result") },
    ],
  },
  {
    id: "bottom-cta-layout", section: "bottom-cta-layout", name: "GuideBottomCtaLayout",
    title: "하단 행동 영역만큼 본문 공간을 확보하세요",
    situation: "검토 목록의 마지막 항목을 확인한 뒤 저장하는 모바일 화면입니다. 같은 콘텐츠·CTA·하단 탐색을 사용해 본문과 하단 영역의 관계를 비교합니다.",
    components: ["DsBottomActionBar", "DsBottomNavigation"], viewportHeight: 720,
    before: "하단 영역을 본문 위에 겹쳐 마지막 항목이 가려집니다.",
    after: "스크롤 본문과 하단 영역을 나누어 마지막 항목까지 확인할 수 있습니다.",
    appliesWhen: "본문만 스크롤하고 주요 행동과 탐색을 하단에 유지하는 화면에 적용합니다. 예제는 마지막 항목에서 시작하며 위아래로 스크롤할 수 있습니다.",
    caution: "안전 여백은 맨 아래 BottomNavigation에만 24px로 모의 적용합니다. 위의 BottomActionBar와 본문에 중복 적용하지 않습니다. 실제 안전 여백은 적용 앱이 전달합니다.",
    points: [
      { title: "가림 없는 스크롤 영역", before: "본문이 화면 전체 높이를 사용해 마지막 항목이 하단 영역 뒤로 내려갑니다.", after: "본문에 flex: 1·최소 높이 0을 주고 하단 영역을 별도 형제로 배치합니다.", target: target("scroll") },
      { title: "CTA와 안전 여백의 소유권", before: "본문 공간을 예약하지 않고 하단 CTA와 탐색을 겹칩니다.", after: "하단 영역은 줄어들지 않게 두고 안전 여백은 맨 아래 탐색에서 한 번만 적용합니다.", target: target("footer") },
    ],
  },
  {
    id: "keyboard-layout", section: "keyboard-layout", name: "GuideKeyboardLayout",
    title: "키보드가 나타나면 가용 높이를 다시 나누세요",
    situation: "프로젝트 이름을 편집하는 모바일 화면입니다. 전후 모두 220px 키보드 모의 영역과 같은 입력·CTA를 사용하고 가용 높이의 처리만 바꿉니다.",
    components: ["DsInput", "DsBottomActionBar"], values: { keyboard: true, project: "함께 만드는 프로젝트" }, viewportHeight: 720,
    before: "키보드 높이를 반영하지 않아 입력과 CTA가 키보드 뒤에 가려집니다.",
    after: "키보드 영역을 제외한 높이에 스크롤 본문과 CTA를 배치합니다.",
    appliesWhen: "키보드 표시 중에도 입력 확인과 제출이 필요한 화면에 적용합니다. 모의 영역을 켜고 꺼도 입력값은 유지됩니다.",
    caution: "이 사례는 배치 원리를 설명하는 시뮬레이션입니다. OS 키보드·visualViewport·인셋 수신을 구현하거나 iOS·Android 기기에서 검증한 예제가 아닙니다. 키보드 위에서는 하단 안전 여백을 중복 적용하지 않습니다.",
    points: [
      { title: "가용 높이에 맞춘 본문", before: "화면 높이를 그대로 사용해 마지막 입력이 키보드 아래에 놓입니다.", after: "모의 키보드 높이 220px를 한 번 제외하고 본문 안에서 입력까지 스크롤할 수 있게 합니다.", target: target("scroll") },
      { title: "키보드 위의 주요 행동", before: "CTA도 기존 하단 위치에 남아 키보드에 가려집니다.", after: "BottomActionBar를 가용 영역 아래에 배치해 키보드 위에서 실행할 수 있습니다.", target: target("footer") },
      { title: "명시적인 시뮬레이션", before: "표시된 모의 영역이 입력·행동 영역을 덮는 범위를 보여줍니다.", after: "동일한 220px 영역을 사용합니다. 위의 조작 버튼으로 표시 여부를 바꿔 입력값 유지와 접근을 확인합니다.", target: target("keyboard") },
    ],
  },
];

export function designScenario(item: DesignCase, side: DesignSide, width = 375): GuideCase {
  return {
    id: `${item.id}-${side}-${width}`,
    label: side === "before" ? "전 · 피해야 할 구성" : "후 · 권장 구성",
    description: item[side],
    settings: { arrangement: side },
    values: { ...item.values },
    viewportWidth: width,
    ...(item.viewportHeight ? { viewportHeight: item.viewportHeight } : {}),
  };
}
export function designFigure(item: DesignCase, side: DesignSide, width: number): FigureSpec {
  return {
    ...designScenario(item, side, width),
    parts: item.points.map(point => ({ label: point.title, description: point[side], target: point.target, optional: false })),
  };
}
export const designScenarios = designCases.flatMap(item =>
  designWidths.flatMap(width => (["before", "after"] as const).map(side => ({ name: item.name, scenario: designScenario(item, side, width) }))),
);
export const designTerms = (items = designCases) => items.flatMap(item => [item.title, item.situation, item.before, item.after, item.appliesWhen || "", item.caution || "", ...item.points.flatMap(p => [p.title, p.before, p.after])]);
