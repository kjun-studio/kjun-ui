import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { appHtml, installAppCss } from './style-boundary-cases';
applyDemoColors('default');
installAppCss();
const App = () => <div dangerouslySetInnerHTML={{ __html: appHtml }} />;
// ?standalone: a modal used without any Provider portals straight to document.body.
if (location.search.includes('standalone')) createRoot(document.getElementById('root')!).render(
  <K.DsModal open title="단독 모달" onOpenChange={() => {}}><p data-testid="standalone-body">단독 본문</p></K.DsModal>);
else createRoot(document.getElementById('root')!).render(<>
  <div data-testid="outside"><App /></div>
  <K.KjunProvider>
    <div data-testid="inside"><App /></div>
    <K.KjunFeedbackProvider><div data-testid="inside-feedback"><App /></div></K.KjunFeedbackProvider>
    <span data-testid="icon-host" style={{ color: 'rgb(1, 2, 3)', fontSize: 30 }}><K.DsIcon name="star" /></span>
    <div data-testid="kjun" style={{ display: 'grid', gap: 16, width: 360 }}>
      <K.DsButton variant="primary">저장</K.DsButton>
      <K.DsInput value="값" onValueChange={() => {}} ariaLabel="입력" />
      <K.DsAlert type="info" title="알림">본문</K.DsAlert>
      <K.DsCard title="카드">내용</K.DsCard>
      <K.DsModal open title="모달" onOpenChange={() => {}}>모달 본문</K.DsModal>
    </div>
  </K.KjunProvider>
</>);
