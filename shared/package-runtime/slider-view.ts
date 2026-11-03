// Framework-free slider rules shared by the React, Vue and Native sliders: number text, marks, keys, pointer positions,
// overlapping thumbs and the drag session (Vue and Native drive it; React lets React Aria drive single drags).

export interface KjunSliderMark {
  value: number;
  /** Drawn beside the rail; leave it out for a dot only. Pressing a label moves the nearer thumb there. */
  label?: string;
}
export type SliderMarks = boolean | KjunSliderMark[];
export type SliderOrientation = "horizontal" | "vertical";

const decimals = (value: number) => {
  const text = String(value);
  return text.includes("e-") ? Number(text.split("e-")[1]) : (text.split(".")[1] ?? "").length;
};
const formatters = new Map<string, (value: number) => string>();
/**
 * Without formatValue the value follows the locale's number grouping with as many decimals as min and step use, so
 * 0.5 steps read 1.0 · 1.5 and the text keeps its width while dragging. Formatters are cached per locale and precision.
 */
export function sliderFormatter(formatValue: ((value: number) => string) | undefined, locale?: string, min = 0, step = 1) {
  if (formatValue) return formatValue;
  const digits = Math.min(6, Math.max(decimals(min), decimals(step)));
  const key = (locale ?? "") + "|" + digits;
  let format = formatters.get(key);
  if (!format) {
    const intl = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
    format = (value: number) => intl.format(value);
    formatters.set(key, format);
  }
  return format;
}

/** The visible value: formatRange for a range when given, else two equal values read as one. */
export function sliderValueText(values: readonly number[], format: (value: number) => string, formatRange?: (start: number, end: number) => string) {
  if (values.length === 2 && formatRange) return formatRange(values[0], values[1]);
  return values.length === 2 && values[0] === values[1] ? format(values[0]) : values.map(format).join(" – ");
}

let warnedMarks = false;
/**
 * marks={true} puts a dot on every step (up to 24 of them); an array places dots, and labels, at the given values.
 * The rail's own ends need no dot, so marks at min and max keep only their labels.
 */
export function sliderMarks(marks: SliderMarks | undefined, min: number, max: number, step: number, values: readonly number[], layout: SliderLayout = {}) {
  if (!marks || !(max > min)) return [];
  const steps = Math.round((max - min) / step);
  if (marks === true && steps > 24 && !warnedMarks) {
    warnedMarks = true;
    console.warn(`KJUN Slider: marks={true}는 step이 24개 이하일 때만 점을 그립니다(지금 ${steps}개). 값 배열로 원하는 위치만 넘기세요.`);
  }
  const list: KjunSliderMark[] = marks === true
    ? steps <= 24 ? Array.from({ length: steps + 1 }, (_, i) => ({ value: min + i * step })) : []
    : marks.filter(mark => mark.value >= min && mark.value <= max);
  const high = values[values.length - 1];
  return list.map(mark => ({
    ...mark,
    fraction: (mark.value - min) / (max - min),
    /** Offset from the left (or the top when vertical), like the thumbs. */
    position: sliderAxis((mark.value - min) / (max - min), layout),
    // On the fill the dot turns light: a single slider fills from min, a range between its thumbs.
    active: values.length === 2 ? mark.value > values[0] && mark.value < high : mark.value < high,
    dot: mark.value !== min && mark.value !== max,
    // Which rail end an end label aligns to: the visual left or right (vertical labels sit beside the rail and need none).
    edge: layout.vertical || (mark.value !== min && mark.value !== max) ? undefined
      : (mark.value === min) !== !!layout.rtl ? "start" as const : "end" as const,
  }));
}

export interface SliderLayout { rtl?: boolean; vertical?: boolean }
// The languages React Aria lays out right to left; Vue reads the Provider locale through this so all web sliders agree.
const rtlLanguages = new Set(["ae", "ar", "arc", "bcc", "bqi", "ckb", "dv", "fa", "glk", "he", "ku", "mzn", "nqo", "pnb", "ps", "sd", "ug", "ur", "yi"]);
export function localeIsRtl(locale?: string) {
  if (!locale) return false;
  const script = /-(Arab|Hebr|Thaa|Syrc|Nkoo|Adlm|Rohg)\b/.test(locale), latin = /-Latn\b/.test(locale);
  return script || (!latin && rtlLanguages.has(locale.split("-")[0].toLowerCase()));
}
/** A fraction as an offset from the left (or the top): right-to-left and vertical sliders run the other way, like React Aria. */
export function sliderAxis(fraction: number, { rtl = false, vertical = false }: SliderLayout = {}) {
  return vertical || rtl ? 1 - fraction : fraction;
}
/**
 * The fill as leading and trailing offsets (percent of the track, from the left/top and from the right/bottom). null is
 * the rail's own end, half a thumb past the track: a single slider fills from there, a range between its thumbs.
 */
