import { h as create } from 'vue';
// JSX compiles to h(), so the case adapter needs its own name.
import * as K from '@kjun-ui/vue3';
const px = (value: unknown) => typeof value === 'number' ? `${value}px` : value;
// Adapts the shared React-shaped cases to Vue 3: value/onValueChange become v-model, open/onOpenChange v-model:open, slots stay slots.
export const adaptCase = (name: string, props: any, children?: any, slots?: any): any => {
  if (name === 'Section') return <section key={props.id} data-testid={props.id} style={{ marginBottom: '24px', ...props.style, width: px(props.style?.width), height: px(props.style?.height) }}>{children}</section>;
  if (name === 'Box') return <div key={props.testId} data-testid={props.testId} style={props.style} />;
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
