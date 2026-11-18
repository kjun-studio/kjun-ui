import { useState } from 'react';
import { flushSync } from 'react-dom';
import { accordionConfig, recordValue } from './accordion-design-data';
// Nothing is drawn for these, so the existing layout checks see the same page.
const settled = (event: string) => { ((window as any).accordionEvents ??= []).push(event); };
export function AccordionDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(accordionConfig);
  Object.assign(window, { configureAccordion: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) });
  return <main style={{ padding: 16 }}><div data-testid="frame">
    <K.KjunAccordion tone={config.tone} multiple={config.multiple} divider={config.divider} separated={config.separated} headingLevel={config.headingLevel} region={config.region}
      value={config.value} onValueChange={(value: string[]) => { recordValue(value); if (config.follow) setConfig(old => ({ ...old, value })); }}>
      <K.KjunAccordionItem value="account" trailing={config.trailing || undefined} title={config.title} disabled={config.disabled} icon={config.icon || undefined} description={config.description || undefined}
        header={config.custom ? <K.KjunText>⚙︎</K.KjunText> : undefined} ariaLabel={config.custom ? '계정 설정 열기' : undefined}>
        {config.action ? <K.KjunButton variant="ghost" size="sm">본문 행동</K.KjunButton> : config.body}
      </K.KjunAccordionItem>
      <K.KjunAccordionItem value="notify" title="알림 설정" onAfterOpen={() => settled('open')} onAfterClose={() => settled('close')}>알림을 받을 방식을 선택하세요.</K.KjunAccordionItem>
      {/* Items inside a fragment still know which one is last. */}
      {config.extra && <><K.KjunAccordionItem value="privacy" title="개인정보">공개 범위</K.KjunAccordionItem><K.KjunAccordionItem value="billing" title="결제">결제 수단</K.KjunAccordionItem></>}
    </K.KjunAccordion>
  </div></main>;
}
