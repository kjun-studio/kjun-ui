import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { stackedModel, type StackedItem } from "../../../shared/package-runtime/distribution";
import { View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KText, hiddenParts } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type KjunStackedBarItem = Omit<StackedItem, "color"> & { color?: ColorValue };
export interface KjunStackedBarProps {
  /** The parts in order. No items, or only missing values, draws the empty rail with the missing mark and no legend; values that add up to 0 draw the empty rail. */
  items: readonly KjunStackedBarItem[] | null | undefined;
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
  style?: StyleProp<ViewStyle>;
}

const geometry = tokens.extensions.stackedBar;

/** The parts of a whole: each segment is as long as its share. It shows a breakdown; it is not a control. */
export function KjunStackedBar({ items, label, ariaLabel, size = "md", legend = true, formatValue, missingText, style }: KjunStackedBarProps) {
  const scope = useKjunMessageScope();
  const { colors } = useKjunStyles();
  const { state, missing, mark, parts, spoken } = stackedModel({ items: items as readonly StackedItem[] | null | undefined, label, ariaLabel, formatValue, missingText,
    noData: scope.messages.noData, locale: scope.intl });
  const track = size === "sm" ? geometry.smTrackHeight : geometry.trackHeight, end = tokens.radius.radius9999, neutral = colors.switchTrack ?? colors.border;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={spoken} style={[{ minWidth: 0 }, style]}>
      <View {...hiddenParts}>
        {(!!label || missing) && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: tokens.dimension.value12, marginBottom: geometry.captionGap }}>
            <KText numberOfLines={1} style={{ ...typeStyle("label"), color: colors.textSecondary, flexShrink: 1 }}>{label}</KText>
            {missing && <KText style={{ ...typeStyle("label"), color: colors.textTertiary }}>{mark}</KText>}
          </View>
        )}
        {/* Like Web: missing data keeps the empty rail, and the rail alone rounds the ends. */}
        <View style={{ flexDirection: "row", gap: geometry.segmentGap, height: track, borderRadius: end, overflow: "hidden", backgroundColor: state !== "ready" ? neutral : undefined }}>
          {parts.map(part => part.drawn && (
            <View key={part.key} style={{ flexGrow: part.weight, flexBasis: 0, minWidth: geometry.minSegment, backgroundColor: (part.item.color as ColorValue | undefined) ?? neutral }} />
          ))}
        </View>
        {legend && !missing && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: geometry.legendGap, rowGap: geometry.legendRowGap, marginTop: geometry.legendTop }}>
            {parts.map(part => (
              <View key={part.key} style={{ flexDirection: "row", alignItems: "center", gap: geometry.swatchGap, maxWidth: "100%" }}>
                <View style={{ width: geometry.swatchSize, height: geometry.swatchSize, borderRadius: geometry.swatchRadius, backgroundColor: (part.item.color as ColorValue | undefined) ?? neutral }} />
                <KText style={{ ...typeStyle("caption"), fontVariant: ["tabular-nums"], color: colors.textSecondary, flexShrink: 1 }}>{part.text}</KText>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