export function sliderFillBox(fractions: readonly number[], layout: SliderLayout = {}): { lead: number | null; trail: number | null } {
  const ends = fractions.map(fraction => sliderAxis(fraction, layout) * 100);
  if (ends.length === 2) return { lead: Math.min(...ends), trail: 100 - Math.max(...ends) };
  // The fill grows from min: the left, or the right in right-to-left layouts, or the bottom when vertical.
  return layout.vertical || layout.rtl ? { lead: ends[0], trail: null } : { lead: null, trail: 100 - ends[0] };
}

/** PageUp/PageDown move a tenth of the range, on the step grid and at least one step, like React Aria. */
export function sliderPageSize(min: number, max: number, step: number) {
  const tenth = Math.floor((max - min) / 10 / step) * step;
  return Math.max(step, tenth);
}

/** The key's next value, or null. Right-to-left layouts swap the meaning of the horizontal arrows. */
export function sliderKeyValue(key: string, value: number, min: number, max: number, step: number, rtl = false) {
  if (key === "Home") return min;
  if (key === "End") return max;
  if (key === "PageUp" || key === "PageDown") return value + (key === "PageUp" ? 1 : -1) * sliderPageSize(min, max, step);
  const delta: Record<string, number> = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowUp: 1, ArrowDown: -1 };
  return key in delta ? value + delta[key] * step : null;
}

/** The value under a pointer, from its offset along the track (from the left, or the top when vertical). */
export function sliderValueAt(offset: number, length: number, min: number, max: number, { rtl = false, vertical = false } = {}) {
  let fraction = Math.max(0, Math.min(1, offset / Math.max(1, length)));
  if (vertical || rtl) fraction = 1 - fraction;
  return min + fraction * (max - min);
}

/** Where each thumb sits (0–1). Invalid settings keep the app's values in view, clamped to the given range when it has one. */
export function sliderFractions(values: readonly number[], min: number, max: number) {
  return values.map(value => max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0);
}

/** Overlapping range thumbs: the one that can still move goes on top (the start thumb near the top end, the end thumb elsewhere). */
export function sliderFrontThumb(values: readonly number[], min: number, max: number): 0 | 1 | null {
  if (values.length !== 2 || values[0] !== values[1]) return null;
  return values[0] >= (min + max) / 2 ? 0 : 1;
}

/** The thumb a press moves: the nearer one, or with both on one value, the side of the press ("pending" when on the value itself). */
export function sliderPick(values: readonly number[], number: number, snapped: number): { index: 0 | 1; pending: boolean } {
  if (values.length !== 2) return { index: 0, pending: false };
  if (values[0] === values[1]) {
    if (snapped === values[0]) return { index: values[0] >= number ? 0 : 1, pending: true };
    return { index: number > values[0] ? 1 : 0, pending: false };
  }
  return { index: Math.abs(number - values[1]) < Math.abs(number - values[0]) ? 1 : 0, pending: false };
}

export interface SliderSessionOptions {
  min(): number;
  max(): number;
  step(): number;
  snap(value: number): number;
  blocked(): boolean;
  emit(values: number[]): void;
  commit(values: number[]): void;
  /** Moves keyboard focus to the thumb a press or a direction choice picked. */
  focus?(index: number): void;
}
/**
 * One slider's value changes: clamping against the other thumb, the overlapping-thumb direction choice, and one commit
 * per gesture or key. `sync` takes the app's values between gestures; during a gesture the session leads them.
 */
export function createSliderSession(initial: readonly number[], options: SliderSessionOptions) {
  let latest = [...initial], dirty = false, pending = false, active: number | null = null;
  const update = (index: number, number: number) => {
    if (options.blocked()) return;
    const next = [...latest];
    next[index] = Math.min(index === 0 && next.length === 2 ? next[1] : options.max(),
      Math.max(index === 1 ? next[0] : options.min(), options.snap(number)));
    if (next[index] === latest[index]) return;
    latest = next; dirty = true;
    options.emit([...next]);
  };
  const commit = () => {
    if (options.blocked() || !dirty) return;
    dirty = false;
    options.commit([...latest]);
  };
  return {
    get values() { return latest; },
    get active() { return active; },
    sync(values: readonly number[]) { if (active === null) latest = [...values]; },
    update,
    commit,
    press(number: number) {
      if (options.blocked()) return null;
      const pick = sliderPick(latest, number, options.snap(number));
      active = pick.index; pending = pick.pending;
      options.focus?.(active);
      update(active, number);
      return active;
    },
    move(number: number) {
      if (active === null) return active;
      if (pending) {
        if (options.snap(number) === latest[0]) return active;
        active = number > latest[0] ? 1 : 0;
        pending = false;
        options.focus?.(active);
      }
      update(active, number);
      return active;
    },
    release() {
      if (active === null) return;
      active = null; pending = false;
      commit();
    },
    cancel() { active = null; pending = false; dirty = false; },
    key(index: number, key: string, rtl = false) {
      const next = sliderKeyValue(key, latest[index], options.min(), options.max(), options.step(), rtl);
      if (next === null) return false;
      update(index, next);
      return true;
    },
  };
}
export type SliderSession = ReturnType<typeof createSliderSession>;
