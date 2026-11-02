import { useLayerState } from "../../../shared/package-runtime/use-layer";
import { useLayoutEffect, useRef } from 'react';
import { Animated, Platform, View, type LayoutRectangle } from 'react-native';
import { tokens, type createFeedbackController } from '@kjun-ui/tokens';
import type { PresentedToast } from '../../../shared/package-runtime/feedback-motion';
import { useNativePresence, motionOut, nativeDriver } from './motion';
import { ToastView } from './toast';
import { useReducedMotion } from './internal';
import { useToastReflow } from './toast-reflow';
import { useKjunSafeArea } from './provider';
import { toastEdgeShift, type ToastPlacement } from '../../../shared/package-runtime/toast-placement';
import { orderToasts } from '../../../shared/package-runtime/toast-presentation';

function ToastSlot({ item, controller, boxes, placement }: { item: PresentedToast; controller: ReturnType<typeof createFeedbackController>; boxes: Map<number, LayoutRectangle>; placement: ToastPlacement }) {
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
  }} style={{ transform: [{ translateY: offset }], ...(item.exiting && box ? {
    position: 'absolute', left: box.x, top: box.y, width: box.width, height: box.height,
  } : {}) }}>
    <Animated.View pointerEvents={item.exiting ? 'none' : 'auto'} accessibilityElementsHidden={item.exiting}
      importantForAccessibility={item.exiting ? 'no-hide-descendants' : 'auto'} {...(item.exiting ? { inert: true } : {})}
      style={{ opacity: motion.opacity, transform: [{ translateY: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [toastEdgeShift(placement), 0] }) }] }}>
      <ToastView toast={item.toast} controller={controller} />
    </Animated.View>
  </Animated.View>;
}
export function ToastStack({ items, controller, placement = "top", offset = 0 }: { items: PresentedToast[]; controller: ReturnType<typeof createFeedbackController>; placement?: ToastPlacement; offset?: number }) {
  const layers = useLayerState(), insets = useKjunSafeArea();
  // Like Web: the stack keeps clear of the screen's safe area at its edge, plus the app's offset.
  const edge = tokens.extensions.toast.inset + Math.max(0, offset) + (placement === "bottom" ? insets.bottom : insets.top);
  const root = useRef<View | null>(null), reduced = useReducedMotion();
  useToastReflow(root, reduced);
  const boxes = useRef(new Map<number, LayoutRectangle>()).current;
  for (const id of boxes.keys()) if (!items.some(item => item.toast.id === id)) boxes.delete(id);
  return <View ref={root} pointerEvents="box-none" style={{ position: 'absolute', ...(placement === "bottom" ? { bottom: edge } : { top: edge }), right: tokens.extensions.toast.inset, left: tokens.extensions.toast.inset, gap: tokens.extensions.toast.stackGap,
    minHeight: items.some(item => item.exiting) ? Math.max(0, ...[...boxes.values()].map(box => box.y + box.height)) : undefined,
    zIndex: layers.zIndex(layers.topWindow()?.id, "toast"),
  }}>{orderToasts(items, placement).map(item => <ToastSlot key={item.toast.id} item={item} controller={controller} boxes={boxes} placement={placement} />)}</View>;
}
