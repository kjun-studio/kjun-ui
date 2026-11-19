import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, View } from 'react-native';
import * as K from '@kjun-ui/native';
import { demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';

const query = new URLSearchParams(location.search), bare = query.has('bare'), long = query.has('long'), wrap = query.has('wrap');
// A Modal whose confirm starts a save (loading) and a body button that ends it; ?bare drops the title, ?long overflows the body, ?wrap puts one wrapper in the footer.
function App() {
  const [open, setOpen] = useState(false), [loading, setLoading] = useState(false);
  return <K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}>
    <K.KjunButton onPress={() => setOpen(true)}>열기</K.KjunButton>
    <Text testID="state">{open ? 'open' : 'closed'}</Text>
    <K.KjunModal open={open} onOpenChange={setOpen} showFooter confirmText="저장" loading={loading} onConfirm={() => setLoading(true)}
      title={bare ? '' : '편집'} ariaDescribedBy="modal-desc"
      footer={wrap ? <View testID="wrap" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text>3개 선택</Text><K.KjunButton>보내기</K.KjunButton></View> : undefined}>
      <Text nativeID="modal-desc">이름을 바꿉니다.</Text>
      <K.KjunButton variant="secondary" onPress={() => setLoading(false)}>진행 끝</K.KjunButton>
      {long && Array.from({ length: 40 }, (_, i) => <Text key={i}>본문 {i + 1}</Text>)}
    </K.KjunModal>
  </K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<App />);
