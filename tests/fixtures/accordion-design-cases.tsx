import { useState } from 'react';
import { flushSync } from 'react-dom';
import { accordionConfig } from './accordion-design-data';
export function AccordionDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(accordionConfig);
  Object.assign(window, { configureAccordion: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) });
  return <main style={{ padding: 16 }}><div data-testid="frame">
    <K.DsAccordion tone={config.tone} multiple={config.multiple}>
      <K.DsAccordionItem title={config.title} disabled={config.disabled}>
        {config.action ? <K.DsButton variant="ghost" size="sm">본문 행동</K.DsButton> : config.body}
      </K.DsAccordionItem>
      <K.DsAccordionItem title="알림 설정">알림을 받을 방식을 선택하세요.</K.DsAccordionItem>
    </K.DsAccordion>
  </div></main>;
}
