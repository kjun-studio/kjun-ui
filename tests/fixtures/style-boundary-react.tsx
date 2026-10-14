import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { appHtml, installAppCss } from './style-boundary-cases';
applyDemoColors('default');
installAppCss();
const App = () => <div dangerouslySetInnerHTML={{ __html: appHtml }} />;
// ?standalone: a modal used without any Provider portals straight to document.body.
if (location.search.includes('standalone')) createRoot(document.getElementById('root')!).render(
  <K.KjunModal open title="단독 모달" onOpenChange={() => {}}><p data-testid="standalone-body">단독 본문</p></K.KjunModal>);
else createRoot(document.getElementById('root')!).render(<>
  <div data-testid="outside"><App /></div>
  <K.KjunProvider>
    <div data-testid="inside"><App /></div>
    <K.KjunFeedbackProvider><div data-testid="inside-feedback"><App /></div></K.KjunFeedbackProvider>
    <span data-testid="icon-host" style={{ color: 'rgb(1, 2, 3)', fontSize: 30 }}><K.KjunIcon name="star" /></span>
    {/* An app wrapper that opts form groups into its own flex spacing with the layout attribute. */}
    <div data-testid="form-layout" data-kjun-layout="form" style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 360 }}>
      <h2 data-probe="heading">공지</h2>
      <p data-probe="paragraph">본문</p>
      <K.KjunFormGroup label="이름"><K.KjunInput value="" onValueChange={() => {}} ariaLabel="이름" /></K.KjunFormGroup>
      <K.KjunFormGroup label="메모"><K.KjunInput value="" onValueChange={() => {}} ariaLabel="메모" /></K.KjunFormGroup>
    </div>
    <div data-testid="kjun" style={{ display: 'grid', gap: 16, width: 360 }}>
      <K.KjunButton variant="primary">저장</K.KjunButton>
      <K.KjunInput value="값" onValueChange={() => {}} ariaLabel="입력" />
      <K.KjunAlert type="info" title="알림">본문</K.KjunAlert>
      <K.KjunCard title="카드">내용</K.KjunCard>
      <K.KjunModal open title="모달" onOpenChange={() => {}}>모달 본문</K.KjunModal>
    </div>
  </K.KjunProvider>
</>);
