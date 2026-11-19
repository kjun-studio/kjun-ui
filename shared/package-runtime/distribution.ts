// Framework-free rules for KjunZoneGauge (a value's place on a fixed axis) and KjunStackedBar (the parts of a whole),
// shared by React, Vue and Native: segment sizes, the marker's position, whole-percent shares and spoken text.

export interface GaugeZone {
  /** Where the zone ends on the axis; it starts where the previous zone ended (or at min). */
  to: number;
  label?: string;
  /** The app's colour for this zone; without one the zone takes the neutral track colour. */
  color?: string;
}
export interface GaugeSegment { from: number; to: number; share: number; label?: string; color?: string }
export interface StackedItem {
  key?: string;
  label: string;
  /** null, undefined and non-finite numbers are missing; negative numbers count as zero. */
  value: number | null | undefined;
  /** The app's colour for this part; without one it takes the neutral track colour. */
  color?: string;
}
export interface StackedLegendEntry { label: string; value: string; percent: string; present: boolean; drawn: boolean }
export type StackedState = "missing" | "empty" | "ready";

const present = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const amount = (value: unknown) => present(value) && value > 0 ? value : 0;

const formatters = new Map<string, Intl.NumberFormat>();
/** Locale grouping with up to two decimals; never prints -0. Formatters are cached per locale. */
export function distributionNumber(value: number, locale?: string) {
  const key = locale ?? "";
  let format = formatters.get(key);
  if (!format) formatters.set(key, format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }));
  return format.format(value === 0 ? 0 : value);
}

/** The marker's place as a percentage of the axis; values past an end stay on that end. */
export function gaugePosition(value: number, min: number, max: number) {
  if (!(max > min) || !present(value) || !present(min) || !present(max)) return 0;
  return Math.min(100, Math.max(0, (value - min) / (max - min) * 100));
}

/**
 * Zones as drawn: ordered by their end, clipped to the axis, each sized by its span. A zone that ends at or before the
 * previous one is dropped, and an axis the zones do not reach ends in an unnamed neutral segment.
 */
export function gaugeSegments(zones: readonly GaugeZone[], min: number, max: number): GaugeSegment[] {
  // An endless axis has no spans to size.
  if (!(max > min) || !present(min) || !present(max)) return [];
  const segments: GaugeSegment[] = [];
  let cursor = min;
  for (const zone of [...zones].filter(zone => present(zone.to)).sort((a, b) => a.to - b.to)) {
    const end = Math.min(zone.to, max);
    if (end <= cursor) continue;
    segments.push({ from: cursor, to: end, share: (end - cursor) / (max - min) * 100, label: zone.label, color: zone.color });
    cursor = end;
  }
  if (cursor < max) segments.push({ from: cursor, to: max, share: (max - cursor) / (max - min) * 100, label: undefined, color: undefined });
  return segments;
}

/** The segment a value falls in: a boundary belongs to the upper zone, and values past an end to the nearest. */
export function gaugeZoneIndex(value: number, segments: readonly GaugeSegment[]) {
  const index = segments.findIndex(segment => value < segment.to);
  return index < 0 ? segments.length - 1 : index;
}

export interface GaugeBoundary {
  /** The share of the axis (0–1) before the boundary. */
  cut: number;
  /** How many gaps come before the boundary's own. */
  gaps: number;
}
/** The zone boundaries on each side of a marker at `position` (0–100): the last at or before it and the first after it. */
export function gaugeNeighbours(position: number, segments: readonly GaugeSegment[]): { before?: GaugeBoundary; after?: GaugeBoundary } {
  let total = 0, before: GaugeBoundary | undefined, after: GaugeBoundary | undefined;
  for (let i = 0; i < segments.length - 1; i++) {
    total += segments[i].share;
    if (total <= position) before = { cut: total / 100, gaps: i };
    else if (!after) after = { cut: total / 100, gaps: i };
  }
  return { before, after };
}
export interface GaugeGeometry { segmentGap: number; markerWidth: number; markerRing: number; minSliver: number }
/**
 * The sliver of a zone left between a boundary and the marker's ring, in the axis's own length units: where it starts
 * and how long it is. null unless it is thinner than the minimum, which is when it is covered.
 */
