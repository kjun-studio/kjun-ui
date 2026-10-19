import { createApp, defineComponent, h as create, reactive, ref } from 'vue';
// JSX compiles to h(), so the case adapter needs its own name.
import * as K from '@kjun-ui/vue3';
import { initial, renderCases } from './visual-contract-cases';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const state = reactive({ ...initial });
// A Vue ref passed straight to returnFocus, which Vue does not unwrap inside props.
const refTarget = ref<HTMLElement | null>(null), refOpen = ref(false);
const px = (value: unknown) => typeof value === 'number' ? `${value}px` : value;
// Adapts the shared React-shaped cases to Vue 3: value/onValueChange become v-model, open/onOpenChange v-model:open, slots stay slots.
const adapt = (name: string, props: any, children?: any, slots?: any): any => {
  if (name === 'Section') return <section key={props.id} data-testid={props.id} style={{ marginBottom: '24px', ...props.style, width: px(props.style?.width), height: px(props.style?.height) }}>{children}</section>;
  if (name === 'Output') return <output key={props.id} data-testid={props.id} style={{ display: 'block', overflowWrap: 'anywhere', fontSize: '12px' }}>{children}</output>;
  if (name === 'Text') return <p style={{ margin: 0 }}>{children}</p>;
  if (name === 'Label') return <label for={props.for}>{children}</label>;
  const component = (K as any)[name], passed: any = { ...props };
  if ('onValueChange' in passed) { passed['onUpdate:modelValue'] = passed.onValueChange; delete passed.onValueChange; }
  if ('onOpenChange' in passed) { passed['onUpdate:open'] = passed.onOpenChange; delete passed.onOpenChange; }
  if ('onSelectionChange' in passed) { passed['onUpdate:selected'] = passed.onSelectionChange; delete passed.onSelectionChange; }
  if ('value' in passed && 'modelValue' in component.props) { passed.modelValue = passed.value; delete passed.value; }
  const named = Object.fromEntries(Object.entries(slots || {}).map(([slot, node]) => [slot, () => node]));
  return create(component, passed, { ...(children == null ? {} : { default: () => children }), ...named });
};
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
