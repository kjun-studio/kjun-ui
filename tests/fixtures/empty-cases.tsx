import { useLayoutEffect, useState } from 'react';
export const emptyConfig = {
  width: 520, size: undefined as string | undefined, actions: 2, icon: 'search', text: '조건에 맞는 문서가 없습니다', description: '필터를 초기화하거나 새 문서를 만들어 보세요.',
  emptyChildren: false, innerParagraph: false, rootStyle: false, descriptionNode: false, iconNode: false, headingLevel: undefined as number | undefined, live: undefined as string | undefined, inList: false,
};
export function EmptyCases({ K, web }: { K: any; web: boolean }) {
  const [c, setConfig] = useState<any>(emptyConfig);
  const [events, setEvents] = useState(0);
  useLayoutEffect(() => { Object.assign(window, { configureEmpty: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const press = () => setEvents(n => n + 1);
  const labels = ['필터 초기화', '새 문서'].slice(0, c.actions);
  const buttons = labels.map((label, i) => <K.KjunButton key={label} variant={i === labels.length - 1 ? 'primary' : 'secondary'} onClick={press} onPress={press}>{label}</K.KjunButton>);
  const children = c.emptyChildren ? [] : c.innerParagraph ? [<p key="p" data-testid="inner">안내 문단</p>, ...buttons] : labels.length ? buttons : null;
  const empty = <K.KjunEmpty
    size={c.size} text={c.text} headingLevel={c.headingLevel} live={c.live}
    icon={c.iconNode ? <K.KjunIcon name="inbox" size={40} /> : c.icon}
    description={c.descriptionNode ? <K.KjunText tone="secondary">노드로 넣은 설명</K.KjunText> : c.description}
    {...(c.rootStyle ? { style: { backgroundColor: 'rgb(1, 2, 3)' }, ...(web ? { className: 'app-empty' } : {}) } : {})}>
    {children}
  </K.KjunEmpty>;
  return <div style={{ padding: 24 }}>
    <div data-testid="region" style={{ width: c.width }}>
      {c.inList ? <K.KjunListSection title="목록" empty={empty}>{[]}</K.KjunListSection> : empty}
    </div>
    <output data-testid="events">{events}</output>
  </div>;
}
