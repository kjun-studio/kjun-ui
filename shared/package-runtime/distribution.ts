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

/** Whole percents by largest remainder, so the shares always add up to 100 (or are all 0 for an empty total). */
export function stackedShares(items: readonly StackedItem[]) {
  const exact = stackedWeights(items);
  if (!exact.some(value => value > 0)) return exact.map(() => 0);
  const shares = exact.map(Math.floor);
  const order = exact.map((value, index) => ({ index, rest: value - Math.floor(value) })).sort((a, b) => b.rest - a.rest || a.index - b.index);
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
