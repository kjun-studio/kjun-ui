import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const s = reactive({ c: { broken: true, key: 'a', custom: false, size: 'md' } as any, log: [] as string[], handlerErrors: [] as string[] });
Object.assign(window, { configureBoundary: (next: object) => { s.c = { ...s.c, ...next }; } });
const Broken = defineComponent(() => () => { if (s.c.broken) throw new Error('child failed'); return <K.KjunText>Recovered</K.KjunText>; });
// A click handler error is not a render error: React's boundary never sees it, so this one passes it on.
const Clicker = defineComponent(() => () => <button type="button" onClick={() => { throw new Error('handler failed'); }}>Throw in handler</button>);
const app = createApp(defineComponent(() => () => <K.KjunProvider><div style={{ padding: '24px', width: '360px' }}>
  <div data-testid="boundary">
    <K.KjunErrorBoundary size={s.c.size} resetKeys={[s.c.key]} onReset={() => s.log.push('reset')}>
      {{
        default: () => [<Broken />, <Clicker />],
        ...(s.c.custom ? { fallback: ({ error, reset }: { error: Error; reset: () => void }) => <K.KjunButton onClick={reset}>{'Custom ' + error.message}</K.KjunButton> } : {}),
      }}
    </K.KjunErrorBoundary>
  </div>
  <output data-testid="log">{s.log.join(',')}</output>
  <output data-testid="handler-errors">{s.handlerErrors.join(',')}</output>
</div></K.KjunProvider>));
app.config.errorHandler = (error) => { s.handlerErrors.push((error as Error).message); };
app.mount('#root');
