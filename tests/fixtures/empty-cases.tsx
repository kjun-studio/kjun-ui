import { useLayoutEffect, useState } from 'react';
export const emptyConfig = { width: 520, size: undefined as string | undefined, actions: 2, icon: 'search', text: '조건에 맞는 문서가 없습니다', description: '필터를 초기화하거나 새 문서를 만들어 보세요.' };
export function EmptyCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>(emptyConfig);
  const [events, setEvents] = useState(0);
  useLayoutEffect(() => { Object.assign(window, { configureEmpty: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const press = () => setEvents(n => n + 1);
  const labels = ['필터 초기화', '새 문서'].slice(0, c.actions);
  return <div style={{ padding: 24 }}>
    <div data-testid="region" style={{ width: c.width }}>
      <K.KjunEmpty size={c.size} icon={c.icon} text={c.text} description={c.description}>
        {labels.length ? labels.map((label, i) => <K.KjunButton key={label} variant={i === labels.length - 1 ? 'primary' : 'secondary'} onClick={press} onPress={press}>{label}</K.KjunButton>) : null}
      </K.KjunEmpty>
    </div>
    <output data-testid="events">{events}</output>
  </div>;
}
