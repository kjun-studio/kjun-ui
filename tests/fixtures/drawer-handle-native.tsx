import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text } from 'react-native';
import * as K from '@kjun-ui/native';
import { demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';

// A bottom drawer with handle, header actions, a description and a footer row.
function App() {
  const [open, setOpen] = useState(false), [resets, setResets] = useState(0);
  return <K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}>
    <K.KjunButton onPress={() => setOpen(true)}>열기</K.KjunButton>
    <Text testID="state">{open ? 'open' : 'closed'}</Text><Text testID="resets">{String(resets)}</Text>
    <K.KjunDrawer open={open} onOpenChange={setOpen} position="bottom" handle title="필터" ariaDescribedBy="drawer-desc"
      headerActions={<K.KjunButton variant="ghost" size="sm" onPress={() => setResets(n => n + 1)}>초기화</K.KjunButton>}
      footer={<><K.KjunButton variant="secondary" onPress={() => setOpen(false)}>취소</K.KjunButton><K.KjunButton onPress={() => setOpen(false)}>적용</K.KjunButton></>}>
      <Text nativeID="drawer-desc">조건을 고르면 목록이 바뀝니다.</Text>
    </K.KjunDrawer>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
