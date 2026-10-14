import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { accordionConfig, setupAccordionColors } from './accordion-design-data';
setupAccordionColors();
const s = reactive({ config: { ...accordionConfig } as any });
Object.assign(window, { configureAccordion: (next: object) => { s.config = { ...s.config, ...next }; } });
createApp(defineComponent(() => () => {
  const config = s.config;
  return <K.KjunProvider><main style={{ padding: '16px' }}><div data-testid="frame">
    <K.KjunAccordion tone={config.tone} multiple={config.multiple}>
      <K.KjunAccordionItem title={config.title} disabled={config.disabled}>
        {config.action ? <K.KjunButton variant="ghost" size="sm">본문 행동</K.KjunButton> : config.body}
      </K.KjunAccordionItem>
      <K.KjunAccordionItem title="알림 설정">알림을 받을 방식을 선택하세요.</K.KjunAccordionItem>
    </K.KjunAccordion>
  </div></main></K.KjunProvider>;
})).mount('#root');
