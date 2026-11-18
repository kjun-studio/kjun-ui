import { createApp, defineComponent, nextTick, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { popoverConfig, setupPopoverColors } from './popover-design-data';
setupPopoverColors();
const state = reactive({ config: { ...popoverConfig } as any, open: false });
Object.assign(window, { configurePopover: async (next: object) => { state.config = { ...state.config, ...next }; await nextTick(); } });
createApp(defineComponent(() => () => {
  const c = state.config;
  return <K.KjunProvider>{{ default: () => (
    <main>
      <div data-testid="anchor" style={{ position: 'absolute', left: c.left + 'px', top: c.top + 'px', width: c.width + 'px' }}>
        <K.KjunPopover manualTrigger open={state.open} ariaLabel={c.noLabel ? undefined : "팝오버 디자인"} placement={c.placement} noPadding={c.noPadding}
          matchTriggerWidth={c.matchTriggerWidth} width={c.panelWidth} maxHeight={c.maxHeight} focusOnOpen onUpdate:open={(value: boolean) => { state.open = value; }}>
          {{
            trigger: () => <K.KjunButton block variant="ghost" onClick={() => { state.open = !state.open; }}>팝오버 열기</K.KjunButton>,
            default: () => c.lines ? Array.from({ length: c.lines }, (_, i) => <K.KjunText key={i}>{`줄 ${i + 1}`}</K.KjunText>)
              : c.formActions ? [c.text, <K.KjunFormActions confirmText="확인" cancelText="취소" />]
              : c.action ? [c.text, <K.KjunButton>실행</K.KjunButton>] : c.text,
            ...(c.header ? { header: () => '팝오버 제목' } : {}),
            ...(c.footer ? { footer: () => <K.KjunFormActions confirmText="적용" cancelText="초기화" /> } : {}),
          }}
        </K.KjunPopover>
      </div>
      <output data-testid="open">{String(state.open)}</output>
    </main>
  ) }}</K.KjunProvider>;
})).mount('#root');
