import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { appHtml, installAppCss } from './style-boundary-cases';
applyDemoColors('default');
installAppCss();
const App = () => <div dangerouslySetInnerHTML={{ __html: appHtml }} />;
createRoot(document.getElementById('root')!).render(<>
  <div data-testid="outside"><App /></div>
  <K.KjunProvider>
    <div data-testid="inside"><App /></div>
    <div data-testid="kjun" style={{ display: 'grid', gap: 16, width: 360 }}>
      <K.DsButton variant="primary">저장</K.DsButton>
      <K.DsInput value="값" onValueChange={() => {}} ariaLabel="입력" />
      <K.DsAlert type="info" title="알림">본문</K.DsAlert>
      <K.DsCard title="카드">내용</K.DsCard>
      <K.DsModal open title="모달" onOpenChange={() => {}}>모달 본문</K.DsModal>
    </div>
  </K.KjunProvider>
</>);
