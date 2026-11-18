import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { avatarCompactType, avatarType } from "../../../shared/package-runtime/avatar-type";
import { avatarGroupModel } from "../../../shared/package-runtime/avatar-group";
import { View, type ColorValue, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { AccessiblePressable } from "./a11y";
import { KText } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import { KjunAvatar, type KjunAvatarProps } from "./media";

type Size = NonNullable<KjunAvatarProps["size"]>;
/** One person in a group: the KjunAvatar props the group does not decide, plus a stable key. */
export type KjunAvatarGroupItem = Omit<KjunAvatarProps, "size" | "shape" | "decorative" | "alt"> & { key: string };
export interface KjunAvatarGroupProps {
  /** The people shown, front first. */
  items: KjunAvatarGroupItem[];
  /** Most avatars drawn (default 4); the rest fold into a "+N" chip that is not counted here. */
  max?: number;
  /** The whole headcount when the server sends only a few avatars (default items.length). */
  total?: number;
  size?: Size;
  /** Circles overlap; squares sit apart with no ring. */
  shape?: KjunAvatarProps["shape"];
  /** The one name the group is read by, e.g. "참여자 128명"; defaults to the headcount. */
  ariaLabel?: string;
  /** The colour behind the group, for the ring that cuts each circle out of its neighbour (default the surface colour). */
  ringColor?: ColorValue;
  /** Makes the whole group one button (onPress), for example to open the full list. */
  pressable?: boolean;
  /** Blocks a pressable group and dims it. */
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
}

// Like Web: the chip's number uses the avatar's initial type, one step smaller for three characters ("+99").

/**
 * Overlapping avatars with a "+N" chip, read as one name. Native has no shadow spread, so each circle sits in a wrapper
 * painted in the ring colour; the wrappers overlap by the ring as well, so centres match Web, and the group's negative
 * margin keeps its outer size to the avatars, as a box-shadow does.
 */
export function KjunAvatarGroup({ items, max, total, size = "md", shape = "circle", ariaLabel, ringColor, pressable = false, disabled = false, onPress, style }: KjunAvatarGroupProps) {
  const m = useKjunMessages();
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  const { visible, overflowText, totalCount } = avatarGroupModel({ count: items.length, max, total });
  const label = ariaLabel ?? m.avatarGroupCount(totalCount);
  const circle = shape === "circle", side = tokens.extensions.avatar[size];
  const ring = circle ? tokens.border.controlWidth : 0, overlap = tokens.extensions.avatarGroup.overlap[size];
  const radius = circle ? tokens.radius.radius9999 : tokens.radius.radius8;
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const, "aria-hidden": true };
  const slot = (index: number, zIndex: number): ViewStyle => ({
    width: side + ring * 2, height: side + ring * 2, borderRadius: radius, alignItems: "center", justifyContent: "center", zIndex,
    backgroundColor: circle ? ringColor ?? colors.surface : undefined,
    marginStart: index === 0 ? 0 : circle ? -(overlap + ring * 2) : tokens.extensions.avatarGroup.squareGap[size],
  });
  const people = items.slice(0, visible).map(({ key, ...item }, index) =>
    <View key={key} {...hidden} style={slot(index, visible + 1 - index)}><KjunAvatar {...item} size={size} shape={shape} decorative /></View>);
  const chip = overflowText ? <View key="overflow" {...hidden} style={slot(visible, 0)}>
    <View style={{ width: side, height: side, borderRadius: radius, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center", paddingStart: circle && visible > 0 ? overlap : 0 }}>
      <KText numberOfLines={1} style={{ ...typeStyle((overflowText.length > 2 ? avatarCompactType : avatarType)[size]), fontWeight: typeStyle("control").fontWeight,
        fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"], color: colors.textSecondary }}>{overflowText}</KText>
    </View>
  </View> : null;
  const base: ViewStyle = { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", margin: -ring, zIndex: 0 };
  const row = <>{people}{chip}</>;
  if (!pressable) return <View accessible accessibilityRole="image" accessibilityLabel={label} style={[base, style]}>{row}</View>;
  const hit = Math.max(0, (tokens.native.minimumTouchTarget - side) / 2);
  return <AccessiblePressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    hitSlop={{ top: hit, bottom: hit, left: 0, right: 0 }}
    style={({ pressed }: { pressed: boolean }) => [base, pressed ? { transform: [{ scale: 0.99 }] } : null, disabled ? { opacity: tokens.states.opacity.disabled } : null, style]}>{row}</AccessiblePressable>;
}
