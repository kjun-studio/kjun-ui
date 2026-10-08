import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

/** The backdrop accepts pointer dismissal and never participates in focus traversal. */
export function LayerBackdrop({ onPress, style }: { onPress: () => void; style: StyleProp<ViewStyle> }) {
  // RN Web Pressable assigns tabindex even to inaccessible press targets.
  // A plain View keeps both tab traversal and its Modal's focus search on controls.
  return Platform.OS === 'web'
    ? <View style={style} aria-hidden {...{ onClick: onPress }} />
    : <Pressable style={style} onPress={onPress} accessible={false} focusable={false} />;
}
