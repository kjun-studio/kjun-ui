import { useState } from 'react';

// A row that opens its own content (a balance and how it was worked out), between ordinary rows.
export function ListExpandCases({ K, native = false }: { K: any; native?: boolean }) {
  const [open, setOpen] = useState(false), [plain, setPlain] = useState(true), [presses, setPresses] = useState(0);
  const press = native ? { onPress: () => setPresses(count => count + 1) } : { onClick: () => setPresses(count => count + 1) };
  return <div style={{ padding: 24, width: 380 }}>
    <K.KjunListSection title="자산">
      <K.KjunListRow title="현재 잔액" description="11월 16일 기준" icon="wallet" trailing="1,730,000원" expanded={open} onExpandedChange={setOpen}
        expandedContent={<div data-testid="breakdown"><div>지난달 이월 520,000원</div><K.KjunButton size="sm" variant="secondary" {...press}>계산 방식 보기</K.KjunButton></div>} />
      <K.KjunListRow title="이번 달 수입" icon="arrow-up-right" trailing="3,350,000원" />
      <K.KjunListRow title="아이콘 없는 행" expanded={plain} onExpandedChange={setPlain} expandedContent={<div data-testid="plain">펼친 내용</div>} />
      <K.KjunListRow title="잠긴 행" disabled expanded={false} onExpandedChange={setOpen} expandedContent="잠긴 내용" />
    </K.KjunListSection>
    <div data-testid="presses">{presses}</div>
  </div>;
}
