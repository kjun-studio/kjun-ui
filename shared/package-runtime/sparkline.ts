// Framework-free Sparkline geometry shared by the React, Vue and Native renderers.
import { tokens } from "@kjun-ui/tokens";
export interface SparkPoint { x: number; y: number }
export interface SparkBar { x: number; y: number; width: number; height: number; last: boolean }
export interface SparklineGeometry {
  /** Unbroken runs of finite values; a run of one value is drawn as a dot. */
  segments: SparkPoint[][];
  /** Closed area polygons ("x,y x,y …") under each run of two or more points; against a baseline, only on the side the series moved to. */
  areas: string[];
  end?: SparkPoint;
  baselineY?: number;
  bars: SparkBar[];
  /** Direction for the color: the last value against the baseline, or else the first value. */
  direction: -1 | 0 | 1;
  empty: boolean;
}
export interface SparklineOptions {
  width: number; height: number; strokeWidth: number;
  /** Token defaults; tests pass their own. */
  dotRadius?: number; barGap?: number; barMinHeight?: number;
  variant?: "line" | "bar"; baseline?: number; min?: number; max?: number; endDot?: boolean;
}

/** A series in time order: null, undefined and non-finite numbers are gaps. */
export type SparklineData = readonly (number | null | undefined)[];
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function sparklineGeometry(data: SparklineData, options: SparklineOptions): SparklineGeometry {
  const spec = tokens.extensions.financial;
  const o = { dotRadius: spec.sparklineDotSize / 2, barGap: spec.sparklineBarGap, barMinHeight: spec.sparklineBarMinHeight, ...options };
  const values = data.filter(finite);
  const empty = !values.length;
  const last = values[values.length - 1], reference = o.baseline ?? values[0];
  const direction = values.length > 1 || (o.baseline != null && values.length) ? (Math.sign(last - reference) as -1 | 0 | 1) : 0;
  if (empty) return { segments: [], areas: [], bars: [], direction: 0, empty };
  if (o.variant === "bar") {
    // Bars grow from the baseline (or zero): values below it hang down, so losses never read as small gains.
    const origin = o.baseline ?? 0;
    let lo = o.min ?? origin, hi = o.max ?? origin;
    for (const v of values) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const span = hi - lo || 1, count = data.length, width = (o.width - o.barGap * (count - 1)) / count;
    const y = (v: number) => o.height * (1 - (v - lo) / span), zero = y(Math.min(hi, Math.max(lo, origin)));
    const lastIndex = data.map(finite).lastIndexOf(true);
    const bars = data.flatMap((v, i) => {
      if (!finite(v)) return [];
      const height = Math.max(o.barMinHeight, Math.abs(y(v) - zero));
      return [{ x: i * (width + o.barGap), y: v < origin ? zero : zero - height, width, height, last: i === lastIndex }];
    });
    const crosses = o.baseline != null || values.some((v) => v < origin);
    return { segments: [], areas: [], bars, baselineY: crosses ? zero : undefined, direction, empty };
  }
  // The inset leaves room for the stroke and the end dot, so neither is clipped at the edges.
  const inset = Math.max(o.strokeWidth / 2, o.endDot === false ? 0 : o.dotRadius) + 1;
  let lo = Infinity, hi = -Infinity;
  for (const v of values) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if (o.baseline != null) { lo = Math.min(lo, o.baseline); hi = Math.max(hi, o.baseline); }
  if (o.min != null) lo = Math.min(lo, o.min);
  if (o.max != null) hi = Math.max(hi, o.max);
  const flat = hi === lo;
  const x = (i: number) => inset + (i / Math.max(1, data.length - 1)) * (o.width - inset * 2);
  const y = (v: number) => flat ? o.height / 2 : inset + (o.height - inset * 2) * (1 - (v - lo) / (hi - lo));
  const segments: SparkPoint[][] = [];
  let run: SparkPoint[] = [];
  data.forEach((v, i) => {
    if (finite(v)) run.push({ x: x(i), y: y(v) });
    else if (run.length) { segments.push(run); run = []; }
  });
  if (run.length) segments.push(run);
  const baselineY = o.baseline != null ? y(o.baseline) : undefined, floorY = baselineY ?? o.height;
  // Against a baseline the area fills only the side the series moved to: a stretch that crossed to the other side keeps
  // its line but no fill, so it never reads as part of the move. A flat result fills both sides in its quiet colour.
  const side = baselineY != null ? direction : 0;
  const keep = (run: SparkPoint[]) => {
    if (!side) return run;
    const out: SparkPoint[] = [];
    run.forEach((p, i) => {
      const prev = run[i - 1];
      if (prev && (prev.y - floorY) * (p.y - floorY) < 0) out.push({ x: prev.x + (p.x - prev.x) * (floorY - prev.y) / (p.y - prev.y), y: floorY });
      out.push({ x: p.x, y: side > 0 ? Math.min(p.y, floorY) : Math.max(p.y, floorY) });
    });
    return out;
  };
  const areas = flat ? [] : segments.filter((s) => s.length > 1).map(keep)
    .map((s) => [`${s[0].x},${floorY}`, ...s.map((p) => `${p.x},${p.y}`), `${s[s.length - 1].x},${floorY}`].join(" "));
  const tail = segments[segments.length - 1];
  return { segments, areas, end: tail[tail.length - 1], baselineY, bars: [], direction, empty };
}

