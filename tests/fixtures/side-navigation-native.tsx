import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KjunProvider, KjunSideNavigation } from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';
import { sideItems, sideStart } from './side-navigation-cases';

applyDemoColors('default');
function Page() {
  const [value, setValue] = useState(sideStart), [log, setLog] = useState<string[]>([]);
  return <View style={{ flexDirection: 'row', gap: 24, padding: 24 }}>
    <View testID="side" style={{ width: 240 }}>
      <KjunSideNavigation ariaLabel="작업 공간" items={sideItems as any} value={value}
        onNavigate={(key, event) => { event.preventDefault?.(); setValue(key); setLog(old => [...old, 'go:' + key]); }} onReselect={key => setLog(old => [...old, 'again:' + key])} />
    </View>
    <Text testID="log">{log.join(' ')}</Text>
  </View>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><Page /></KjunProvider>);
