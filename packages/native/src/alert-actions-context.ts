import { createContext } from 'react';
import type { ColorValue } from 'react-native';
import { tokens } from '@kjun-ui/tokens';
import { tintColor } from '../../../shared/package-runtime/alert-tone';

// Alert actions sit on a tinted tone, so secondary buttons tint that fill with the text role.
export const AlertActionsContext = createContext(false);

/** Text-role tint at a state opacity, like the web color-mix; colors it cannot parse use the fallback role. */
export function alertTint(text: ColorValue, amount: 'tintFill' | 'tintControl' | 'tintHover' | 'tintActive' | 'muted', fallback: ColorValue): ColorValue {
  return (typeof text === 'string' && tintColor(text, tokens.states.opacity[amount])) || fallback;
}
