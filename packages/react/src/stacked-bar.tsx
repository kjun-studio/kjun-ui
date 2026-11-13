import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { stackedModel, type StackedItem } from "../../../shared/package-runtime/distribution";
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
  const { state, missing, mark, parts, spoken } = stackedModel({ items, label, ariaLabel, formatValue, missingText, noData: scope.messages.noData, locale: scope.intl });
  return (
    <div id={id} className={"kjun-stacked-bar" + (className ? " " + className : "")} data-size={size} data-state={state} role="img" aria-label={spoken} style={style}>
      {(label || missing) && (
        <div className="kjun-stacked-bar-caption" aria-hidden="true">
          <span className="kjun-stacked-bar-label">{label}</span>
          {missing && <span className="kjun-stacked-bar-value">{mark}</span>}
        </div>
      )}
      {/* Missing data keeps the empty rail, so the bar holds its place in a list. */}
      <div className="kjun-stacked-bar-track" aria-hidden="true">
        {parts.map(part => part.drawn && <span key={part.key} className="kjun-stacked-bar-segment" style={{ flexGrow: part.weight, background: part.item.color }} />)}
      </div>
      {legend && !missing && (
        <ul className="kjun-stacked-bar-legend" aria-hidden="true">
          {parts.map(part => (
            <li key={part.key}>
              <span className="kjun-stacked-bar-swatch" style={{ background: part.item.color }} />
              <span>{part.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
