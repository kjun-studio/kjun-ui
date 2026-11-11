import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const emptyConfig = { width: 520, size: undefined as string | undefined, actions: 2, icon: 'search', text: '조건에 맞는 문서가 없습니다', description: '필터를 초기화하거나 새 문서를 만들어 보세요.' };
const s = reactive({ c: { ...emptyConfig } as any, events: 0 });
Object.assign(window, { configureEmpty: (next: object) => { s.c = { ...s.c, ...next }; } });
const press = () => { s.events++; };
createApp(defineComponent(() => () => {
  const c = s.c, labels = ['필터 초기화', '새 문서'].slice(0, c.actions);
  return <K.KjunProvider><div style={{ padding: '24px' }}>
    <div data-testid="region" style={{ width: c.width + 'px' }}>
      <K.KjunEmpty size={c.size} icon={c.icon} text={c.text} description={c.description}>
        {labels.length ? labels.map((label, i) => <K.KjunButton key={label} variant={i === labels.length - 1 ? 'primary' : 'secondary'} onClick={press}>{label}</K.KjunButton>) : undefined}
      </K.KjunEmpty>
    </div>
    <output data-testid="events">{s.events}</output>
  </div></K.KjunProvider>;
})).mount('#root');
