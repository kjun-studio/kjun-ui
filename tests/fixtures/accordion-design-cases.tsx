import { useState } from 'react';
import { flushSync } from 'react-dom';
import { accordionConfig } from './accordion-design-data';
export function AccordionDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(accordionConfig);
  Object.assign(window, { configureAccordion: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) });
  return <main style={{ padding: 16 }}><div data-testid="frame">
    <K.KjunAccordion tone={config.tone} multiple={config.multiple} divider={config.divider} separated={config.separated} headingLevel={config.headingLevel} region={config.region}>
      <K.KjunAccordionItem title={config.title} disabled={config.disabled} icon={config.icon || undefined} description={config.description || undefined}
        header={config.custom ? <K.KjunText>⚙︎</K.KjunText> : undefined} ariaLabel={config.custom ? '계정 설정 열기' : undefined}>
        {config.action ? <K.KjunButton variant="ghost" size="sm">본문 행동</K.KjunButton> : config.body}
      </K.KjunAccordionItem>
      <K.KjunAccordionItem title="알림 설정">알림을 받을 방식을 선택하세요.</K.KjunAccordionItem>
    </K.KjunAccordion>
  </div></main>;
}
