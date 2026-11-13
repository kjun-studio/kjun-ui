import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { gaugeSpoken, stackedLegend, stackedSpoken, stackedState, stackedWeights, type StackedItem } from "../../../shared/package-runtime/distribution";
import type { CSSProperties } from "react";

export type KjunStackedBarItem = StackedItem;
export interface KjunStackedBarProps {
  /** The parts in order. No items, or only missing values, draws the empty rail with the missing mark and no legend; values that add up to 0 draw the empty rail. */
  items: readonly StackedItem[] | null | undefined;
  /** Shown above the bar and read first. */
  label?: string;
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel?: string;
  size?: "sm" | "md";
  /** Each part's colour, name, value and share under the bar, so parts are not told apart by colour alone. */
  legend?: boolean;
  formatValue?: (value: number) => string;
  /** Shown for missing data and for a part without a value; defaults to an em dash. */
  missingText?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** The parts of a whole: each segment is as long as its share. It shows a breakdown; it is not a control. */
export function KjunStackedBar({ items, label, ariaLabel, size = "md", legend = true, formatValue, missingText, className, style, id }: KjunStackedBarProps) {
  const scope = useKjunMessageScope();
  const list = items ?? [], state = stackedState(list), missing = state === "missing";
  const entries = stackedLegend(list, formatValue, scope.intl, missingText ?? "—");
  const name = ariaLabel ?? label, weights = stackedWeights(list);
  // One image for screen readers: the name, then each part with its value and share.
  const spoken = missing ? gaugeSpoken(name, missingText ?? scope.messages.noData) : stackedSpoken(name, entries);
  return (
    <div id={id} className={"kjun-stacked-bar" + (className ? " " + className : "")} data-size={size} data-state={state} role="img" aria-label={spoken} style={style}>
      {(label || missing) && (
        <div className="kjun-stacked-bar-caption" aria-hidden="true">
          <span className="kjun-stacked-bar-label">{label}</span>
          {missing && <span className="kjun-stacked-bar-value">{missingText ?? "—"}</span>}
        </div>
      )}
      {/* Missing data keeps the empty rail, so the bar holds its place in a list. */}
      {(
        <div className="kjun-stacked-bar-track" aria-hidden="true">
          {list.map((item, i) => entries[i].drawn && <span key={item.key ?? "i" + i} className="kjun-stacked-bar-segment" style={{ flexGrow: weights[i], background: item.color }} />)}
        </div>
      )}
      {legend && !missing && (
        <ul className="kjun-stacked-bar-legend" aria-hidden="true">
          {list.map((item, i) => (
            <li key={item.key ?? "i" + i}>
              <span className="kjun-stacked-bar-swatch" style={{ background: item.color }} />
              <span>{entries[i].label} {entries[i].value}{entries[i].percent ? " · " + entries[i].percent : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
