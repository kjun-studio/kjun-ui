import type { ColorValue } from 'react-native';
import { tokens } from '@kjun-ui/tokens';
import { tintColor } from '../../../shared/package-runtime/alert-tone';

/** Text-role tint at a state opacity, like the web color-mix; colors it cannot parse use the fallback role. */
export function textTint(text: ColorValue, amount: 'tintFill' | 'tintControl' | 'tintHover' | 'tintActive' | 'muted', fallback: ColorValue): ColorValue {
  return (typeof text === 'string' && tintColor(text, tokens.states.opacity[amount])) || fallback;
}
