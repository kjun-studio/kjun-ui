import { createApp, defineComponent, reactive, ref } from 'vue';
// JSX compiles to h(), so the case adapter needs its own name.
import * as K from '@kjun-ui/vue3';
import { initial, renderCases } from './visual-contract-cases';
import { adaptCase as adapt } from './case-adapter-vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const state = reactive({ ...initial });
// A Vue ref passed straight to returnFocus, which Vue does not unwrap inside props.
const refTarget = ref<HTMLElement | null>(null), refOpen = ref(false);
createApp(defineComponent(() => () => <K.KjunProvider>
  <main style={{ padding: '16px', maxWidth: '800px' }}>{renderCases(adapt, { ...state }, (key, value) => { (state as any)[key] = value; })}
    <section data-testid="vue-ref-return">
      <K.KjunPopover open={refOpen.value} {...{ 'onUpdate:open': (v: boolean) => { refOpen.value = v; } }} manualTrigger ariaLabel="ref 팝오버" returnFocus={refTarget as any}>
        {{ trigger: () => <K.KjunButton onClick={() => { refOpen.value = !refOpen.value; }}>ref 시험 열기</K.KjunButton>, default: () => <p>ref 팝오버 내용</p> }}
      </K.KjunPopover>
      <button ref={refTarget}>ref 대상 버튼</button>
    </section>
  </main>
</K.KjunProvider>)).mount('#root');
