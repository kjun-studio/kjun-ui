import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DsButton, DsDrawer, DsModal, KjunFeedbackProvider, KjunProvider, useKjunFeedback } from '@kjun/react';
import { cssPalette } from './typography-values';

cssPalette();
const query = new URLSearchParams(location.search);
const FirstWindow = query.get('kind') === 'drawer' ? DsDrawer : DsModal;

function Editor() {
  const [count, setCount] = useState(0);
  return <>
    <label>Draft<input aria-label="Draft" defaultValue="Original" /></label>
    <DsButton onClick={() => setCount(value => value + 1)}>Edit count {count}</DsButton>
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
  const next = <DsModal open={second} onOpenChange={setSecond} title="Second window">
    <DsButton onClick={() => setActions(value => value + 1)}>Second action</DsButton>
  </DsModal>;
  return <>
    <DsButton onClick={() => setFirst(true)}>Open first</DsButton>
    <DsButton onClick={() => setActions(value => value + 1)}>Page action</DsButton>
    <output data-testid="actions">{actions}</output>
    <FirstWindow open={first} onOpenChange={setFirst} title="First window">
      <Editor />
      <DsButton onClick={reopen}>Reopen first over second</DsButton>
    </FirstWindow>
    {query.has('nested') ? <KjunProvider>{next}</KjunProvider> : next}
  </>;
}

createRoot(document.getElementById('root')!).render(
  <KjunProvider><KjunFeedbackProvider><Cases /></KjunFeedbackProvider></KjunProvider>,
);