export function gaugeSliver(width: number, position: number, count: number, boundary: GaugeBoundary | undefined, side: "before" | "after", geometry: GaugeGeometry) {
  if (!boundary || !(width > 0)) return null;
  const usable = width - (count - 1) * geometry.segmentGap, marker = (width - geometry.markerWidth) * position / 100;
  const start = side === "before" ? usable * boundary.cut + (boundary.gaps + 1) * geometry.segmentGap : marker + geometry.markerWidth + geometry.markerRing;
  const size = side === "before" ? marker - geometry.markerRing - start : usable * boundary.cut + boundary.gaps * geometry.segmentGap - start;
  return size > 0 && size < geometry.minSliver ? { start, size } : null;
}

/**
 * The gap the track leaves around the marker, in the axis's own length units: the marker and its ring on each side,
 * widened over a sliver too thin to read. The background shows through it, whatever it is.
 */
export function gaugeHole(width: number, position: number, count: number, near: { before?: GaugeBoundary; after?: GaugeBoundary }, geometry: GaugeGeometry) {
  const marker = (width - geometry.markerWidth) * position / 100;
  const before = gaugeSliver(width, position, count, near.before, "before", geometry), after = gaugeSliver(width, position, count, near.after, "after", geometry);
  return { start: marker - geometry.markerRing - (before?.size ?? 0), end: marker + geometry.markerWidth + geometry.markerRing + (after?.size ?? 0) };
}

export interface GaugePiece { start: number; size: number; first: boolean; last: boolean; color?: string }
/**
 * The zones as drawn pieces for a renderer without masks (Native): each zone's span on a measured axis, less the hole
 * around the marker. `first` and `last` mark the axis's own rounded ends.
 */
export function gaugePieces(width: number, segments: readonly GaugeSegment[], gap: number, hole?: { start: number; end: number }): GaugePiece[] {
  const usable = width - (segments.length - 1) * gap, pieces: GaugePiece[] = [];
  let cursor = 0;
  segments.forEach((segment, i) => {
    const start = cursor, end = cursor + usable * segment.share / 100;
    cursor = end + gap;
    const spans = hole && hole.end > start && hole.start < end ? [[start, Math.min(end, hole.start)], [Math.max(start, hole.end), end]] : [[start, end]];
    for (const [a, b] of spans) if (b > a) pieces.push({ start: a, size: b - a, first: i === 0 && a === start, last: i === segments.length - 1 && b === end, color: segment.color });
  });
  return pieces;
}

/** The CSS variables the web axis reads for its marker and hole: the position, the zone count and the neighbouring boundaries. */
export function gaugeAxisVars(position: number, count: number, near: { before?: GaugeBoundary; after?: GaugeBoundary }) {
  const vars: Record<string, string> = { "--_kjun-zone-gauge-position": String(position / 100), "--_kjun-zone-gauge-count": String(count) };
  for (const side of ["before", "after"] as const) {
    const boundary = near[side];
    if (!boundary) continue;
    vars[`--_kjun-zone-gauge-${side}-on`] = "1";
    vars[`--_kjun-zone-gauge-${side}-cut`] = String(boundary.cut);
    vars[`--_kjun-zone-gauge-${side}-gaps`] = String(boundary.gaps);
  }
  return vars;
}

export function gaugeSpoken(label: string | undefined, valueText: string, zoneLabel?: string) {
  return [label, valueText, zoneLabel].filter(Boolean).join(", ");
}

/** missing: nothing to show; empty: real values that add up to nothing; ready: at least one part to draw. */
export function stackedState(items: readonly StackedItem[] | null | undefined): StackedState {
  if (!items?.some(item => present(item.value))) return "missing";
  return items.some(item => amount(item.value) > 0) ? "ready" : "empty";
}

/**
 * Each item's exact percentage of the whole (0 for a part that is not drawn): the segment lengths. Amounts are scaled
 * by the largest first, so counts too large to add up still share out, and fractions fill the whole bar.
 */
export function stackedWeights(items: readonly StackedItem[]) {
  const amounts = items.map(item => amount(item.value)), top = Math.max(0, ...amounts);
  if (!(top > 0)) return amounts.map(() => 0);
  const scaled = amounts.map(value => value / top), total = scaled.reduce((sum, value) => sum + value, 0);
  return scaled.map(value => Math.round(value / total * 1e8) / 1e6);
}

/**
 * Whole percents that add up to 100 (or are all 0 for an empty total). The leftover points go by largest remainder to
 * the parts that already reach 1%: a part under 1% stays at 0 and reads "<1%", so equal small parts never read differently.
 */
