import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { KjunProvider, KjunPressable } from '@kjun-ui/native';
import { demoFont, demoPalettes } from '../../shared/demo-colors';

function Page() {
  const [presses, setPresses] = useState(0);
  const press = () => setPresses(count => count + 1);
  return <View style={{ padding: 24, width: 360, gap: 16 }}>
    <KjunPressable ariaLabel="추억 지도에서 보기" onPress={press} style={{ borderRadius: 16, overflow: 'hidden' }}>
      <View testID="map" style={{ height: 120, backgroundColor: '#CFE4F7' }} />
    </KjunPressable>
    <KjunPressable onPress={press} pressEffect="none" style={{ padding: 12 }}>표시 없는 영역</KjunPressable>
    <KjunPressable ariaLabel="잠긴 영역" onPress={press} disabled style={{ padding: 12 }}><Text>잠긴 영역</Text></KjunPressable>
    <KjunPressable ariaLabel="꽉 찬 영역" onPress={press} focusRingInset style={{ padding: 12 }}><Text>꽉 찬 영역</Text></KjunPressable>
    <Text testID="presses">{presses}</Text>
  </View>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><Page /></KjunProvider>);
