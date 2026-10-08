import { detail, event } from "./helpers.mjs";
const source = "packages/tokens/src/feedback.ts";
const method = (name, type, contract) => ({
  name,
  type,
  source,
  ...contract,
  example: "/feedback#preview",
});
const option = (name, type, value, summary, fields) => ({
  name,
  type,
  default: value,
  required: false,
  source,
  ...detail(summary, fields),
  example: "/feedback#preview",
});
const methods = [
  ...["success", "error", "warning", "info"].map((kind) =>
    method(
      "toast." + kind,
      "(message: string, options?: Partial<ToastOptions>) => number",
      event(
        "영역에 알림을 추가하고 ID를 반환합니다.",
        "서비스 호출 즉시",
        "message: 문자열, options: 알림 옵션",
        "number: Toast ID. 해제된 Provider에서는 -1을 반환합니다.",
        "한 영역에 최대 5개를 유지하며 초과 시 가장 오래된 알림을 제거합니다. 종류는 호출한 메서드가 결정합니다.",
      ),
    ),
  ),
  method(
    "toast.dismiss",
    "(id: number) => void",
    event(
      "지정한 알림을 제거합니다.",
      "소비자가 알림을 직접 닫을 때",
      "Toast ID",
      "void",
      "존재하지 않는 ID는 아무 알림도 제거하지 않습니다. 타이머도 정리합니다.",
    ),
  ),
  method(
    "toast.clearAll",
    "() => void",
    event(
      "이 영역의 모든 알림을 제거합니다.",
      "서비스 호출 즉시",
      "없음",
      "void",
      "다른 Provider의 알림은 변경하지 않습니다.",
    ),
  ),
  method(
    "confirm",
    "(options: string | ConfirmOptions) => Promise<boolean>",
    event(
      "확인 창을 요청합니다.",
      "호출 순서대로 대기열에 추가합니다.",
      "문자열 message 또는 ConfirmOptions",
      "확인 완료 true / 취소·닫기·Provider 해제 false. onConfirm 실패 시 reject합니다.",
      "소비자는 반환 Promise로 다음 업무를 처리합니다. onConfirm Promise가 끝날 때까지 진행 중 상태를 표시하며 중복 확인을 막습니다. 실패한 요청은 종료하고 다음 요청으로 진행합니다.",
    ),
  ),
  method(
    "prompt",
    "(options: string | PromptOptions) => Promise<string | null>",
    event(
      "입력 창을 요청합니다.",
      "Confirm과 같은 대기열에 호출 순서대로 추가합니다.",
      "문자열 message 또는 PromptOptions",
      "검증을 통과한 입력 문자열 / 취소·닫기·Provider 해제 null",
      "입력 초안은 열린 창 내부 상태입니다. validator의 false·문자열 결과는 창을 유지하며 오류를 표시합니다. 빈 문자열 성공과 취소 null을 구분하세요.",
    ),
  ),
];
const options = [
  option("ToastOptions.title", "string", "—", "알림의 보조 제목입니다.", {
    사용: "message와 함께 표시할 제목입니다.",
  }),
  option("ToastOptions.message", "string", "호출 인자", "알림 본문입니다.", {
    우선순위:
      "toast.success(message, options) 등의 첫 번째 인자가 최종 본문입니다. options.message로 덮어쓰지 않습니다.",
  }),
  option("ToastOptions.type", 'FeedbackTone | "error"', "호출 메서드", "알림의 종류입니다.", {
    우선순위:
      "toast.error는 danger로 정규화합니다. 공개 서비스 메서드의 종류가 options.type보다 우선합니다.",
  }),
  option("ToastOptions.duration", "number", "종류별 자동", "자동 종료 시간(ms)입니다.", {
    기본값: "성공·정보 3000ms, 경고 4000ms, 오류 5000ms입니다.",
    "직접 종료":
      "0이면 자동 종료하지 않습니다. 직접 닫기·dismiss·clearAll·Provider 해제로 제거합니다.",
    "일시 정지":
      "웹의 hover·focus 동안 남은 시간을 멈춥니다.",
  }),
  option("ToastOptions.closable", "boolean", "true", "닫기 버튼을 표시합니다.", {
    구분: "false여도 duration 자동 종료나 API dismiss는 동작합니다.",
  }),
  option("ToastOptions.showProgress", "boolean", "true", "남은 시간 진행 표시를 제공합니다.", {
    조건: "duration이 0이면 시간 진행 표시를 하지 않습니다. 표시를 숨겨도 자동 종료 시간은 유지됩니다.",
  }),
  option(
    "ToastOptions.action",
    "{ label: string; onClick: () => void }",
    "—",
    "알림 안에 추가 행동을 제공합니다.",
    {
      "발생 시점": "사용자가 알림 행동을 실행할 때 onClick을 호출합니다.",
      전달값: "없음",
      반환값: "사용하지 않습니다. 비동기 업무의 성공·실패 처리는 소비자가 구현합니다.",
    },
  ),
  option(
    "ConfirmOptions.title / PromptOptions.title",
    "string",
    "Confirm: 확인 / Prompt: 입력",
    "창의 제목입니다.",
    { 사용: "현재 요청의 제목으로 표시합니다." },
  ),
  option("ConfirmOptions.message / PromptOptions.message", "string", "—", "창의 설명입니다.", {
    사용: "서비스에 문자열을 직접 전달해도 message로 변환됩니다.",
  }),
  option(
    "ConfirmOptions.type / PromptOptions.type",
    "FeedbackTone",
    "—",
    "확인 버튼의 위험 강조 여부를 정합니다.",
    {
      사용: "danger이면 danger 버튼, 나머지 종류와 생략은 primary 버튼을 사용합니다. 모든 종류를 각각 다른 창 색상으로 표시하지 않습니다.",
    },
  ),
  option(
    "ConfirmOptions.confirmText / PromptOptions.confirmText",
    "string",
    '"확인"',
    "확인 버튼 문구입니다.",
    { "기본 동작": "빈 문자열도 기본 문구로 대체합니다." },
  ),
  option(
    "ConfirmOptions.cancelText / PromptOptions.cancelText",
    "string",
    '"취소"',
    "취소 버튼 문구입니다.",
    { "기본 동작": "빈 문자열도 기본 문구로 대체합니다." },
  ),
  option(
    "ConfirmOptions.onConfirm",
    "() => void | Promise<void>",
    "—",
    "확정 전에 실행할 비동기 작업입니다.",
    {
      "발생 시점": "확인 버튼 실행 시 호출합니다.",
      전달값: "없음",
      반환값:
        "Promise이면 완료를 기다립니다. 완료 후 confirm은 true, throw·reject이면 confirm Promise도 reject합니다.",
      "상태 책임":
        "진행 중에는 닫기·취소를 제한합니다. Provider 해제 시에는 false로 정리하고 늦게 끝난 이전 요청이 다음 요청을 종료하지 않게 합니다.",
    },
  ),
  option("PromptOptions.initialValue", "string", '""', "입력 창의 초기 문자열입니다.", {
    "상태 책임": "현재 창의 입력 초안은 내부에서 관리합니다. 외부 제어형 value가 아닙니다.",
  }),
  option("PromptOptions.placeholder", "string", "—", "입력 안내 문자열입니다.", {
    사용: "값이 비어 있을 때 표시합니다.",
  }),
  option(
    "PromptOptions.validator",
    "(value: string) => boolean | string",
    "—",
    "입력 확정 시 동기 검증을 수행합니다.",
    {
      "발생 시점": "Prompt 확인 실행 시 호출합니다.",
      전달값: "현재 입력 문자열",
      반환값:
        "true이면 확정, false이면 기본 오류, 문자열이면 해당 오류를 표시합니다. 비동기 Promise 검증은 지원하지 않습니다.",
      "상태 책임":
        "소비자가 true·false·메시지를 반환하도록 구현하세요. validator가 throw하는 경우의 복구를 서비스 계약으로 보장하지 않습니다.",
    },
  ),
];
const ownership = [
  "알림·요청 대기열·진행 중 표시·입력 초안: 해당 KjunFeedbackProvider 영역이 관리합니다.",
  "실제 저장·검증·성공 후 이동: 소비자가 콜백과 반환 Promise에서 처리합니다.",
  "Provider 해제: 미완료 Confirm은 false, Prompt는 null로 정리하고 알림 타이머와 대기열을 제거합니다.",
];
export default Object.fromEntries(
  ["vue2", "react", "native"].map((platform) => [
    platform,
    {
      ownership: [
        ...ownership,
        platform === "vue2"
          ? "Vue는 inject한 kjunFeedback 서비스를 사용합니다."
          : "useKjunFeedback()은 KjunFeedbackProvider 안에서 호출합니다.",
      ],
      methods,
      options,
    },
  ]),
);
