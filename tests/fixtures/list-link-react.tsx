import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunListSection, KjunListRow } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<KjunProvider><main style={{ padding: 24, width: 360 }}>
  <KjunListSection title="출처">
    <KjunListRow title="새 탭 링크" href="https://example.com/a" target="_blank" chevron />
    <KjunListRow title="직접 준 rel" href="https://example.com/b" target="_blank" rel="noopener" chevron />
    <KjunListRow title="같은 창 링크" href="#same" chevron />
  </KjunListSection>
</main></KjunProvider>);
