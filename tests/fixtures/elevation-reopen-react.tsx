import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunButton, KjunDrawer, KjunModal, KjunFeedbackProvider, KjunProvider, useKjunFeedback } from '@kjun-ui/react';
import { cssPalette } from './typography-values';

cssPalette();
const query = new URLSearchParams(location.search);
const FirstWindow = query.get('kind') === 'drawer' ? KjunDrawer : KjunModal;

function Editor() {
  const [count, setCount] = useState(0);
  return <>
    <label>Draft<input aria-label="Draft" defaultValue="Original" /></label>
    <KjunButton onClick={() => setCount(value => value + 1)}>Edit count {count}</KjunButton>
  </>;
}

function Cases() {
  const [first, setFirst] = useState(false), [second, setSecond] = useState(false);
  const [actions, setActions] = useState(0);
  const feedback = useKjunFeedback();
  const reopen = () => {
    setFirst(false);
    setTimeout(() => setSecond(true), 20);
    setTimeout(() => setFirst(true), 60);
  };
  Object.assign(window, { elevationReopen: {
    reopen,
    toast: (duration = 0) => feedback.toast.info('Persistent result', {
      duration, action: { label: 'Toast action', onClick: () => setActions(value => value + 1) },
    }),
  } });
  const next = <KjunModal open={second} onOpenChange={setSecond} title="Second window">
    <KjunButton onClick={() => setActions(value => value + 1)}>Second action</KjunButton>
  </KjunModal>;
  return <>
    <KjunButton onClick={() => setFirst(true)}>Open first</KjunButton>
    <KjunButton onClick={() => setActions(value => value + 1)}>Page action</KjunButton>
    <output data-testid="actions">{actions}</output>
    <FirstWindow open={first} onOpenChange={setFirst} title="First window">
      <Editor />
      <KjunButton onClick={reopen}>Reopen first over second</KjunButton>
    </FirstWindow>
    {query.has('nested') ? <KjunProvider>{next}</KjunProvider> : next}
  </>;
}

createRoot(document.getElementById('root')!).render(
  <KjunProvider><KjunFeedbackProvider><Cases /></KjunFeedbackProvider></KjunProvider>,
);