export type SparklineTone = "text-tertiary" | "success" | "danger" | "price-up" | "price-down";
/** The color role for a direction: price up/down, or success/danger for status, and quiet when flat. */
export function sparklineTone(direction: -1 | 0 | 1, semantic: "price" | "status" = "price"): SparklineTone {
  if (!direction) return "text-tertiary";
  if (semantic === "status") return direction > 0 ? "success" : "danger";
  return direction > 0 ? "price-up" : "price-down";
}
/** The dash pattern for the empty line and the baseline. */
export const sparklineDash = () => `${tokens.extensions.financial.sparklineDash} ${tokens.extensions.financial.sparklineDashGap}`;

/** The accessible name: the app's description, and the no-data sentence when there is nothing to draw. */
export function sparklineLabel(ariaLabel: string | undefined, empty: boolean, noData: string) {
  return ariaLabel && empty ? `${ariaLabel}, ${noData}` : ariaLabel;
}

/** One vertical range for every row of a column, so their sparklines compare on the same scale. */
export function sparklineRange(series: readonly unknown[], baselines: readonly unknown[] = []): { min?: number; max?: number } {
  let min = Infinity, max = -Infinity;
  const take = (v: unknown) => { if (typeof v === "number" && Number.isFinite(v)) { min = Math.min(min, v); max = Math.max(max, v); } };
  series.forEach((s) => Array.isArray(s) && s.forEach(take));
  baselines.forEach(take);
  return min <= max ? { min, max } : {};
}

export interface SparklineColumn { key: string; baselineKey?: string; sharedRange?: boolean }
const columnRanges = new WeakMap<readonly object[], Map<string, { min?: number; max?: number }>>();
/** Sparkline props for one market row: its series, its reference value and (optionally) the column's shared range. */
export function sparklineCell<Row extends object>(rows: readonly Row[], row: Row, column: SparklineColumn, read: (row: Row, key: string) => unknown) {
  const series = read(row, column.key), reference = column.baselineKey ? read(row, column.baselineKey) : undefined;
  let range = {};
  if (column.sharedRange) {
    const cache = columnRanges.get(rows) ?? new Map<string, { min?: number; max?: number }>();
    columnRanges.set(rows, cache);
    const id = `${column.key}\u0000${column.baselineKey ?? ""}`;
    if (!cache.has(id)) cache.set(id, sparklineRange(rows.map((r) => read(r, column.key)), column.baselineKey ? rows.map((r) => read(r, column.baselineKey!)) : []));
    range = cache.get(id)!;
  }
  return { data: Array.isArray(series) ? (series as SparklineData) : [], baseline: typeof reference === "number" && Number.isFinite(reference) ? reference : undefined, ...range };
}
