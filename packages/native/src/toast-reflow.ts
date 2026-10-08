import type { RefObject } from 'react';
import type { View } from 'react-native';

// Device layout events drive ToastSlot's Animated.Value directly.
export function useToastReflow(_root: RefObject<View | null>, _reduced: boolean) {}
