import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KjunProvider, KjunSideNavigation } from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';
import { sideCase, sideItems, sideStart, sideWidth } from './side-navigation-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState(sideStart), [log, setLog] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(sideCase.collapsed), [expanded, setExpanded] = useState<string[]>([]);
  const [items, setItems] = useState(sideCase.late ? [] : sideItems);
  useEffect(() => { if (sideCase.late) setTimeout(() => setItems(sideItems), 100); }, []);
  const add = (entry: string) => setLog(old => [...old, entry]);
  return <View style={{ flexDirection: 'row', gap: 24, padding: 24 }}>
    <View testID="side" style={{ width: sideWidth(collapsed) }}>
      <KjunSideNavigation ariaLabel="작업 공간" items={items as any} value={value} collapsed={collapsed}
        onCollapsedChange={next => { setCollapsed(next); add('wide'); }}
        {...(sideCase.controlled ? { expanded, onExpandedChange: (next: string[]) => { setExpanded(next); add('open:' + next.join(',')); } } : {})}
        onNavigate={(key, event) => { event.preventDefault?.(); setValue(key); add('go:' + key); }} onReselect={key => add('again:' + key)} />
    </View>
    <View><Pressable testID="to-checkout" onPress={() => setValue('checkout')}><Text>결제 화면으로</Text></Pressable><Text testID="log">{log.join(' ')}</Text></View>
  </View>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><Page /></KjunProvider>);
