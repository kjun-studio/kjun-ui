import type { ReactNode } from 'react';
import { View, type TextStyle } from 'react-native';
import { KText } from './internal';

/** Separate affixes keep spacing independent of the chosen numeric font. */
export function KpiNumberLine({ prefix, suffix, prefixGap, suffixGap, style, unitStyle, children }: {
  prefix?: string; suffix?: string; prefixGap: number; suffixGap: number;
  style: TextStyle; unitStyle: TextStyle; children: ReactNode;
}) {
  return <View style={{ flexDirection:'row', flexWrap:'wrap', alignItems:'baseline', minWidth:0, maxWidth:'100%' }}>
    {!!prefix && <KText style={[style, unitStyle, { marginRight:prefixGap, minWidth:0, flexShrink:1 }]}>{prefix}</KText>}
    <KText style={[style, { minWidth:0, flexShrink:1 }]}>{children}</KText>
    {!!suffix && <KText style={[style, unitStyle, { marginLeft:suffixGap, minWidth:0, flexShrink:1 }]}>{suffix}</KText>}
  </View>;
}
