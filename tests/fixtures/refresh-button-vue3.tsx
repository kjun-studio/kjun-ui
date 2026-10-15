import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const config = reactive<any>({ size: 'sm', variant: 'ghost', disabled: false, loading: location.search.includes('loading'), block: false });
const events = ref(0);
Object.assign(window, { configureRefresh: (next: object) => Object.assign(config, next) });
const box = (id: string, child: any) => <div data-testid={id} style={{ width: config.block ? '300px' : undefined }}>{child}</div>;
createApp(defineComponent(() => () => <K.KjunProvider>
  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
    {box('icon', <K.KjunRefreshButton {...config} targetName="목록" onRefresh={() => events.value++} />)}
    {box('text', <K.KjunRefreshButton {...config} mode="text" targetName="목록" onRefresh={() => events.value++} />)}
    {box('reference', <K.KjunButton {...config} prefixIcon="refresh">새로고침</K.KjunButton>)}
    <button data-testid="outside">바깥 버튼</button>
    <output data-testid="events">{events.value}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>
</K.KjunProvider>)).mount('#root');
