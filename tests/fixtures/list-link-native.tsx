import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { useState } from 'react';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';

applyDemoColors('default');
function Rows() {
  const [open, setOpen] = useState(false);
  return <K.KjunListSection title="출처">
    <K.KjunListRow title="새 탭 링크" href="https://example.com/a" target="_blank" chevron />
    <K.KjunListRow title="직접 준 rel" href="https://example.com/b" target="_blank" rel="noopener" chevron />
    <K.KjunListRow title="같은 창 링크" href="#same" chevron />
    <K.KjunListRow title="현재 페이지" href="#here" current chevron />
    <K.KjunListRow title="현재 메시지" current onPress={() => {}} chevron />
    <K.KjunListRow title="다른 메시지" onPress={() => {}} chevron />
    <K.KjunListRow title="새 소식" onPress={() => {}} badge={<K.KjunBadge>New</K.KjunBadge>} trailing={<K.KjunText>3건</K.KjunText>} />
    <K.KjunListRow title="로그인한 기기" expanded={open} onExpandedChange={setOpen} expandedContent={<K.KjunText>이 휴대폰</K.KjunText>} />
  </K.KjunListSection>;
}
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><main style={{ padding: 24, width: 360 }}><Rows /></main></K.KjunProvider>);
