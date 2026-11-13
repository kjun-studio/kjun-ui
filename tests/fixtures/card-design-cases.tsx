import { useLayoutEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoDomainPalettes, demoFont } from '../../shared/demo-colors';

export const longTitle = '분기별 프로젝트 운영 현황과 다음 단계 계획서';
export const longSubtitle = '팀 전체가 함께 관리하는 문서와 최근 활동 기록을 모았습니다';

export function renderCardDesign(K: any, native = false) {
  applyDemoColors('default');
  const { KjunProvider, KjunCard: Card, KjunButton: Button, KjunBadge: Badge, KjunListSection: ListSection, KjunListRow: ListRow, KjunText: Text } = K;
  function App() {
    const [presses, setPresses] = useState(0), [nested, setNested] = useState(false);
    useLayoutEffect(() => { Object.assign(window, { addNestedControl: () => setNested(true) }); }, []);
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
        <div data-case="pressable" style={{ width: 300 }}><Card title="눌리는 카드" pressable {...press}>{nested ? <a href="#x">안쪽 링크</a> : '본문'}</Card></div>
        <div data-case="tint-list" style={{ width: 300 }}><Card surface="muted" title="목록 카드"><ListSection><ListRow title="목록 행" badge={<Badge variant="success">새 항목</Badge>} /></ListSection></Card></div>
        <div data-case="two-line" style={{ width: 260 }}><Card title="두 줄로 넘어가는 아주 긴 카드 제목" headerActions={<Badge variant="success">진행</Badge>}>본문</Card></div>
        <div data-case="side-media" style={{ width: 420 }}><Card mediaPosition="start" media={<div data-testid="side-media" style={{ background: '#7ba796' }} />} title="가로 카드" footer={button('열기')}>썸네일 옆 본문</Card></div>
        <div data-case="aspect" style={{ width: 320 }}><Card mediaAspect="wide" media={<div data-testid="aspect-media" style={{ background: '#7ba796' }} />} title="비율 카드">본문</Card></div>
        <div data-case="node-title" style={{ width: 300 }}><Card title={<Text>노드 제목 12</Text>}>본문</Card></div>
      </main>
      <output data-testid="presses">{presses}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
