// Framework-free slider presentation shared by the React, Vue and Native sliders: number text, marks and overlapping thumbs.

export interface KjunSliderMark {
  value: number;
  /** Drawn under the rail; leave it out for a dot only. */
  label?: string;
}
export type SliderMarks = boolean | KjunSliderMark[];

/** Without formatValue the value follows the locale's number grouping, the same text screen readers hear. */
export function sliderFormatter(formatValue: ((value: number) => string) | undefined, locale?: string) {
  if (formatValue) return formatValue;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 6 });
  return (value: number) => format.format(value);
}

/** Two equal values read as one. */
export function sliderValueText(values: readonly number[], format: (value: number) => string) {
  return values.length === 2 && values[0] === values[1] ? format(values[0]) : values.map(format).join(" – ");
}

/** marks={true} puts a dot on every step (up to 24 of them); an array places dots, and labels, at the given values. */
export function sliderMarks(marks: SliderMarks | undefined, min: number, max: number, step: number, values: readonly number[]) {
  if (!marks || !(max > min)) return [];
  const list: KjunSliderMark[] = marks === true
    ? (max - min) / step <= 24 ? Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => ({ value: min + i * step })) : []
    : marks.filter(mark => mark.value >= min && mark.value <= max);
  const low = values.length === 2 ? values[0] : min, high = values[values.length - 1];
  return list.map(mark => ({
    ...mark,
    fraction: (mark.value - min) / (max - min),
    // On the fill the dot turns light; at the thumbs themselves it is hidden under them anyway.
    active: mark.value > low && mark.value < high,
    edge: mark.value === min ? "start" as const : mark.value === max ? "end" as const : undefined,
  }));
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
