import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';

cssPalette();
const custom = new URLSearchParams(location.search).has('custom');
// A bottom drawer with handle, header actions, a description and a focus target for after the close.
const App = defineComponent(() => {
  const s = reactive({ open: false, resets: 0 });
  return () => <K.KjunProvider>
    <K.KjunButton onClick={() => s.open = true}>열기</K.KjunButton>
    <button id="after-close" type="button">다른 곳</button>
    <output data-testid="state">{s.open ? 'open' : 'closed'}</output><output data-testid="resets">{s.resets}</output>
    <K.KjunDrawer open={s.open} onUpdate:open={(v: boolean) => s.open = v} position="bottom" handle title={custom ? undefined : '필터'}
      ariaDescribedBy="drawer-desc" returnFocus={() => document.getElementById('after-close')}>
      {{
        default: () => <p id="drawer-desc">조건을 고르면 목록이 바뀝니다.</p>,
        ...(custom ? { header: () => <strong>맞춤 제목</strong> } : {}),
        headerActions: () => <K.KjunButton variant="ghost" size="sm" onClick={() => s.resets++}>초기화</K.KjunButton>,
        footer: () => [<K.KjunButton variant="secondary" onClick={() => s.open = false}>취소</K.KjunButton>, <K.KjunButton onClick={() => s.open = false}>적용</K.KjunButton>],
      }}
    </K.KjunDrawer>
  </K.KjunProvider>;
});
createApp(App).mount('#root');
