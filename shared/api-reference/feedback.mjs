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
        "한 영역에 최대 3개를 유지하며 초과 시 자동으로 닫히는 가장 오래된 알림부터 제거합니다. 종류는 호출한 메서드가 결정합니다.",
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
    "toast.update",
    "(id: number, patch: ToastPatch) => void",
    event(
      "보이는 알림의 문장·종류·제목·행동·시간을 그 자리에서 바꿉니다.",
      "서비스 호출 즉시",
      "Toast ID와 바꿀 옵션",
      "void",
      "남은 시간을 새로 시작합니다. 종류를 바꾸고 duration을 주지 않으면 새 종류의 기본 시간을 씁니다. 이미 닫힌 ID는 무시합니다.",
    ),
  ),
  method(
    "toast.promise",
    "<T>(promise: Promise<T> | (() => Promise<T>), messages: { loading; success; error }, options?) => Promise<T>",
    event(
      "기다리는 동안 돌아가는 아이콘의 알림을 보이고, 끝나면 같은 알림을 성공 또는 오류로 바꿉니다.",
      "서비스 호출 즉시",
      "Promise(또는 Promise를 만드는 함수)와 loading·success·error 문장. success·error는 결과를 받는 함수일 수 있습니다.",
      "받은 Promise와 같은 결과",
      "기다리는 동안은 자동으로 닫히지 않습니다. 성공은 3초 뒤 닫히고 오류는 직접 닫을 때까지 남습니다(options.duration으로 바꿀 수 있음).",
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
    기본값: "성공·정보 3000ms, 경고 4000ms입니다. 오류는 0이라 직접 닫을 때까지 남습니다.",
    "직접 종료":
      "0이면 자동 종료하지 않습니다. 직접 닫기·dismiss·clearAll·Provider 해제로 제거합니다.",
    "일시 정지":
      "웹의 hover·focus 동안 남은 시간을 멈춥니다.",
  }),
  option("ToastOptions.closable", "boolean", "true", "닫기 버튼을 표시합니다.", {
    구분: "false여도 duration 자동 종료나 API dismiss는 동작합니다.",
  }),
  option("ToastOptions.compact", "boolean", "false", "제목 없는 한 줄 알림을 내용 폭의 캡슐로 표시합니다.", {
    조건: "title이 있으면 무시합니다. 닫기 버튼이 없으므로 duration이 0일 때만 닫기 버튼을 둡니다. action은 문장 뒤에 하나 둡니다.",
  }),
  option("ToastOptions.showProgress", "boolean", "—", "더 이상 사용하지 않습니다.", {
    호환: "0.19.0부터 남은 시간 진행 표시를 그리지 않아 값을 무시합니다. 자동 종료 시간과 hover·focus 일시 정지는 그대로입니다.",
  }),
  option("ToastOptions.key", "string", "—", "같은 key의 알림이 보이면 새로 쌓지 않고 그 알림을 바꿉니다.", {
    사용: "재시도마다 같은 네트워크 오류가 쌓이지 않게 합니다. 바뀐 알림은 시간을 새로 시작하며 onDismiss는 부르지 않습니다.",
  }),
  option("ToastOptions.onDismiss", '(reason: "timeout" | "close" | "action" | "api") => void', "—", "알림이 사라질 때 한 번 호출합니다.", {
    전달값: "timeout 시간 만료, close 닫기 버튼·밀어서 닫기, action 행동 버튼, api dismiss·clearAll·넘친 스택·Provider 해제",
    사용: "실행 취소 없이 닫혔을 때(timeout·close) 삭제를 확정하는 식으로 씁니다.",
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
      사용: "danger이면 danger 버튼을 쓰고, message를 옅은 danger 면과 경고 표시가 있는 경고 상자로 보여 줍니다. 나머지 종류와 생략은 primary 버튼과 2차 글자색 설명입니다.",
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
        "Promise이면 완료를 기다립니다. 완료 후 confirm은 true로 끝납니다. throw·reject하면 창을 닫지 않고 설명 아래에 오류 메시지(없으면 invalidInput)를 보여 주며, 사용자가 다시 확인하거나 취소(false)할 때까지 confirm Promise는 끝나지 않습니다.",
      "상태 책임":
        "진행 중에는 닫기·취소를 제한합니다. Provider 해제 시에는 false로 정리하고 늦게 끝난 이전 요청이 다음 요청을 종료하지 않게 합니다.",
    },
  ),
  option("PromptOptions.initialValue", "string", '""', "입력 창의 초기 문자열입니다.", {
    "상태 책임": "현재 창의 입력 초안은 내부에서 관리합니다. 외부 제어형 value가 아닙니다.",
    사용: "창이 열리면 전체 선택되어 바로 덮어쓸 수 있습니다(이름 바꾸기).",
  }),
  option("PromptOptions.validateOn", '"submit" | "change"', '"submit"', "검증 시점입니다.", {
    사용: "change면 입력을 멈춘 뒤(0.4초) validator를 돌려 오류를 바로 보여 주고, 오류가 있는 동안 확인 버튼을 끕니다. 늦게 끝난 이전 검사는 무시합니다.",
  }),
  option("PromptOptions.allowEmpty", "boolean", "false", "빈 값으로 확인할 수 있게 합니다.", {
    사용: "기본은 빈 값(공백만 있는 값 포함)이면 확인 버튼이 꺼져 있습니다.",
  }),
  option("PromptOptions.inputMode", '"text" | "numeric" | "decimal" | "email" | "url" | "tel" | "search"', '"text"', "화면 키보드 종류입니다.", {
    사용: "웹은 inputmode, Native는 keyboardType으로 바꿉니다.",
  }),
  option("PromptOptions.autoComplete", "string", "—", "자동 완성 힌트입니다.", {
    사용: "\"name\"·\"email\"처럼 브라우저·OS 자동 완성에 넘깁니다.",
  }),
  option("PromptOptions.multiline", "boolean", "false", "여러 줄 입력(Textarea)으로 엽니다.", {
    사용: "Enter는 줄바꿈이고, Ctrl/⌘+Enter나 확인 버튼으로 확정합니다.",
  }),
  option("PromptOptions.label", "string", "title", "입력칸 위 라벨입니다.", {
    사용: "생략하면 제목이 입력칸의 이름이 됩니다. message는 입력칸 설명으로 연결되어 화면 낭독기가 함께 읽습니다.",
  }),
  option("PromptOptions.maxLength", "number", "—", "최대 글자 수입니다.", {
    사용: "라벨 오른쪽에 \"3 / 20\"처럼 글자 수를 표시하고, 그보다 길게 입력되지 않습니다. 표시는 사용자가 보는 글자 단위(이모지 하나 = 1)이고 입력 제한은 브라우저·OS 기준(UTF-16)입니다. 글자 수는 화면 낭독기 이름에 섞지 않습니다.",
  }),
  option("PromptOptions.requiredValue", "string", "—", "정확히 이 값을 입력해야 확인할 수 있습니다.", {
    사용: "삭제할 대상의 이름처럼 위험한 동작을 한 번 더 확인할 때 씁니다. 라벨은 \"확인을 위해 이름 입력\"(메시지 typeToConfirm)이 되고, 입력이 같아질 때까지 확인 버튼이 꺼져 있습니다. 앞뒤 공백과 한글 조합 방식(NFC/NFD) 차이는 같은 값으로 봅니다.",
  }),
  option("PromptOptions.onConfirm", "(value: string) => void | Promise<void>", "—", "입력을 확정하기 전에 실행할 작업입니다.", {
    "발생 시점": "validator를 통과한 뒤 확인 실행 시 호출합니다.",
    전달값: "현재 입력 문자열",
    반환값: "Promise이면 완료를 기다린 뒤 prompt가 그 값으로 끝납니다. throw·reject하면 창을 닫지 않고 오류 메시지(없으면 invalidInput)를 입력칸 오류로 보여 줍니다.",
    "상태 책임": "진행 중에는 확인 버튼이 로딩이고 취소·바깥 누름·Escape로 닫히지 않습니다.",
  }),
  option("PromptOptions.placeholder", "string", "—", "입력 안내 문자열입니다.", {
    사용: "값이 비어 있을 때 표시합니다.",
  }),
  option(
    "PromptOptions.validator",
    "(value: string) => boolean | string | Promise<boolean | string>",
    "—",
    "입력 값을 검증합니다.",
    {
      "발생 시점": "Prompt 확인 실행 시 호출합니다.",
      전달값: "현재 입력 문자열",
      반환값:
        "true이면 확정, false이면 기본 오류, 문자열이면 해당 오류를 표시합니다. Promise도 받으며, 확인 중에는 확인 버튼이 로딩입니다.",
      "상태 책임":
        "소비자가 true·false·메시지를 반환하도록 구현하세요. validator가 throw하는 경우의 복구를 서비스 계약으로 보장하지 않습니다.",
    },
  ),
];
const ownership = [
  "알림·요청 대기열·진행 중 표시·입력 초안: 해당 KjunFeedbackProvider 영역이 관리합니다.",
  "토스트 개수: KjunFeedbackProvider의 maxToasts(기본 3)만큼 쌓고, 넘치면 자동으로 닫히는 가장 오래된 알림부터 닫습니다. 새 알림은 들어오는 가장자리에 가장 가깝게(위 배치는 맨 위, 아래 배치는 맨 아래) 놓입니다.",
  "토스트 닫기: 닫기 버튼 외에 터치로 옆으로 밀어 닫을 수 있습니다. 자동으로 닫히지 않는 알림(duration 0)은 closable이 false여도 닫기 버튼을 둡니다. 오류만 role=alert로 바로 읽히고 나머지는 role=status로 말이 끝난 뒤 읽힙니다. iOS VoiceOver에는 알림이 나타날 때 읽어 줍니다.",
  "토스트 위치: KjunFeedbackProvider의 placement(\"top\" 기본·\"bottom\")로 화면 위나 아래에 쌓습니다. 넓은 웹 화면은 오른쪽, 좁은 화면과 Native는 전체 폭입니다. 토스트는 KjunProvider의 safeArea(웹은 없으면 env(safe-area-inset-*))만큼 가장자리에서 더 떨어지고, offset으로 하단 내비게이션 높이처럼 거리를 더 둘 수 있습니다.",
  "실제 저장·검증·성공 후 이동: 소비자가 콜백과 반환 Promise에서 처리합니다.",
  "Provider 해제: 미완료 Confirm은 false, Prompt는 null로 정리하고 알림 타이머와 대기열을 제거합니다. controller로 받은 컨트롤러는 정리하지 않으며, Provider가 없는 동안 부른 요청은 다음에 마운트되는 Provider가 표시합니다.",
  "컴포넌트 밖 호출: 모듈에서 const feedback = createKjunFeedback()을 한 번 만들고 <KjunFeedbackProvider controller={feedback}>에 넘기면 같은 confirm·prompt·toast를 일반 함수에서 부를 수 있습니다. 한 컨트롤러를 동시에 두 Provider에 넘기지 마세요(개발 모드 경고).",
];
export default Object.fromEntries(
  ["vue3", "react", "native"].map((platform) => [
    platform,
    {
      ownership: [
        ...ownership,
        "useKjunFeedback()은 KjunFeedbackProvider 안에서 호출합니다. Vue는 setup에서 호출합니다. createKjunFeedback()의 결과는 같은 메서드를 가지며 어디서든 호출합니다.",
        ...(platform === "native"
          ? ["Native KjunFeedbackProvider는 앱 화면을 감싸는 View가 부모 크기를 그대로 이어받습니다. 레이아웃을 바꾸려면 style을 넘깁니다."]
          : []),
      ],
      methods,
      options,
    },
  ]),
);
