import type { ExampleTools } from "./example-tools";
/** The calendar examples: a month with marks, a week in a card and a long press that adds. The screen draws the title row. */
export function renderEventCalendarExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action, settings, platform, colors } = tools;
  switch (name) {
    case "KjunEventCalendar": {
      const pad = (value: number) => String(value).padStart(2, "0");
      const isoOf = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      const addDays = (iso: string, days: number) => isoOf(new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)) + days));
      const addMonths = (month: string, delta: number) => isoOf(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1)).slice(0, 7);
      const titleOf = (iso: string) => `${iso.slice(0, 4)}년 ${Number(iso.slice(5, 7))}월`;
      const today = isoOf(new Date()), weekStart = settings.weekStart === "월요일" ? 1 : 0, week = settings.view === "week";
      // The app passes the mark colors; these come from the docs demo palette.
      const markColor = (role: string) => platform === "native" ? colors[role] : `var(--kjun-${role})`;
      const added: string[] = get("added", []);
      const marks = (iso: string) => {
        const month = iso.slice(0, 7), day = Number(iso.slice(8, 10));
        return {
          ...(day >= 12 && day <= 14 ? { spans: [{ color: markColor("warning"), start: month + "-12", end: month + "-14" }] } : {}),
          ...(day === 3 ? { dots: [markColor("success")] } : day === 8 ? { dots: [markColor("brand"), markColor("warning")], count: 2 } : day === 20 ? { dots: [markColor("success"), markColor("brand"), markColor("warning")], count: 3 } : {}),
          ...(day === 10 ? { icon: { name: "heart", color: markColor("brand") } } : {}),
          ...(added.includes(iso) ? { dots: [markColor("brand")], count: 1 } : {}),
        };
      };
      const isHoliday = (iso: string) => iso.slice(8) === "05" ? "임시 휴일" : false;
      const picked = get("picked", week ? null : today);
      const common = { marks, isHoliday, dimPast: settings.dimPast, markSaturday: settings.markSaturday, swipeable: settings.swipeable, weekStart,
        value: picked, onSelect: change("picked"), ...(settings.longPress ? { dayLongPressLabel: "이날 약속 추가", onDayLongPress: (iso: string) => set("added", [...added, iso]) } : {}) };
      const nav = (label: string, icon: string, fn: () => void) => h("KjunButton", { variant: "ghost", shape: "circle", prefixIcon: icon, ariaLabel: label, ...action(fn) });
      const status = h("KjunText", { tone: "secondary" }, week || !settings.longPress ? `고른 날: ${picked ?? "없음"}` : added.length ? `약속을 추가한 날: ${added.join(", ")}` : "날짜를 길게 눌러 약속을 추가해 보세요.");
      if (week) {
        const first = get("week", today);
        const move = (delta: number) => set("week", addDays(first, 7 * delta));
        const calendar = h(name, { ...common, view: "week", week: first, onWeekChange: change("week") });
        return h("Stack", {}, [
          h("Box", { width: 360 }, h("KjunCard", { title: titleOf(first), headerActions: h("Group", {}, [nav("이전 주", "chevron-left", () => move(-1)), nav("다음 주", "chevron-right", () => move(1))]) }, calendar)),
          status]);
      }
      const month = get("month", today.slice(0, 7));
      return h("Stack", {}, [
        h("Box", { width: 360 }, h("Stack", {}, [
          h("Group", {}, [nav("이전 달", "chevron-left", () => set("month", addMonths(month, -1))), h("KjunText", { variant: "cardTitle" }, titleOf(month + "-01")), nav("다음 달", "chevron-right", () => set("month", addMonths(month, 1)))]),
          h(name, { ...common, view: "month", month, onMonthChange: change("month") })])),
        status]);
    }
  }
}
