import { useState } from 'react';

// One KjunProvider per region; each region's controls are named after it so tests can open them in isolation.
export const regions = [
  { id: 'en', locale: 'en-US' },
  { id: 'ja', locale: 'ja-JP', messages: { cancel: 'キャンセル' } },
  { id: 'props', locale: 'en-US', cancelText: '그만' },
  { id: 'invalid', locale: 'xx_!!' },
  { id: 'none' },
] as const;

function Region({ K, id, cancelText, native }: { K: any; id: string; cancelText?: string; native?: boolean }) {
  const feedback = K.useKjunFeedback();
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  const [modal, setModal] = useState(false);
  return <div data-testid={'region-' + id}>
    <K.KjunButton {...press(() => feedback.confirm({ message: 'Proceed ' + id, cancelText }))}>{'confirm ' + id}</K.KjunButton>
    <K.KjunButton {...press(() => setModal(true))}>{'modal ' + id}</K.KjunButton>
    <K.KjunModal open={modal} onOpenChange={setModal} title={'Modal ' + id}><K.KjunButton {...press(() => setModal(false))}>{'done ' + id}</K.KjunButton></K.KjunModal>
    <K.KjunPagination totalPages={3} currentPage={2} onPageChange={() => {}} />
    <K.KjunEmpty />
    <K.KjunDatePicker value="2026-10-23" onChange={() => {}} />
  </div>;
}

// An app that loads its language later: state under the Provider must survive the locale arriving.
function LateLocale({ K, native, providerProps }: { K: any; native: boolean; providerProps: Record<string, unknown> }) {
  const [locale, setLocale] = useState<string | undefined>();
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  return <div data-testid="region-late"><K.KjunProvider {...providerProps} locale={locale}>
    <Counter K={K} native={native} />
    <K.KjunButton {...press(() => setLocale('en-US'))}>load locale</K.KjunButton>
    <K.KjunEmpty />
  </K.KjunProvider></div>;
}
function Counter({ K, native }: { K: any; native: boolean }) {
  const [count, setCount] = useState(0);
  return <K.KjunButton {...(native ? { onPress: () => setCount(c => c + 1) } : { onClick: () => setCount(c => c + 1) })}>{'count ' + count}</K.KjunButton>;
}

export function I18nCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, unknown> }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }} data-native={native || undefined}>
    {regions.map(({ id, cancelText, ...props }: any) => <K.KjunProvider key={id} {...providerProps} {...props}>
      <K.KjunFeedbackProvider><Region K={K} id={id} cancelText={cancelText} native={native} /></K.KjunFeedbackProvider>
    </K.KjunProvider>)}
    <LateLocale K={K} native={native} providerProps={providerProps} />
  </div>;
}
