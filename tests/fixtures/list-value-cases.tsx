// Rows with a value at the end and a bar below the text: the value's length must not change the bar's width.
const rows = [['식비', '이번 달 예산의 82%를 썼어요', '412,300원'], ['교통', '예산의 35%', '52,000원'], ['주거·관리비', '고정 지출, 매달 25일 자동이체', '1,250,000원']];
export function ListValueCases({ K, native = false }: { K: any; native?: boolean }) {
  // Native has no plain element to measure, so its rows carry a progress bar.
  const bar = (_name: string) => native
    ? <K.KjunProgress value={50} />
    : <div data-bar="" style={{ height: 6, background: '#888' }} />;
  const section = (position: 'side' | 'title') => <div data-testid={position} style={{ width: 360 }}>
    <K.KjunListSection title={position}>
      {rows.map(([title, description, value]) =>
        <K.KjunListRow key={title} title={title} description={description} trailing={value} trailingPosition={position} chevron {...(native ? { onPress: () => {} } : { onClick: () => {} })}>{bar(title)}</K.KjunListRow>)}
    </K.KjunListSection>
  </div>;
  return <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>{section('side')}{section('title')}</div>;
}
