import type { ReactNode } from 'react';
import { View, type TextStyle } from 'react-native';
import { KText } from './internal';

/** Separate affixes keep spacing independent of the chosen numeric font. */
export function KpiNumberLine({ prefix, suffix, prefixGap, suffixGap, style, unitStyle, children }: {
  prefix?: string; suffix?: string; prefixGap: number; suffixGap: number;
  style: TextStyle; unitStyle: TextStyle; children: ReactNode;
}) {
  // Units never leave their number: the line does not wrap between them. When even a stepped-down value cannot
  // fit, each part wraps inside itself (a long unit name too) instead of overflowing the cell.
  return <View style={{ flexDirection:'row', flexWrap:'nowrap', alignItems:'baseline', minWidth:0, maxWidth:'100%' }}>
    {!!prefix && <KText style={[style, unitStyle, { marginRight:prefixGap, minWidth:0, flexShrink:1 }]}>{prefix}</KText>}
    <KText style={[style, { minWidth:0, flexShrink:1 }]}>{children}</KText>
    {!!suffix && <KText style={[style, unitStyle, { marginLeft:suffixGap, minWidth:0, flexShrink:1 }]}>{suffix}</KText>}
  </View>;
}
