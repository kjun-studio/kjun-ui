import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { distributionNumber, gaugePosition, gaugeSegments, gaugeSpoken, gaugeZoneIndex, type GaugeZone } from "../../../shared/package-runtime/distribution";
import type { CSSProperties } from "react";

export type KjunGaugeZone = GaugeZone;
export interface KjunZoneGaugeProps {
  /** Where the marker sits. null, undefined and non-finite numbers are missing: no axis is drawn, and 0 is a real value. */
  value: number | null | undefined;
  min?: number;
  max?: number;
  /** The axis from min to max in order: each zone ends at `to`, with the app's label and colour. */
  zones: readonly GaugeZone[];
  /** Shown above the axis and read first. */
  label?: string;
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel?: string;
  size?: "sm" | "md";
  /** Zone names under the axis, so zones are not told apart by colour alone. */
  zoneLabels?: boolean;
  /** The value and its zone name at the end of the caption line. */
  showValue?: boolean;
  formatValue?: (value: number) => string;
  /** Shown in place of the value when it is missing; defaults to an em dash. */
  missingText?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** A value's place on a fixed axis of zones. It shows a reading; it is not a control. */
export function KjunZoneGauge({ value, min = 0, max = 100, zones, label, ariaLabel, size = "md", zoneLabels = true, showValue = true,
  formatValue, missingText, className, style, id }: KjunZoneGaugeProps) {
  const scope = useKjunMessageScope();
  const segments = gaugeSegments(zones, min, max);
  const ready = typeof value === "number" && Number.isFinite(value) && segments.length > 0;
  const zone = ready ? segments[gaugeZoneIndex(value, segments)] : undefined;
  const valueText = ready ? formatValue ? formatValue(value) : distributionNumber(value, scope.intl) : missingText ?? "—";
  // One image for screen readers: the name, the value and the zone it falls in.
  const spoken = gaugeSpoken(ariaLabel ?? label, ready ? valueText : missingText ?? scope.messages.noData, zone?.label);
  return (
    <div id={id} className={"kjun-zone-gauge" + (className ? " " + className : "")} data-size={size} data-state={ready ? "ready" : "missing"}
      role="img" aria-label={spoken} style={style}>
      {(label || showValue || !ready) && (
        <div className="kjun-zone-gauge-caption" aria-hidden="true">
          <span className="kjun-zone-gauge-label">{label}</span>
          {(showValue || !ready) && <span className="kjun-zone-gauge-value">{valueText}{zone?.label ? " · " + zone.label : ""}</span>}
        </div>
      )}
      {ready && (
        <div className="kjun-zone-gauge-axis" aria-hidden="true">
          <div className="kjun-zone-gauge-track">
            {segments.map((segment, i) => <span key={i} className="kjun-zone-gauge-zone" data-current={segment === zone || undefined} style={{ flexGrow: segment.share, background: segment.color }} />)}
          </div>
          <span className="kjun-zone-gauge-marker" style={{ "--_kjun-zone-gauge-position": gaugePosition(value, min, max) / 100 } as CSSProperties} />
        </div>
      )}
      {ready && zoneLabels && segments.some(segment => segment.label) && (
        <div className="kjun-zone-gauge-labels" aria-hidden="true">
          {segments.map((segment, i) => <span key={i} style={{ flexGrow: segment.share }}>{segment.label}</span>)}
        </div>
      )}
    </div>
  );
}
