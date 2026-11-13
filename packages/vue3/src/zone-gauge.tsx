import { type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { distributionNumber, gaugeNeighbours, gaugePosition, gaugeSegments, gaugeSpoken, gaugeZoneIndex, type GaugeZone } from "../../../shared/package-runtime/distribution";
import { useKjunMessageScope } from "./runtime/messages";

export type KjunGaugeZone = GaugeZone;
const kjunZoneGaugeProps = {
  /** Where the marker sits. null, undefined and non-finite numbers are missing: no axis is drawn, and 0 is a real value. */
  value: { type: Number as PropType<number | null>, default: null },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  /** The axis from min to max in order: each zone ends at `to`, with the app's label and colour. */
  zones: { type: Array as PropType<readonly GaugeZone[]>, required: true },
  /** Shown above the axis and read first. */
  label: { type: String, default: undefined },
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel: { type: String, default: undefined },
  size: { type: String as PropType<"sm" | "md">, default: "md" },
  /** Zone names under the axis, so zones are not told apart by colour alone. */
  zoneLabels: { type: Boolean, default: true },
  /** The value and its zone name at the end of the caption line. */
  showValue: { type: Boolean, default: true },
  formatValue: { type: Function as PropType<(value: number) => string>, default: undefined },
  /** Shown in place of the value when it is missing; defaults to an em dash. */
  missingText: { type: String, default: undefined },
} as const;
export type KjunZoneGaugeProps = ExtractPublicPropTypes<typeof kjunZoneGaugeProps>;
/** A value's place on a fixed axis of zones. It shows a reading; it is not a control. */
export const KjunZoneGauge = defineComponent({
  name: "KjunZoneGauge",
  props: kjunZoneGaugeProps,
  setup(props) {
    const scope = useKjunMessageScope();
    return () => {
      const { value, label, missingText } = props;
      const segments = gaugeSegments(props.zones, props.min, props.max);
      const ready = typeof value === "number" && Number.isFinite(value) && segments.length > 0;
      const zone = ready ? segments[gaugeZoneIndex(value as number, segments)] : undefined;
      const valueText = ready ? props.formatValue ? props.formatValue(value as number) : distributionNumber(value as number, scope.value.intl) : missingText ?? "—";
      // One image for screen readers: the name, the value and the zone it falls in.
      const spoken = gaugeSpoken(props.ariaLabel ?? label, ready ? valueText : missingText ?? scope.value.messages.noData, zone?.label);
      const position = ready ? gaugePosition(value as number, props.min, props.max) : 0, near = ready ? gaugeNeighbours(position, segments) : {};
      const cover = (side: "before" | "after") => near[side] && (
        <span class="kjun-zone-gauge-cover" data-side={side} style={{ "--_kjun-zone-gauge-cut": String(near[side]!.cut), "--_kjun-zone-gauge-gaps": String(near[side]!.gaps) }} />
      );
      return (
        <div class="kjun-zone-gauge" data-size={props.size} data-state={ready ? "ready" : "missing"} role="img" aria-label={spoken}>
          {(label || props.showValue || !ready) && (
            <div class="kjun-zone-gauge-caption" aria-hidden="true">
              <span class="kjun-zone-gauge-label">{label}</span>
              {(props.showValue || !ready) && <span class="kjun-zone-gauge-value">{valueText}{zone?.label ? " · " + zone.label : ""}</span>}
            </div>
          )}
          {/* Like React: a missing value keeps the axis and the zone names, without colours or a marker. */}
          {segments.length > 0 && (
            <div class="kjun-zone-gauge-axis" aria-hidden="true" style={{ "--_kjun-zone-gauge-position": String(position / 100), "--_kjun-zone-gauge-count": String(segments.length) }}>
              <div class="kjun-zone-gauge-track">
                {segments.map((segment, i) => <span key={i} class="kjun-zone-gauge-zone" data-current={segment === zone || undefined} style={{ flexGrow: segment.share, background: ready ? segment.color : undefined }} />)}
              </div>
              {cover("before")}
              {cover("after")}
              {ready && <span class="kjun-zone-gauge-marker" />}
            </div>
          )}
          {segments.length > 0 && props.zoneLabels && segments.some(segment => segment.label) && (
            <div class="kjun-zone-gauge-labels" aria-hidden="true">
              {segments.map((segment, i) => <span key={i} style={{ flexGrow: segment.share }}>{segment.label}</span>)}
            </div>
          )}
        </div>
      );
    };
  },
});
