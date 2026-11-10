import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as split-pane-cases.tsx (React/Native).
const panes = (first = 'First', second = 'Second') => ({ first: () => <div>{first}</div>, second: () => <div>{second}</div> });
const App = defineComponent(() => {
  const sizes = ref<number[]>([]), commits = ref<number[]>([]), controlled = ref(0.5), width = ref(700);
  const box = (id: string, width: number, height: number, node: any) => <div data-testid={id} style={{ display: "flex", width: width + "px", height: height + "px" }}>{node}</div>;
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
    {box('basic', 700, 120, <K.KjunSplitPane ariaLabel="Basic" defaultSize={0.6} minSize={[200, 240]}
      onUpdate:size={(size: number) => { sizes.value = [...sizes.value, size]; }} onChange={(size: number) => { commits.value = [...commits.value, size]; }}>{panes()}</K.KjunSplitPane>)}
    <output data-testid="sizes">{JSON.stringify(sizes.value)}</output>
    <output data-testid="commits">{JSON.stringify(commits.value)}</output>
    {box('controlled', 700, 120, <K.KjunSplitPane ariaLabel="Controlled" size={controlled.value} onUpdate:size={(size: number) => { controlled.value = size; }}>{panes()}</K.KjunSplitPane>)}
    <K.KjunButton variant="secondary" onClick={() => { controlled.value = 0.3; }}>Set 30</K.KjunButton>
    <output data-testid="controlled-size">{controlled.value}</output>
    {box('vertical', 300, 300, <K.KjunSplitPane ariaLabel="Vertical" direction="vertical" minSize={[80, 80]}>{panes('Top', 'Bottom')}</K.KjunSplitPane>)}
    {box('disabled', 700, 120, <K.KjunSplitPane ariaLabel="Disabled" disabled>{panes()}</K.KjunSplitPane>)}
    {box('narrow', 400, 120, <K.KjunSplitPane ariaLabel="Narrow" minSize={[200, 240]}>{panes()}</K.KjunSplitPane>)}
    {box('resizable', width.value, 120, <K.KjunSplitPane ariaLabel="Resizable" defaultSize={0.6} minSize={[200, 240]}>{panes()}</K.KjunSplitPane>)}
    <K.KjunButton variant="secondary" onClick={() => { width.value = 420; }}>Shrink</K.KjunButton>
    <K.KjunButton variant="secondary" onClick={() => { width.value = 700; }}>Grow</K.KjunButton>
    {box('capped', 700, 120, <K.KjunSplitPane ariaLabel="Capped" maxSize={[300, null]}>{panes()}</K.KjunSplitPane>)}
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
