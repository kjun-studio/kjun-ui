// Framework-free Sparkline geometry shared by the React, Vue and Native renderers.
export interface SparkPoint { x: number; y: number }
export interface SparkBar { x: number; y: number; width: number; height: number; last: boolean }
export interface SparklineGeometry {
  /** Unbroken runs of finite values; a run of one value is drawn as a dot. */
  segments: SparkPoint[][];
  /** Closed area polygons ("x,y x,y …") under each run of two or more points. */
  areas: string[];
  end?: SparkPoint;
  baselineY?: number;
  bars: SparkBar[];
  /** Direction for the color: the last value against the baseline, or else the first value. */
  direction: -1 | 0 | 1;
  empty: boolean;
}
export interface SparklineOptions {
  width: number; height: number; strokeWidth: number; dotRadius: number; barGap: number;
  variant?: "line" | "bar"; baseline?: number; min?: number; max?: number; endDot?: boolean;
}

export function sparklineGeometry(data: readonly number[], o: SparklineOptions): SparklineGeometry {
  const values = data.filter(Number.isFinite);
  const empty = !values.length;
  const last = values[values.length - 1], reference = o.baseline ?? values[0];
  const direction = values.length > 1 || (o.baseline != null && values.length) ? (Math.sign(last - reference) as -1 | 0 | 1) : 0;
  if (empty) return { segments: [], areas: [], bars: [], direction: 0, empty };
  if (o.variant === "bar") {
    // Bars grow from zero (or min) so their heights compare honestly.
    const floor = o.min ?? Math.min(0, ...values), top = Math.max(o.max ?? -Infinity, ...values);
    const span = top - floor || 1, count = data.length, width = (o.width - o.barGap * (count - 1)) / count;
    const lastIndex = data.map(Number.isFinite).lastIndexOf(true);
    const bars = data.flatMap((v, i) => Number.isFinite(v)
      ? [{ x: i * (width + o.barGap), width, height: Math.max(o.barGap, ((v - floor) / span) * o.height), y: 0, last: i === lastIndex }].map((b) => ({ ...b, y: o.height - b.height }))
      : []);
    return { segments: [], areas: [], bars, direction, empty };
  }
  // The inset leaves room for the stroke and the end dot, so neither is clipped at the edges.
  const inset = Math.max(o.strokeWidth / 2, o.endDot === false ? 0 : o.dotRadius) + 1;
  let lo = Math.min(...values), hi = Math.max(...values);
  if (o.baseline != null) { lo = Math.min(lo, o.baseline); hi = Math.max(hi, o.baseline); }
  if (o.min != null) lo = Math.min(lo, o.min);
  if (o.max != null) hi = Math.max(hi, o.max);
  const flat = hi === lo;
  const x = (i: number) => inset + (i / Math.max(1, data.length - 1)) * (o.width - inset * 2);
  const y = (v: number) => flat ? o.height / 2 : inset + (o.height - inset * 2) * (1 - (v - lo) / (hi - lo));
  const segments: SparkPoint[][] = [];
  let run: SparkPoint[] = [];
  data.forEach((v, i) => {
    if (Number.isFinite(v)) run.push({ x: x(i), y: y(v) });
    else if (run.length) { segments.push(run); run = []; }
  });
  if (run.length) segments.push(run);
  const baselineY = o.baseline != null ? y(o.baseline) : undefined, floorY = baselineY ?? o.height;
  const areas = flat ? [] : segments.filter((s) => s.length > 1)
    .map((s) => [`${s[0].x},${floorY}`, ...s.map((p) => `${p.x},${p.y}`), `${s[s.length - 1].x},${floorY}`].join(" "));
  const tail = segments[segments.length - 1];
  return { segments, areas, end: tail[tail.length - 1], baselineY, bars: [], direction, empty };
}
