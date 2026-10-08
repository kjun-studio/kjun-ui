import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, View, type LayoutChangeEvent, type LayoutRectangle } from 'react-native';
import { tokens, type ButtonSize } from '@kjun/tokens';
import { selectionTypeStyle } from './typography';
import type { ChoiceOption, ChoiceValue } from './choice-controls';
import { KText, useReducedMotion } from './internal';
import { useKjunStyles } from './provider';

const curve = tokens.motion.easeOut.match(/-?\d*\.?\d+/g)!.map(Number) as [number, number, number, number];
const easing = Easing.bezier(...curve);
const sameBox = (a: LayoutRectangle, b: LayoutRectangle) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

export function useButtonGroupMotion(selected: ChoiceOption | undefined) {
  const reduced = useReducedMotion();
  const [layouts, setLayouts] = useState(new Map<ChoiceValue, LayoutRectangle>());
  const x = useRef(new Animated.Value(0)).current;
  const width = useRef(new Animated.Value(0)).current;
  const previous = useRef<{ value: ChoiceValue; box: LayoutRectangle; reduced: boolean } | null>(null);
  const layout = selected && layouts.get(selected.value);
  const updateLayout = useCallback((value: ChoiceValue, box: LayoutRectangle) => {
    setLayouts(old => old.has(value) && sameBox(old.get(value)!, box) ? old : new Map(old).set(value, box));
  }, []);
  const measure = useCallback((value: ChoiceValue, event: LayoutChangeEvent) => updateLayout(value, event.nativeEvent.layout), [updateLayout]);
  useLayoutEffect(() => {
    const old = previous.current;
    if (!selected || !layout) {
      previous.current = null; x.stopAnimation(); width.stopAnimation(); return;
    }
    if (old && old.value === selected.value && old.reduced === reduced && sameBox(old.box, layout)) return;
    x.stopAnimation(); width.stopAnimation();
    if (old && old.value !== selected.value && !reduced) {
      // stopAnimation keeps the current position, so a new selection can retarget mid-flight.
      Animated.parallel([
        Animated.timing(x, { toValue: layout.x, duration: tokens.motion.indicator, easing, useNativeDriver: false }),
        Animated.timing(width, { toValue: layout.width, duration: tokens.motion.indicator, easing, useNativeDriver: false }),
      ]).start();
    } else { x.setValue(layout.x); width.setValue(layout.width); }
    previous.current = { value: selected.value, box: layout, reduced };
  }, [selected?.value, layout, reduced, x, width]);
  useEffect(() => () => { x.stopAnimation(); width.stopAnimation(); }, [x, width]);
  return { x, width, layout, measure, updateLayout, reduced };
}

export function ButtonGroupLabel({ label, active, size, reduced }: {
  label: string; active: boolean; size: ButtonSize; reduced: boolean;
}) {
  const { colors, fontFamily } = useKjunStyles();
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const interpolate = typeof colors.textSecondary === 'string' && typeof colors.text === 'string';
  useEffect(() => {
    progress.stopAnimation();
    if (reduced || !interpolate) progress.setValue(active ? 1 : 0);
    else Animated.timing(progress, { toValue: active ? 1 : 0, duration: tokens.motion.indicator, easing, useNativeDriver: false }).start();
    return () => progress.stopAnimation();
  }, [active, reduced, interpolate, progress]);
  return <View>
    <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ ...selectionTypeStyle(size, true), opacity: 0 }}>{label}</KText>
    <Animated.Text style={{ position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center',
      fontFamily, ...selectionTypeStyle(size, active),
      color: interpolate ? progress.interpolate({ inputRange: [0, 1], outputRange: [colors.textSecondary as string, colors.text as string] }) : active ? colors.text : colors.textSecondary,
    }}>{label}</Animated.Text>
  </View>;
}
