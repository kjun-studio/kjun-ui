import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { accordionConfig, recordValue, setupAccordionColors } from './accordion-design-data';
setupAccordionColors();
const s = reactive({ config: { ...accordionConfig } as any });
Object.assign(window, { configureAccordion: (next: object) => { s.config = { ...s.config, ...next }; } });
const settled = (event: string) => { ((window as any).accordionEvents ??= []).push(event); };
createApp(defineComponent(() => () => {
  const config = s.config;
  return <K.KjunProvider><main style={{ padding: '16px' }}><div data-testid="frame">
    <K.KjunAccordion tone={config.tone} multiple={config.multiple} divider={config.divider} separated={config.separated} headingLevel={config.headingLevel} region={config.region}
      modelValue={config.value} {...{ 'onUpdate:modelValue': (value: string[]) => { recordValue(value); if (config.follow) s.config = { ...s.config, value }; } }}>
      <K.KjunAccordionItem value="account" title={config.title} disabled={config.disabled} icon={config.icon || undefined} description={config.description || undefined}
        ariaLabel={config.custom ? '계정 설정 열기' : undefined}>
        {{
          default: () => config.action ? <K.KjunButton variant="ghost" size="sm">본문 행동</K.KjunButton> : config.body,
          ...(config.custom ? { header: () => <span>⚙︎</span> } : {}),
          ...(config.trailing ? { trailing: () => config.trailing } : {}),
        }}
      </K.KjunAccordionItem>
      <K.KjunAccordionItem value="notify" title="알림 설정" onAfterOpen={() => settled('open')} onAfterClose={() => settled('close')}>알림을 받을 방식을 선택하세요.</K.KjunAccordionItem>
      {config.extra && <><K.KjunAccordionItem value="privacy" title="개인정보">{{ default: () => '공개 범위' }}</K.KjunAccordionItem><K.KjunAccordionItem value="billing" title="결제">{{ default: () => '결제 수단' }}</K.KjunAccordionItem></>}
    </K.KjunAccordion>
  </div></main></K.KjunProvider>;
})).mount('#root');
