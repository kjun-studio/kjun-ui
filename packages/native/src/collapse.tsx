import { tokens } from "@kjun-ui/tokens";
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, View } from 'react-native';
import { useReducedMotion } from './internal';
import { motionOut } from './motion';

export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [retained, setRetained] = useState(open), [height, setHeight] = useState<number | null>(null);
  const value = useRef(new Animated.Value(0)).current;
  const [settled, setSettled] = useState(open);
  const version = useRef(0), first = useRef(open);
  useLayoutEffect(() => {
    const revision = ++version.current;
    if (open) setRetained(true);
    if (height === null) return;
    value.stopAnimation();
    const target = open ? height : 0;
    const finish = () => { if (revision === version.current) { setSettled(open); setRetained(open); } };
    if (reduced || (first.current && open)) { value.setValue(target); finish(); }
    else { setSettled(false); Animated.timing(value, { toValue: target, duration: tokens.motion.collapse, easing: motionOut, useNativeDriver: false }).start(({ finished }) => { if (finished) finish(); }); }
    first.current = false;
    return () => { version.current++; value.stopAnimation(); };
  }, [open, height, reduced, value]);
  return open || retained ? <Animated.View pointerEvents={open ? 'auto' : 'none'}
    accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
    {...(!open ? { inert: true } : {})}
    style={{ height: settled && open ? undefined : value, overflow: 'hidden' }}>
    <View onLayout={event => setHeight(event.nativeEvent.layout.height)}>{children}</View>
  </Animated.View> : null;
}
