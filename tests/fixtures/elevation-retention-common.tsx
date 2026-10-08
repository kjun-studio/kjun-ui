import { createElement as h, createContext, useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { cssPalette, palette, demoFont } from './typography-values';

const DraftContext = createContext('missing context');
export function mountRetention(K: any, native: boolean) {
  cssPalette();
  const query = new URLSearchParams(location.search);
  const First = query.get('kind') === 'drawer' ? K.DsDrawer : K.DsModal;
  const provider = native ? { colors: palette(), fontFamily: demoFont } : {};
  const button = (label: string, action: () => void) => h(K.DsButton, { [native ? 'onPress' : 'onClick']: action }, label);
  function Editor() {
    const [draft, setDraft] = useState('Original'), [count, setCount] = useState(0);
    const context = useContext(DraftContext);
    return h('div', null,
      h(K.DsTextarea, { ariaLabel: 'Draft', value: draft,
        ...(native ? { onChangeText: setDraft } : { onChange: (event: any) => setDraft(event.target.value) }) }),
      button('Edit count ' + count, () => setCount(value => value + 1)),
      h('span', { 'data-testid': 'draft-context' }, context));
  }
  function Cases() {
    const [first, setFirst] = useState(false), [second, setSecond] = useState(false);
    const [actions, setActions] = useState(0), [mounted, setMounted] = useState(true);
    const feedback = K.useKjunFeedback();
    Object.assign(window, { retention: {
      // Commit each step even when a busy browser delays both timers to one turn.
      reopen() { flushSync(() => setFirst(false)); if (query.has('interleaved')) setTimeout(() => flushSync(() => setSecond(true)), 20); setTimeout(() => flushSync(() => setFirst(true)), query.has('interleaved') ? 60 : 30); },
      toast: () => feedback.toast.info('Retained result', { duration: 0, action: { label: 'Toast action', onClick: () => setActions(value => value + 1) } }),
      unmount: () => setMounted(false),
    } });
    return h('div', null,
      button('Open first', () => setFirst(true)), button('Page action', () => setActions(value => value + 1)),
      h('output', { 'data-testid': 'actions' }, actions),
      mounted && h(DraftContext.Provider, { value: 'Project context' },
        h(First, { open: first, onOpenChange: setFirst, title: 'First window' }, h(Editor))),
      mounted && h(K.KjunProvider, provider,
        h(K.DsModal, { open: second, onOpenChange: setSecond, title: 'Second window' }, button('Second action', () => setActions(value => value + 1)))));
  }
  createRoot(document.getElementById('root')!).render(h(K.KjunProvider, provider, h(K.KjunFeedbackProvider, null, h(Cases))));
}
