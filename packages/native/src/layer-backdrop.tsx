import { Dimensions, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Where a modal backdrop sits: from the root's top to at least the screen's bottom. Android lays out a
 * new modal root a navigation bar short for its first frames; an inset of 0 would leave that strip bright.
 */
export function screenCover(): ViewStyle {
  return { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: Dimensions.get('screen').height };
}

/** The backdrop accepts pointer dismissal and never participates in focus traversal. */
export function LayerBackdrop({ onPress, style }: { onPress: () => void; style: StyleProp<ViewStyle> }) {
  // RN Web Pressable assigns tabindex even to inaccessible press targets.
  // A plain View keeps both tab traversal and its Modal's focus search on controls.
  return Platform.OS === 'web'
    ? <View style={style} aria-hidden {...{ onClick: onPress }} />
    : <Pressable style={style} onPress={onPress} accessible={false} focusable={false} />;
}
