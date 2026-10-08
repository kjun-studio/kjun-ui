import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { initial, renderAudit, palette, auditColors } from './visual-reaudit-cases';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(palette);
for (const [key, value] of Object.entries(auditColors)) document.documentElement.style.setProperty('--kjun-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
new Vue({
  data: () => ({ ...initial }),
  render(create) {
    const h = (name: string, props: any, children?: any, slots?: any): any => {
      if (name === 'Section') return create('section', { key: props.id, attrs: { 'data-testid': props.id }, style: { marginBottom: '24px', minWidth: 0 } }, [children]);
      if (name === 'Output') return create('output', { attrs: { 'data-testid': 'state' }, style: { display: 'block', overflowWrap: 'anywhere' } }, [children]);
      const on: any = {}, passed = { ...props };
      for (const [key, event] of Object.entries({ onClick: 'click', onValueChange: 'input', onSort: 'sort' })) if (passed[key]) { on[event] = passed[key]; delete passed[key]; }
      if (name === 'DsSkeleton') for (const key of ['width', 'height']) if (typeof passed[key] === 'number') passed[key] += 'px';
      if (name === 'DsIcon') passed.size = String(passed.size);
      const nodes = Array.isArray(children) ? children : children == null ? [] : [children];
      const named = Object.entries(slots || {}).map(([slot, node]) => create('template', { slot }, [node as any]));
      return create((K as any)[name], { props: passed, on }, [...nodes, ...named]);
    };
    return create(K.KjunProvider, [create('main', { style: { padding: '16px', minWidth: 0 } }, renderAudit(h, Object.fromEntries(Object.keys(initial).map(key => [key, (this as any)[key]])) as typeof initial, (key, value) => { (this as any)[key] = value; }))]);
  },
}).$mount('#root');
