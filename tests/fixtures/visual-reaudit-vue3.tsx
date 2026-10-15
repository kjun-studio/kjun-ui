import { createApp, defineComponent, h as create, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { initial, renderAudit, palette, auditColors } from './visual-reaudit-cases';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(palette);
for (const [key, value] of Object.entries(auditColors)) document.documentElement.style.setProperty('--kjun-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
const state = reactive({ ...initial });
// Adapts the shared React-shaped audit description: value/onValueChange become v-model, ReactNode props become slots.
// Not named `h`: the JSX in this file compiles to the injected `h`.
const adapt = (name: string, props: any, children?: any, slots?: any): any => {
  if (name === 'Section') return <section key={props.id} data-testid={props.id} style={{ marginBottom: '24px', minWidth: 0 }}>{children}</section>;
  if (name === 'Output') return <output data-testid="state" style={{ display: 'block', overflowWrap: 'anywhere' }}>{children}</output>;
  const { value, onValueChange, ...passed } = props;
  if ('value' in props) passed.modelValue = value;
  if (onValueChange) passed['onUpdate:modelValue'] = onValueChange;
  const named = Object.fromEntries(Object.entries(slots || {}).map(([slot, node]) => [slot, () => node]));
  return create((K as any)[name], passed, children == null ? named : { default: () => children, ...named });
};
createApp(defineComponent(() => () => <K.KjunProvider>
  <main style={{ padding: '16px', minWidth: 0 }}>{renderAudit(adapt, { ...state }, (key, next) => { (state as any)[key] = next; })}</main>
</K.KjunProvider>)).mount('#root');
