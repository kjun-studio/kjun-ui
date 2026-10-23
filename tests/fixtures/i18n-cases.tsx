import { useState } from 'react';

// One KjunProvider per region; each region's controls are named after it so tests can open them in isolation.
export const regions = [
  { id: 'en', locale: 'en-US' },
  { id: 'ja', locale: 'ja-JP', messages: { cancel: 'キャンセル' } },
  { id: 'props', locale: 'en-US', cancelText: '그만' },
  { id: 'invalid', locale: 'xx_!!' },
  { id: 'none' },
] as const;

function Region({ K, id, cancelText }: { K: any; id: string; cancelText?: string }) {
  const feedback = K.useKjunFeedback();
  const [modal, setModal] = useState(false);
  return <div data-testid={'region-' + id}>
    <K.KjunButton onClick={() => feedback.confirm({ message: 'Proceed ' + id, cancelText })}>{'confirm ' + id}</K.KjunButton>
    <K.KjunButton onClick={() => setModal(true)}>{'modal ' + id}</K.KjunButton>
    <K.KjunModal open={modal} onOpenChange={setModal} title={'Modal ' + id}><K.KjunButton onClick={() => setModal(false)}>{'done ' + id}</K.KjunButton></K.KjunModal>
    <K.KjunPagination totalPages={3} currentPage={2} onPageChange={() => {}} />
    <K.KjunEmpty />
    <K.KjunDatePicker value="2026-10-23" onChange={() => {}} />
  </div>;
}

export function I18nCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, unknown> }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }} data-native={native || undefined}>
    {regions.map(({ id, cancelText, ...props }: any) => <K.KjunProvider key={id} {...providerProps} {...props}>
      <K.KjunFeedbackProvider><Region K={K} id={id} cancelText={cancelText} /></K.KjunFeedbackProvider>
    </K.KjunProvider>)}
  </div>;
}
