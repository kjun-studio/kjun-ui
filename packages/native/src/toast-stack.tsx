import { useLayerState } from "../../../shared/package-runtime/use-layer";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useEffect, useLayoutEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, View, useWindowDimensions, type LayoutRectangle } from 'react-native';
import { tokens, type createFeedbackController } from '@kjun-ui/tokens';
import type { PresentedToast } from '../../../shared/package-runtime/feedback-motion';
import { useNativePresence, motionOut, nativeDriver } from './motion';
import { ToastView } from './toast';
import { useReducedMotion } from './internal';
import { useToastReflow } from './toast-reflow';
import { useKjunSafeArea, useKjunStyles } from './provider';
import { shadowLayers } from '../../../shared/package-runtime/elevation';
import { typeStyle } from './typography';
import { KText } from './internal';
import { toastEdgeShift, type ToastPlacement } from '../../../shared/package-runtime/toast-placement';
import { toastPeekDepth } from '../../../shared/package-runtime/toast-presentation';
import { useToastStack } from '../../../shared/package-runtime/use-toast-stack';

function ToastSlot({ item, controller, boxes, placement, narrow }: { item: PresentedToast; controller: ReturnType<typeof createFeedbackController>; boxes: Map<number, LayoutRectangle>; placement: ToastPlacement; narrow: boolean }) {
  const born = useRef(Math.min(tokens.motion.toastEnter, Date.now() - item.born)).current;
  const motion = useNativePresence(!item.exiting, tokens.motion.toastEnter - born, tokens.motion.toastExit, true, born / tokens.motion.toastEnter);
  const offset = useRef(new Animated.Value(0)).current;
  const box = boxes.get(item.toast.id);
  useLayoutEffect(() => { if (motion.reduced) { offset.stopAnimation(); offset.setValue(0); } }, [motion.reduced, offset]);
  useLayoutEffect(() => () => offset.stopAnimation(), [offset]);
  return <Animated.View testID={`toast-slot-${item.toast.id}`}
    {...(Platform.OS === 'web' ? { dataSet: { toastId: String(item.toast.id), exiting: String(item.exiting) } } : {})}
    onLayout={Platform.OS === 'web' ? undefined : event => {
    const next = event.nativeEvent.layout, old = boxes.get(item.toast.id);
    if (item.exiting) return;
    boxes.set(item.toast.id, next);
    if (old && old.y !== next.y && !motion.reduced) offset.stopAnimation(current => {
      offset.setValue(current + old.y - next.y);
      Animated.timing(offset, { toValue: 0, duration: tokens.motion.toastMove, easing: motionOut, useNativeDriver: nativeDriver }).start();
    });
  // Cards sit above the peek strip that follows them, so its edges show only below the far card.
  }} style={{ zIndex: 1, transform: [{ translateY: offset }], ...(item.exiting && box ? {
    position: 'absolute', left: box.x, top: box.y, width: box.width, height: box.height,
  } : {}) }}>
    <Animated.View pointerEvents={item.exiting ? 'none' : 'auto'} accessibilityElementsHidden={item.exiting}
      importantForAccessibility={item.exiting ? 'no-hide-descendants' : 'auto'} {...(item.exiting ? { inert: true } : {})}
      style={{ opacity: motion.opacity, transform: [{ translateY: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [toastEdgeShift(placement), 0] }) }] }}>
      <ToastView toast={item.toast} controller={controller} narrow={narrow} />
    </Animated.View>
  </Animated.View>;
}
/** The stack's toggle: card edges behind the far card for toasts not drawn as cards, with their count, that expands the
 * stack; once expanded it stays in place as the control that folds it again. */
