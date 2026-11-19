import { detail, event, fields } from "./helpers.mjs";
// KjunEventCalendar descriptions, shared by extensions.mjs. Vue 3 names its controlled values v-model (modelValue),
// v-model:month and v-model:week, and takes the long press as the onDayLongPress prop (a template @day-long-press).
const marksDetail = platform => detail("날짜마다 칸 아래에 그릴 표시를 돌려줍니다. 없으면 undefined를 돌려줍니다.", {
  "반환값": "DayMarks: spans(막대), icon(아이콘), dots(점 색 배열), count(일정 수)입니다. 모두 선택입니다.",
  "표시 색": "색은 앱이 넘깁니다. " + (platform === "native" ? "Native는 ColorValue" : "웹은 CSS 색 문자열(var(--kjun-...) 권장)") + "이며 패키지에 표시용 팔레트는 없습니다. danger 색은 휴일 숫자에 쓰이므로 일정 색으로 쓰지 않는 편이 읽기 쉽습니다.",
  "막대": "숫자 바로 아래(1px)에서 칸을 가로지르는 높이 5px 막대이고 점·아이콘은 그 아래 줄에 놓입니다. 다른 달 날짜에서는 투명도 0.45로 흐립니다. 날마다 spans의 첫 항목만 그립니다. 컴포넌트는 이웃 날을 살피지 않으므로, 일정이 겹쳐도 같은 일정을 그 기간 내내 첫 항목으로 넘겨야 막대가 끊기지 않습니다.",
  "점·아이콘": "점은 지름 5px로 최대 3개이고 넘치면 자릅니다. 아이콘은 11px 하나를 점 앞에 그리며 icon.name은 KJUN 아이콘 이름입니다.",
  "count": "화면에는 그리지 않고 읽기 이름의 '일정 N개'에만 씁니다.",
  "호출": "보이는 날마다 렌더링할 때 부르므로 가볍게 계산해 돌려줍니다.",
});
const summaries = platform => ({
  view: { type: '"month" | "week"', default: '"month"', summary: "한 달 전체(month) 또는 한 주(week)를 그립니다. 한 달 보기는 항상 6주를 그려 달을 넘겨도 높이가 변하지 않고, 한 주 보기는 다른 달 날짜를 흐리게 하지 않습니다." },
  month: { type: "string", summary: "보여 줄 달(YYYY-MM)입니다. 제어 값이며 없거나 형식이 틀리면 이번 달입니다. 제목과 이전·다음 버튼은 컴포넌트가 그리지 않으므로 앱이 제목 줄을 만들고 버튼으로 이 값을 바꿉니다." },
  week: { type: "string", summary: "한 주 보기에서 보여 줄 주입니다. 그 주의 아무 날(YYYY-MM-DD)이며 weekStart에 맞춰 그 주의 첫날로 정리하고, 없으면 이번 주입니다. 제어 값입니다. 날짜 칸 묶음은 그 주의 첫날과 끝날로 읽습니다(예: 2026년 11월 29일 – 12월 5일)." },
  [platform === "vue3" ? "modelValue" : "value"]: { type: "string | null", default: "null", summary: "고른 날(YYYY-MM-DD)입니다. null이면 아무것도 고르지 않은 상태로 그립니다. 날짜를 눌러도 값은 앱이 바꾸며, 고르기를 풀지도 앱이 정합니다." + (platform === "vue3" ? " v-model로 연결합니다." : "") },
  dayLongPressLabel: { type: "string", summary: "길게 누르기가 무슨 동작인지 화면 낭독기에 알리는 문구입니다(예: \"이날 약속 추가\"). onDayLongPress가 있을 때만 쓰입니다." },
  marks: { type: "(iso: string) => DayMarks | undefined", ...marksDetail(platform) },
  isHoliday: { type: "(iso: string) => string | boolean", ...detail("휴일이면 숫자를 danger 색으로 그립니다.", { "반환값": "true는 휴일 표시만, 문자열은 표시와 함께 그 이름을 읽기 이름에 넣습니다. false나 빈 값은 휴일이 아닙니다.", "책임": "어느 날이 휴일인지는 앱이 정합니다. 패키지에 휴일 목록은 없습니다." }) },
  dimPast: { type: "boolean", default: "true", summary: "오늘 이전 날의 숫자와 점·아이콘을 투명도 0.45로 흐리게 합니다. 빨강·파랑 숫자는 0.7입니다. 여러 날 막대는 흐리게 하지 않습니다(다른 달 날짜의 막대만 0.45)." },
  weekStart: { type: "0 | 1 | 2 | 3 | 4 | 5 | 6", default: "0", summary: "주의 첫 요일입니다. 0은 일요일, 1은 월요일입니다. 요일 줄과 한 주 보기의 시작, 키보드 Home·End가 함께 바뀝니다." },
  markSunday: { type: "boolean", default: "true", summary: "일요일을 danger 역할로 칠합니다. 끄면 일요일도 다른 요일과 같은 색입니다. 휴일은 이 값과 상관없이 danger입니다." },
  markSaturday: { type: "boolean", default: "true", summary: "토요일을 info 역할로 칠합니다. 끄면 토요일도 다른 요일과 같은 색입니다." },
  swipeable: { type: "boolean", default: "true", summary: "가로로 넘겨 달(주)을 바꿉니다. 가로 이동이 20을 넘고 세로 이동의 2배보다 클 때만 잡아 바깥 세로 스크롤과 다투지 않습니다. 웹(Native 웹 미리보기 포함)에서는 터치 입력만 잡고 마우스 끌기는 달을 바꾸지 않습니다. 달을 바꾸려는 요청은 onMonthChange·onWeekChange로 알립니다." },
  className: { summary: "루트에 KJUN 클래스 뒤로 더할 클래스입니다. 바깥 여백·배치에 씁니다." },
  style: { summary: "루트에 더할 스타일입니다. 바깥 여백·배치에 씁니다." },
  id: { summary: "루트 요소의 id입니다. 레이블이나 앵커가 달력을 가리킬 때 씁니다." },
});
const monthWhen = "스와이프, 키보드로 보이는 달을 벗어날 때, 한 달 보기에서 다른 달 날짜를 누를 때(onSelect 다음)";
const callbacks = platform => ({
  onMonthChange: event("다른 달을 보여 달라고 요청합니다.", monthWhen, "string: 보여 줄 달(YYYY-MM)", "반환값을 사용하지 않습니다.", "앱이 month를 바꿉니다. 이 콜백을 주지 않으면 화면의 달은 바뀌지 않으며, 키보드 이동은 보이는 달의 끝에서 멈춥니다. 제목 줄의 이전·다음 버튼도 같은 값을 바꿉니다."),
  onWeekChange: event("다른 주를 보여 달라고 요청합니다.", "스와이프나 키보드로 보이는 주를 벗어날 때", "string: 보여 줄 주의 첫날(YYYY-MM-DD, weekStart 기준)", "반환값을 사용하지 않습니다.", "앱이 week를 바꿉니다. 이 콜백을 주지 않으면 화면의 주는 바뀌지 않습니다."),
  onSelect: event("누른 날을 알립니다.", "날짜 칸을 누르거나 키보드로 Enter를 누를 때. 다른 달 날짜는 이 알림 다음에 onMonthChange가 옵니다", "string: 누른 날(YYYY-MM-DD)", "반환값을 사용하지 않습니다.", "앱이 value를 바꿉니다. 같은 날을 다시 눌렀을 때 고르기를 풀지는 앱이 정합니다."),
  onDayLongPress: event("날짜를 길게 눌렀음을 알립니다.", platform === "native" ? "날짜 칸을 길게 누를 때. 화면 낭독기에는 사용자 동작(길게 누르기)으로도 알려 주고, 웹 미리보기에서는 키보드 Shift+Enter로도 부릅니다" : "터치로 길게 누르거나(스와이프가 시작되면 취소) 마우스 오른쪽 클릭, 키보드 Shift+Enter를 할 때. 이 콜백이 없으면 오른쪽 클릭 메뉴는 브라우저에 맡기고 Enter는 날짜 고르기만 합니다", "string: 누른 날(YYYY-MM-DD)", "반환값을 사용하지 않습니다.", "앱이 그 날의 편집 화면 등을 엽니다. " + (platform === "vue3" ? "템플릿에서는 @day-long-press로 연결하며, 이 항목은 emits가 아니라 prop이라 이벤트 목록에는 없습니다. " : "") + "이 콜백이 있을 때만 길게 누르기와 그 읽기 이름이 켜집니다."),
  ...(platform === "vue3" ? {
    "onUpdate:month": event("v-model:month의 갱신입니다.", monthWhen, "string: 보여 줄 달(YYYY-MM)", "반환값을 사용하지 않습니다.", "템플릿에서는 v-model:month나 @update:month로 연결합니다. 이 prop이 있는지로 달을 바꿀 수 있는지 판단하므로 연결하지 않으면 화면의 달은 바뀌지 않습니다."),
    "onUpdate:week": event("v-model:week의 갱신입니다.", "스와이프나 키보드로 보이는 주를 벗어날 때", "string: 보여 줄 주의 첫날(YYYY-MM-DD)", "반환값을 사용하지 않습니다.", "템플릿에서는 v-model:week나 @update:week로 연결합니다. 연결하지 않으면 화면의 주는 바뀌지 않습니다."),
  } : {}),
});
/** The entry of one binding key for KjunEventCalendar. */
export function eventCalendarProp(key, platform) {
  const entry = key.startsWith("on") ? callbacks(platform)[key] : summaries(platform)[key];
  if (!entry) throw Error("Missing extension prop description: KjunEventCalendar." + key);
  return { ...entry };
}
/** Vue 3 emitted events by event name. */
export const eventCalendarEvents = {
  "update:month": callbacks("vue3")["onUpdate:month"],
  "update:week": callbacks("vue3")["onUpdate:week"],
  "update:modelValue": event("고른 날이 바뀌었음을 알립니다(v-model).", "날짜 칸을 누르거나 Enter를 누를 때", "string: 누른 날(YYYY-MM-DD)", "반환값을 사용하지 않습니다.", "v-model이 값을 갱신합니다. 고르기를 풀지는 앱이 정합니다."),
  select: event("누른 날을 알립니다.", "날짜 칸을 누르거나 Enter를 누를 때. 다른 달 날짜는 이 알림 다음에 update:month가 옵니다", "string: 누른 날(YYYY-MM-DD)", "반환값을 사용하지 않습니다.", "v-model과 같은 날을 알립니다. 값을 따로 읽을 때 씁니다."),
};
export const eventCalendarTypes = platform => [
  fields("DayMarks", "marks가 돌려주는 날짜 하나의 표시입니다.", [["spans", "DaySpan[] | undefined", "여러 날에 걸친 막대입니다. 첫 항목만 그리므로 겹치는 일정은 같은 일정을 기간 내내 첫 항목으로 넘깁니다."], ["icon", "{ name: string; color: " + (platform === "native" ? "ColorValue" : "string") + " } | undefined", "점 앞에 그릴 11px 아이콘입니다."], ["dots", (platform === "native" ? "ColorValue" : "string") + "[] | undefined", "점의 색 배열입니다. 지름 5px로 최대 3개를 그립니다."], ["count", "number | undefined", "일정 수입니다. 화면에는 그리지 않고 읽기 이름에만 씁니다."]]),
  fields("DaySpan", "막대 하나입니다. 시작·끝 날과 주의 양 끝만 모서리를 둥글게 그립니다.", [["color", platform === "native" ? "ColorValue" : "string", "막대 색입니다."], ["start", "string", "시작 날(YYYY-MM-DD)입니다."], ["end", "string", "끝 날(YYYY-MM-DD)입니다. 시작 날보다 앞서면 그리지 않습니다."]]),
];
