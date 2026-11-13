import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const emptyConfig = {
  width: 520, size: undefined as string | undefined, actions: 2, icon: 'search', text: '조건에 맞는 문서가 없습니다', description: '필터를 초기화하거나 새 문서를 만들어 보세요.',
  emptyChildren: false, innerParagraph: false, rootStyle: false, descriptionNode: false, iconNode: false, headingLevel: undefined as number | undefined, live: undefined as string | undefined, inList: false,
};
const s = reactive({ c: { ...emptyConfig } as any, events: 0 });
Object.assign(window, { configureEmpty: (next: object) => { s.c = { ...s.c, ...next }; } });
const press = () => { s.events++; };
createApp(defineComponent(() => () => {
  const c = s.c, labels = ['필터 초기화', '새 문서'].slice(0, c.actions);
  const buttons = labels.map((label, i) => <K.KjunButton key={label} variant={i === labels.length - 1 ? 'primary' : 'secondary'} onClick={press}>{label}</K.KjunButton>);
  const slots: Record<string, () => any> = {};
  if (c.emptyChildren) slots.default = () => [];
  else if (c.innerParagraph) slots.default = () => [<p data-testid="inner">안내 문단</p>, ...buttons];
  else if (labels.length) slots.default = () => buttons;
  if (c.iconNode) slots.icon = () => <K.KjunIcon name="inbox" size={40} />;
  if (c.descriptionNode) slots.description = () => <K.KjunText tone="secondary">노드로 넣은 설명</K.KjunText>;
  const empty = () => <K.KjunEmpty size={c.size} text={c.text} headingLevel={c.headingLevel} live={c.live}
    icon={c.iconNode ? undefined : c.icon} description={c.descriptionNode ? undefined : c.description}
    {...(c.rootStyle ? { style: { backgroundColor: 'rgb(1, 2, 3)' }, class: 'app-empty' } : {})}>{slots}</K.KjunEmpty>;
  return <K.KjunProvider><div style={{ padding: '24px' }}>
    <div data-testid="region" style={{ width: c.width + 'px' }}>
      {c.inList ? <K.KjunListSection title="목록">{{ default: () => [], empty }}</K.KjunListSection> : empty()}
    </div>
    <output data-testid="events">{s.events}</output>
  </div></K.KjunProvider>;
})).mount('#root');