function ToastMore({ behind, expanded, placement, onPress }: { behind: number; expanded: boolean; placement: ToastPlacement; onPress(): void }) {
  const { colors } = useKjunStyles(), m = useKjunMessages(), spec = tokens.extensions.toast;
  const depth = expanded ? 0 : toastPeekDepth(behind), reachDepth = Math.max(1, depth), bottom = placement === "bottom";
  // Each edge starts behind the far card's rounded end and shows one peek offset beyond the one in front.
  const edge = (layer: number) => <View key={layer} pointerEvents="none" style={{
    position: 'absolute', left: spec.peekInset * layer, right: spec.peekInset * layer, height: spec.radius + spec.peekOffset * layer,
    ...(bottom ? { bottom: -spec.radius } : { top: -spec.radius }),
    zIndex: -layer, backgroundColor: colors.surface, borderWidth: tokens.border.defaultWidth, borderColor: colors.border,
    borderRadius: spec.radius, boxShadow: shadowLayers(spec.elevation, colors),
  }} />;
  const reach = spec.peekOffset * reachDepth - typeStyle('meta').lineHeight / 2 - tokens.dimension.value2;
  const badge = <View pointerEvents="none" style={{ position: 'absolute', right: spec.peekInset, zIndex: 2,
    ...(bottom ? { bottom: reach } : { top: reach }), paddingHorizontal: tokens.dimension.value8,
    paddingVertical: tokens.dimension.value2, borderRadius: spec.compact.radius, backgroundColor: colors.text }}>
    <KText style={{ ...typeStyle('meta'), fontWeight: typeStyle('control').fontWeight, color: colors.surface }}>{expanded ? m.collapseNotifications : `+${behind}`}</KText>
  </View>;
  // The strip lines up with the cards: full width on a phone, the cards' end edge and width on a wide screen.
  return <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onPress}
    {...(Platform.OS === 'web' ? { dataSet: { toastMore: '' } } : {})}
    accessibilityLabel={expanded ? m.collapseNotifications : `${m.showNotifications}, ${m.moreNotifications(behind)}`}
    style={{ zIndex: 0, height: spec.peekOffset * reachDepth + tokens.native.minimumTouchTarget / 2, width: '100%', maxWidth: spec.maxWidth,
      alignSelf: 'flex-end', ...(bottom ? { marginBottom: -spec.stackGap } : { marginTop: -spec.stackGap }) }}>
    {[1, 2].slice(0, depth).map(edge)}{badge}
  </Pressable>;
}
export function ToastStack({ items, controller, placement = "top", offset = 0 }: { items: PresentedToast[]; controller: ReturnType<typeof createFeedbackController>; placement?: ToastPlacement; offset?: number }) {
  const layers = useLayerState(), insets = useKjunSafeArea(), m = useKjunMessages();
  // Like Web: the stack keeps clear of the screen's safe area at its edge, plus the app's offset.
  const edge = tokens.extensions.toast.inset + Math.max(0, offset) + (placement === "bottom" ? insets.bottom : insets.top);
  const root = useRef<View | null>(null), reduced = useReducedMotion();
  const narrow = useWindowDimensions().width <= tokens.responsive.toast;
  const { stack, expanded, setExpanded, announcement } = useToastStack(items, controller, { placement, narrow });
  // Native Web folds on a press outside without taking that press, like the web packages.
  useEffect(() => {
    if (Platform.OS !== 'web' || !expanded) return;
    const press = (event: PointerEvent) => { if (!(root.current as unknown as HTMLElement | null)?.contains(event.target as Node)) setExpanded(false); };
    document.addEventListener('pointerdown', press, true);
    return () => document.removeEventListener('pointerdown', press, true);
  }, [expanded, setExpanded]);
  // iOS has no live regions: unseen toasts are announced; Android reads the polite live region below.
  useEffect(() => { if (announcement && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(announcement); }, [announcement]);
  useToastReflow(root, reduced);
  const boxes = useRef(new Map<number, LayoutRectangle>()).current;
  for (const id of boxes.keys()) if (!items.some(item => item.toast.id === id)) boxes.delete(id);
  const zIndex = layers.zIndex(layers.topWindow()?.id, "toast");
  const more = stack.toggle && <ToastMore key="more" behind={stack.behind} expanded={expanded} placement={placement} onPress={() => setExpanded(!expanded)} />;
  return <>
    {/* A device has no page-wide press to watch, so a press outside an expanded stack lands on this layer and folds it. */}
    {expanded && Platform.OS !== 'web' && <Pressable accessible={false} onPress={() => setExpanded(false)}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex }} />}
    <View ref={root} pointerEvents="box-none"
      {...(items.length ? { accessibilityLabel: m.notifications, ...(Platform.OS === 'web' ? { role: 'region' as const } : {}) } : {})}
      style={{ position: 'absolute', ...(placement === "bottom" ? { bottom: edge } : { top: edge }), right: tokens.extensions.toast.inset, left: tokens.extensions.toast.inset, gap: tokens.extensions.toast.stackGap,
      minHeight: items.some(item => item.exiting) ? Math.max(0, ...[...boxes.values()].map(box => box.y + box.height)) : undefined,
      zIndex,
    }}>
      {placement === "bottom" && more}
      {stack.items.map(item => <ToastSlot key={item.toast.id} item={item} controller={controller} boxes={boxes} placement={placement} narrow={narrow} />)}
      {placement !== "bottom" && more}
      {/* Off-screen but still in the accessibility tree: a zero box with clipped overflow carries the live text. */}
      {!!items.length && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 0, overflow: 'hidden', opacity: 0 }}>
        <KText>{announcement}</KText>
      </View>}
    </View>
  </>;
}
