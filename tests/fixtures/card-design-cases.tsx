import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoDomainPalettes, demoFont } from '../../shared/demo-colors';

export const longTitle = '분기별 프로젝트 운영 현황과 다음 단계 계획서';
export const longSubtitle = '팀 전체가 함께 관리하는 문서와 최근 활동 기록을 모았습니다';

export function renderCardDesign(K: any, native = false) {
  applyDemoColors('default');
  const { KjunProvider, KjunCard: Card, KjunButton: Button, KjunBadge: Badge } = K;
  function App() {
    const [presses, setPresses] = useState(0);
    const press = { [native ? 'onPress' : 'onClick']: () => setPresses(n => n + 1) };
    const button = (label: string, variant = 'secondary') => <Button variant={variant} {...press}>{label}</Button>;
    return <KjunProvider {...(native ? { colors: demoPalettes.default, domainColors: demoDomainPalettes.default, fontFamily: demoFont } : {})}>
      <main style={{ display: 'grid', gap: 24, padding: 24, background: '#f2f2f2', justifyItems: 'start' }}>
        <div data-case="wide" style={{ width: 520 }}><Card title="3분기 운영 현황" subtitle="팀 전체가 함께 관리하는 문서" headerActions={<Badge variant="success">진행 중</Badge>}
          footer={<>{button('나중에')}{button('프로젝트 보기', 'primary')}</>} footerAlign="end">이번 분기 문서를 검토했습니다.</Card></div>
        <div data-case="narrow" style={{ width: 300 }}><Card title={longTitle} subtitle={longSubtitle} headerActions={<Badge variant="success">진행 중</Badge>}>본문</Card></div>
        <div data-case="narrow-button" style={{ width: 300 }}><Card title="프로젝트 현황" headerActions={button('전체 프로젝트 내역 보기')}>본문</Card></div>
        <div data-case="success" style={{ width: 300 }}><Card surface="success" title="완료된 작업" headerActions={<Badge variant="success">완료</Badge>}>본문</Card></div>
        <div data-case="muted" style={{ width: 300 }}><Card surface="muted" title="보조 정보" headerActions={<Badge>보조</Badge>}>본문</Card></div>
        <div data-case="accent" style={{ width: 300 }}><Card surface="accent" title="강조">본문</Card></div>
        <div data-case="heading4" style={{ width: 300 }}><Card title="네 번째 수준 제목" headingLevel={4}>본문</Card></div>
        <div data-case="no-heading" style={{ width: 300 }}><Card title="제목 아님" headingLevel={false}>본문</Card></div>
        <div data-case="pressable" style={{ width: 300 }}><Card title="눌리는 카드" pressable {...press}>본문</Card></div>
      </main>
      <output data-testid="presses">{presses}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
