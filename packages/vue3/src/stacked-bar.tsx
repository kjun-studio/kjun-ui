import { type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { gaugeSpoken, stackedLegend, stackedSpoken, stackedState, stackedWeights, type StackedItem } from "../../../shared/package-runtime/distribution";
import { useKjunMessageScope } from "./runtime/messages";

export type KjunStackedBarItem = StackedItem;
const kjunStackedBarProps = {
  /** The parts in order. No items, or only missing values, draws no bar; values that add up to 0 draw the empty rail. */
  items: { type: Array as PropType<readonly StackedItem[] | null>, default: null },
  /** Shown above the bar and read first. */
  label: { type: String, default: undefined },
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel: { type: String, default: undefined },
  size: { type: String as PropType<"sm" | "md">, default: "md" },
  /** Each part's colour, name, value and share under the bar, so parts are not told apart by colour alone. */
  legend: { type: Boolean, default: true },
  formatValue: { type: Function as PropType<(value: number) => string>, default: undefined },
  /** Shown for missing data and for a part without a value; defaults to an em dash. */
  missingText: { type: String, default: undefined },
} as const;
export type KjunStackedBarProps = ExtractPublicPropTypes<typeof kjunStackedBarProps>;
/** The parts of a whole: each segment is as long as its share. It shows a breakdown; it is not a control. */
export const KjunStackedBar = defineComponent({
  name: "KjunStackedBar",
  props: kjunStackedBarProps,
  setup(props) {
    const scope = useKjunMessageScope();
    return () => {
      const list = props.items ?? [], state = stackedState(list), missing = state === "missing", missingText = props.missingText;
      const entries = stackedLegend(list, props.formatValue, scope.value.intl, missingText ?? "—");
      const name = props.ariaLabel ?? props.label, weights = stackedWeights(list);
      // One image for screen readers: the name, then each part with its value and share.
      const spoken = missing ? gaugeSpoken(name, missingText ?? scope.value.messages.noData) : stackedSpoken(name, entries);
      return (
        <div class="kjun-stacked-bar" data-size={props.size} data-state={state} role="img" aria-label={spoken}>
          {(props.label || missing) && (
            <div class="kjun-stacked-bar-caption" aria-hidden="true">
              <span class="kjun-stacked-bar-label">{props.label}</span>
              {missing && <span class="kjun-stacked-bar-value">{missingText ?? "—"}</span>}
            </div>
          )}
          {/* Missing data keeps the empty rail, so the bar holds its place in a list. */}
          {(
            <div class="kjun-stacked-bar-track" aria-hidden="true">
              {list.map((item, i) => entries[i].drawn && <span key={item.key ?? "i" + i} class="kjun-stacked-bar-segment" style={{ flexGrow: weights[i], background: item.color }} />)}
            </div>
          )}
          {props.legend && !missing && (
            <ul class="kjun-stacked-bar-legend" aria-hidden="true">
              {list.map((item, i) => (
                <li key={item.key ?? "i" + i}>
                  <span class="kjun-stacked-bar-swatch" style={{ background: item.color }} />
                  <span>{entries[i].label} {entries[i].value}{entries[i].percent ? " · " + entries[i].percent : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    };
  },
});
