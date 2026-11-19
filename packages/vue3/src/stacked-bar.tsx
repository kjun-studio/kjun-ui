import { type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { stackedModel, type StackedItem } from "../../../shared/package-runtime/distribution";
import { useKjunMessageScope } from "./runtime/messages";

export type KjunStackedBarItem = StackedItem;
const kjunStackedBarProps = {
  /** The parts in order. No items, or only missing values, draws the empty rail with the missing mark and no legend; values that add up to 0 draw the empty rail. */
  items: { type: Array as PropType<readonly StackedItem[] | null>, default: null },
  /** Shown above the bar and read first. */
  label: { type: String, default: undefined },
  /** The accessible name when there is no visible label, or a fuller one than it. */
  ariaLabel: { type: String, default: undefined },
  /** The app's summary at the end of the caption line, such as a total or a verdict; read after the name. Data that is missing shows missingText there instead. */
  valueText: { type: String, default: undefined },
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
      const { state, missing, caption, parts, spoken } = stackedModel({ items: props.items, label: props.label, ariaLabel: props.ariaLabel, valueText: props.valueText, formatValue: props.formatValue,
        missingText: props.missingText, noData: scope.value.messages.noData, locale: scope.value.intl });
      return (
        <div class="kjun-stacked-bar" data-size={props.size} data-state={state} role="img" aria-label={spoken}>
          {(props.label || caption) && (
            <div class="kjun-stacked-bar-caption" aria-hidden="true">
              <span class="kjun-stacked-bar-label">{props.label}</span>
              {caption && <span class="kjun-stacked-bar-value">{caption}</span>}
            </div>
          )}
          {/* Like React: missing data keeps the empty rail. */}
          <div class="kjun-stacked-bar-track" aria-hidden="true">
            {parts.map(part => part.drawn && <span key={part.key} class="kjun-stacked-bar-segment" style={{ flexGrow: part.weight, background: part.item.color }} />)}
          </div>
          {props.legend && !missing && (
            <ul class="kjun-stacked-bar-legend" aria-hidden="true">
              {parts.map(part => (
                <li key={part.key}>
                  <span class="kjun-stacked-bar-swatch" style={{ background: part.item.color }} />
                  <span>{part.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    };
  },
});