export function stackedShares(items: readonly StackedItem[]) {
  const exact = stackedWeights(items);
  if (!exact.some(value => value > 0)) return exact.map(() => 0);
  const shares = exact.map(Math.floor);
  const ranked = exact.map((value, index) => ({ index, whole: Math.floor(value), rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest || a.index - b.index);
  // Only when every part is under 1% (more than a hundred of them) do the small parts share the points out.
  const order = ranked.some(part => part.whole > 0) ? ranked.filter(part => part.whole > 0) : ranked;
  for (let left = 100 - shares.reduce((sum, share) => sum + share, 0), i = 0; left > 0; left--, i++) shares[order[i % order.length].index]++;
  return shares;
}

/** One entry per item, in order: the legend's text, and whether the bar draws a segment for it. A drawn part never reads as 0%. */
export function stackedLegend(items: readonly StackedItem[], formatValue: ((value: number) => string) | undefined, locale: string | undefined, missingText: string): StackedLegendEntry[] {
  const shares = stackedShares(items);
  return items.map((item, index) => present(item.value)
    ? { label: item.label, value: formatValue ? formatValue(item.value) : distributionNumber(item.value, locale), percent: item.value > 0 && shares[index] === 0 ? "<1%" : shares[index] + "%", present: true, drawn: item.value > 0 }
    : { label: item.label, value: missingText, percent: "", present: false, drawn: false });
}

export function stackedSpoken(label: string | undefined, legend: readonly StackedLegendEntry[]) {
  const parts = legend.map(entry => entry.present ? `${entry.label} ${entry.value} (${entry.percent})` : `${entry.label} ${entry.value}`).join(", ");
  return label ? `${label}: ${parts}` : parts;
}

export interface GaugeInput {
  value: number | null | undefined; min: number; max: number; zones: readonly GaugeZone[];
  label?: string; ariaLabel?: string; formatValue?: (value: number) => string; missingText?: string;
  /** The sentence read for a missing value when there is no missingText. */
  noData: string; locale?: string;
}
/** Everything a gauge draws and says, worked out once for React, Vue and Native. */
export function gaugeModel(input: GaugeInput) {
  const segments = gaugeSegments(input.zones, input.min, input.max);
  const ready = typeof input.value === "number" && Number.isFinite(input.value) && segments.length > 0, value = ready ? input.value as number : 0;
  const zone = ready ? segments[gaugeZoneIndex(value, segments)] : undefined;
  const valueText = ready ? input.formatValue ? input.formatValue(value) : distributionNumber(value, input.locale) : input.missingText ?? "—";
  const position = ready ? gaugePosition(value, input.min, input.max) : 0;
  return {
    segments, ready, zone, position,
    /** The caption's end: the value and the zone it falls in. */
    caption: valueText + (zone?.label ? " · " + zone.label : ""),
    /** The zone boundaries beside the marker, for the hole around it; none without a value. */
    near: (ready ? gaugeNeighbours(position, segments) : {}) as ReturnType<typeof gaugeNeighbours>,
    /** One image for screen readers: the name, the value and the zone it falls in. */
    spoken: gaugeSpoken(input.ariaLabel ?? input.label, ready ? valueText : input.missingText ?? input.noData, zone?.label),
  };
}

export interface StackedInput {
  items: readonly StackedItem[] | null | undefined; label?: string; ariaLabel?: string;
  /** The app's summary at the end of the caption line (a total, a verdict); read after the name. */
  valueText?: string;
  formatValue?: (value: number) => string; missingText?: string; noData: string; locale?: string;
}
/** Everything a stacked bar draws and says, worked out once for React, Vue and Native. */
export function stackedModel(input: StackedInput) {
  const list = input.items ?? [], state = stackedState(list), missing = state === "missing", mark = input.missingText ?? "—";
  const entries = stackedLegend(list, input.formatValue, input.locale, mark), weights = stackedWeights(list), name = input.ariaLabel ?? input.label;
  return {
    state, missing, mark,
    /** The caption's end: the missing mark, or else the app's summary. */
    caption: missing ? mark : input.valueText || undefined,
    /** One per item, in order: its key, its length on the bar (when drawn) and its legend line. */
    parts: list.map((item, index) => ({ item, key: item.key ?? "i" + index, weight: weights[index], drawn: entries[index].drawn,
      text: entries[index].label + " " + entries[index].value + (entries[index].percent ? " · " + entries[index].percent : "") })),
    /** One image for screen readers: the name, then each part with its value and share. */
    spoken: missing ? gaugeSpoken(name, input.missingText ?? input.noData) : stackedSpoken(gaugeSpoken(name, input.valueText ?? ""), entries),
  };
}
