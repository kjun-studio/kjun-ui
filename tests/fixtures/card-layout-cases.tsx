import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';

export function renderCardLayouts(K: any, native = false) {
  applyDemoColors('default');
  const { KjunProvider, DsCard: Card, DsButton: Button, DsBadge: Badge } = K;
  function App() {
    const [actions, setActions] = useState(0), [body, setBody] = useState(false);
    const button = (label: string) => <Button {...{ [native ? 'onPress' : 'onClick']: () => setActions(n => n + 1) }}>{label}</Button>;
    const badge = <Badge variant="success">검토 완료</Badge>;
    return <KjunProvider {...(native ? { colors: demoPalettes.default, fontFamily: demoFont } : {})}>
      <main style={{ display: 'grid', gap: 24, width: 240, maxWidth: '100%', background: '#f4f4f4', padding: 0 }}>
        <div data-case="short-header"><Card header={badge} headerActions={button('상세 보기')}>카드 본문</Card></div>
        <div data-case="title-only"><Card title="제목만 있는 카드" dividers /></div>
        <div data-case="media-only"><Card radius="lg" media={<div style={{ height: 96, background: '#7ba796' }} />} /></div>
        <div data-case="long-action"><Card header={badge} headerActions={button('전체 프로젝트 변경 내역 확인하기')}>카드 본문</Card></div>
        <div data-case="two-actions"><Card title="프로젝트 현황" headerActions={<>{button('문서 추가')}{button('전체 보기')}</>}>카드 본문</Card></div>
        <div data-case="actions-only"><Card headerActions={button('상세 보기')}>카드 본문</Card></div>
        <div data-case="footer-only"><Card dividers footer={button('저장')} /></div>
        <div data-case="header-footer"><Card title="카드 제목" dividers footer={button('저장')} /></div>
        <div data-case="empty-fragment"><Card title="제목만 있는 카드"><>{null}{false}{[]}{'   '}</></Card></div>
        <div data-case="body-toggle"><Card title="카드 제목">{body ? '카드 본문' : null}</Card></div>
        <div data-case="zero"><Card>{0}</Card></div>
      </main>
      <Button {...{ [native ? 'onPress' : 'onClick']: () => setBody(value => !value) }}>본문 전환</Button>
      <output data-testid="actions">{actions}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
