import { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, type EasingFunction } from 'react-native';
import { tokens } from '@kjun-ui/tokens';
import { useReducedMotion } from './internal';

const bezier = (value: string) => Easing.bezier(...value.match(/-?\d*\.?\d+/g)!.map(Number) as [number, number, number, number]);
export const motionOut = bezier(tokens.motion.easeOut);
export const motionIn = bezier(tokens.motion.easeIn);
export const motionEmphasized = bezier(tokens.motion.easeEmphasized);
export const motionLinear = bezier(tokens.motion.easeLinear);
// Devices run opacity and transform on the UI thread; React Native Web has no native driver.
export const nativeDriver = Platform.OS !== 'web';

// Pass useNative only when the value drives opacity or transform, never layout or color.
export function useMotionValue(target: number, duration: number = tokens.motion.indicator, initial = target, easing = motionOut, useNative = false) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(initial)).current;
  useLayoutEffect(() => {
    value.stopAnimation();
    if (reduced) value.setValue(target);
    else Animated.timing(value, { toValue: target, duration, easing, useNativeDriver: useNative && nativeDriver }).start();
    return () => value.stopAnimation();
  }, [target, reduced, duration, value, easing, useNative]);
  return value;
}

type PresenceOptions = { fade?: number; enterEasing?: EasingFunction };

// progress drives movement; opacity fades linearly on exit and ends before the movement does.
export function useNativePresence(open: boolean, enter: number = tokens.motion.layerEnter, exit: number = tokens.motion.layerExit, ready = true, initial = 0,
  { fade = Math.min(exit, tokens.motion.fadeExit), enterEasing = motionOut }: PresenceOptions = {}) {
  const reduced = useReducedMotion();
  const [retained, setRetained] = useState(open);
  const progress = useRef(new Animated.Value(initial)).current;
  const opacity = useRef(new Animated.Value(initial)).current;
  const version = useRef(0);
  useLayoutEffect(() => {
    const revision = ++version.current;
    progress.stopAnimation(); opacity.stopAnimation();
    if (open) setRetained(true);
    const target = open && ready ? 1 : 0;
    const finish = () => { if (revision === version.current && !open) setRetained(false); };
    if (reduced || !ready) { progress.setValue(target); opacity.setValue(target); finish(); }
    else Animated.parallel([
      Animated.timing(progress, { toValue: target, duration: open ? enter : exit, easing: open ? enterEasing : motionIn, useNativeDriver: nativeDriver }),
      Animated.timing(opacity, { toValue: target, duration: open ? enter : fade, easing: open ? motionOut : motionLinear, useNativeDriver: nativeDriver }),
    ]).start(({ finished }) => { if (finished) finish(); });
    return () => { version.current++; progress.stopAnimation(); opacity.stopAnimation(); };
  }, [open, reduced, ready, enter, exit, fade, enterEasing, progress, opacity]);
  return { present: open || retained, progress, opacity, reduced };
}
