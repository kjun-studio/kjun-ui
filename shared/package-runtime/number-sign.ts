/**
 * Tabular figures give a leading + or - a whole figure's width (Inter's tnum does), so the sign floats apart
 * from the digits ("- 1.25%"). The sign is split off and drawn with proportional figures, tight to the number,
 * while the digits keep their tabular widths. The text itself is unchanged.
 */
export function splitNumberSign(value: unknown): [sign: string, rest: string] | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value), match = /^[+\-−](?=[\d.,])/.exec(text);
  return match ? [match[0], text.slice(1)] : null;
}
